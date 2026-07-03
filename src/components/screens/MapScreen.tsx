import { useRef, type CSSProperties } from 'react';
import { fmt, initials, itemColor, statusMeta, transportColor } from '../../data/gameData';
import { aggregate, rollupWorld } from '../../state/derive';
import { buildFlows } from '../../state/flows';
import { useActions, useStore, useWorld } from '../../state/store';
import type { Factory } from '../../types';
import { FlowList, ItemSquare, MONO, ProducedRow, SG, SectionLabel, TransportBadge } from '../bits';

function chipStyle(active: boolean): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 11px',
    borderRadius: 7,
    fontSize: 12,
    cursor: 'pointer',
    border: `1px solid ${active ? '#33373F' : 'transparent'}`,
    background: active ? '#181B21' : 'transparent',
    color: active ? '#E7E9ED' : '#8A909A',
  };
}

interface Conn {
  key: string;
  a: string;
  b: string;
  items: { item: string; rate: number; t: string; from: string; to: string }[];
}

export function MapScreen() {
  const { st, up, openFactory } = useStore();
  const world = useWorld();
  const { openCreateFactory, movePin } = useActions();

  const viewEl = useRef<HTMLDivElement | null>(null);
  const mapEl = useRef<HTMLDivElement | null>(null);
  const panningRef = useRef(false);
  const dragRef = useRef<{ id: string; moved: boolean; startX: number; startY: number } | null>(null);
  const camRef = useRef({ zoom: st.zoom, panX: st.panX, panY: st.panY });
  camRef.current = { zoom: st.zoom, panX: st.panX, panY: st.panY };

  const facs = world.factories;

  // ----- camera helpers (ported from the prototype) -----
  const viewRect = () => {
    if (viewEl.current) return viewEl.current.getBoundingClientRect();
    if (mapEl.current?.parentElement) return mapEl.current.parentElement.getBoundingClientRect();
    return { left: 0, top: 0, width: 600, height: 600 } as DOMRect;
  };
  const baseSize = (v?: { width: number; height: number }) => {
    const r = v || viewRect();
    return Math.min(r.width, r.height);
  };
  const clampPan = (zoom: number, px: number, py: number, v?: DOMRect) => {
    const r = v || viewRect();
    const ns = baseSize(r) * zoom;
    const ox = (ns - r.width) / 2;
    const oy = (ns - r.height) / 2;
    return {
      x: ox > 0 ? Math.min(ox, Math.max(-ox, px)) : 0,
      y: oy > 0 ? Math.min(oy, Math.max(-oy, py)) : 0,
    };
  };
  const setZoom = (nz: number, fcx?: number, fcy?: number) => {
    const z = Math.max(1, Math.min(4, nz));
    const v = viewRect();
    const base = baseSize(v);
    const { zoom: oz, panX, panY } = camRef.current;
    const curSize = base * oz;
    const curLeft = v.left + v.width / 2 - curSize / 2 + panX;
    const curTop = v.top + v.height / 2 - curSize / 2 + panY;
    const fx = fcx != null ? fcx : v.left + v.width / 2;
    const fy = fcy != null ? fcy : v.top + v.height / 2;
    const ux = (fx - curLeft) / curSize;
    const uy = (fy - curTop) / curSize;
    const ns = base * z;
    const newLeft = fx - ux * ns;
    const newTop = fy - uy * ns;
    const baseLeft = v.left + v.width / 2 - ns / 2;
    const baseTop = v.top + v.height / 2 - ns / 2;
    const c = clampPan(z, newLeft - baseLeft, newTop - baseTop, v);
    up({ zoom: z, panX: c.x, panY: c.y });
  };

  const pt = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
    const ev = e as TouchEvent;
    if (ev.touches && ev.touches[0]) return { x: ev.touches[0].clientX, y: ev.touches[0].clientY };
    if (ev.changedTouches && ev.changedTouches[0]) return { x: ev.changedTouches[0].clientX, y: ev.changedTouches[0].clientY };
    const me = e as MouseEvent;
    return { x: me.clientX, y: me.clientY };
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.16 : 1 / 1.16;
    setZoom(camRef.current.zoom * factor, e.clientX, e.clientY);
  };

  const onPanStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (camRef.current.zoom <= 1 || dragRef.current) return;
    const p0 = pt(e);
    const sx = p0.x;
    const sy = p0.y;
    const px0 = camRef.current.panX;
    const py0 = camRef.current.panY;
    panningRef.current = true;
    const move = (ev: MouseEvent | TouchEvent) => {
      if (ev.cancelable) ev.preventDefault();
      const p = pt(ev);
      const c = clampPan(camRef.current.zoom, px0 + (p.x - sx), py0 + (p.y - sy));
      up({ panX: c.x, panY: c.y });
    };
    const upFn = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', upFn);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', upFn);
      panningRef.current = false;
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', upFn);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', upFn);
  };

  const startPinDrag = (e: React.MouseEvent | React.TouchEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!mapEl.current) {
      openFactory(id);
      return;
    }
    const p0 = pt(e);
    const drag = { id, moved: false, startX: p0.x, startY: p0.y };
    dragRef.current = drag;
    up({ hoverPin: null });
    const move = (ev: MouseEvent | TouchEvent) => {
      if (!dragRef.current || !mapEl.current) return;
      if (ev.cancelable) ev.preventDefault();
      const p = pt(ev);
      if (Math.abs(p.x - drag.startX) + Math.abs(p.y - drag.startY) > 3) drag.moved = true;
      const rect = mapEl.current.getBoundingClientRect();
      let x = ((p.x - rect.left) / rect.width) * 100;
      let y = ((p.y - rect.top) / rect.height) * 100;
      x = Math.max(2.5, Math.min(97.5, x));
      y = Math.max(2.5, Math.min(97.5, y));
      movePin(drag.id, x, y);
    };
    const upFn = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', upFn);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', upFn);
      const d = dragRef.current;
      dragRef.current = null;
      if (d && !d.moved) openFactory(d.id);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', upFn);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', upFn);
  };

  // ----- filters -----
  const counts: Record<string, number> = { all: facs.length, planned: 0, construction: 0, operational: 0, decommissioned: 0 };
  facs.forEach((f) => {
    counts[f.status] = (counts[f.status] || 0) + 1;
  });
  const statusFilters: [string, string][] = [
    ['all', 'All'],
    ['operational', 'Operational'],
    ['construction', 'Building'],
    ['planned', 'Planned'],
  ];
  const allTags: string[] = [];
  facs.forEach((f) => f.tags.forEach((t) => {
    if (!allTags.includes(t)) allTags.push(t);
  }));
  const tagFilters = [{ label: 'All tags', key: 'all' }].concat(allTags.slice(0, 5).map((t) => ({ label: t, key: t })));

  const visible = facs.filter(
    (f) => (st.statusFilter === 'all' || f.status === st.statusFilter) && (st.tagFilter === 'all' || f.tags.includes(st.tagFilter)),
  );
  const visibleIds = visible.map((f) => f.id);
  const facById: Record<string, Factory> = {};
  facs.forEach((f) => (facById[f.id] = f));

  // ----- route connections (grouped per factory pair) -----
  const routesVis = world.routes.filter((r) => visibleIds.includes(r.from) && visibleIds.includes(r.to));
  const connMap: Record<string, Conn> = {};
  routesVis.forEach((r) => {
    const key = [r.from, r.to].slice().sort().join('__');
    if (!connMap[key]) connMap[key] = { key, a: r.from, b: r.to, items: [] };
    connMap[key].items.push({ item: r.item, rate: r.rate, t: r.t, from: r.from, to: r.to });
  });
  const connections = Object.values(connMap);

  const zoomed = st.zoom > 1.001;
  const zp = st.zoom * 100;
  const worldLayerStyle: CSSProperties = {
    position: 'absolute',
    left: '50%',
    top: '50%',
    height: `${zp}%`,
    width: 'auto',
    maxWidth: `${zp}%`,
    aspectRatio: '1',
    transform: `translate(calc(-50% + ${st.panX}px),calc(-50% + ${st.panY}px))`,
    transformOrigin: 'center',
    ...(panningRef.current ? {} : { transition: 'transform .14s ease' }),
  };

  return (
    <div data-m-screen="" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
      {/* filter toolbar */}
      <div
        data-m-scrollx=""
        style={{
          height: 46,
          flex: '0 0 46px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 16px',
          borderBottom: '1px solid #161A21',
          background: '#0C0D11',
        }}
      >
        {statusFilters.map(([k, lbl]) => (
          <button key={k} onClick={() => up({ statusFilter: k })} style={chipStyle(st.statusFilter === k)}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: k === 'all' ? '#727A85' : statusMeta(k).color }}></span>
            {lbl}
            <span style={{ opacity: 0.55, fontSize: 10 }}>{counts[k] || 0}</span>
          </button>
        ))}
        <div style={{ width: 1, height: 18, background: '#22262F', margin: '0 4px' }}></div>
        {tagFilters.map((t) => (
          <button key={t.key} onClick={() => up({ tagFilter: t.key })} style={{ ...chipStyle(st.tagFilter === t.key), gap: undefined }}>
            {t.label}
          </button>
        ))}
        <div style={{ flex: 1 }}></div>
        <span data-m-hide="" style={{ fontSize: 11, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 14, height: 0, borderTop: '2px dashed #F5A95B' }}></span>Hover a route to inspect its flow
        </span>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <div style={{ flex: 1, minWidth: 0, position: 'relative', overflow: 'hidden', background: 'radial-gradient(circle at 50% 40%,#0F1318,#070809)' }}>
          {facs.length === 0 && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, textAlign: 'center' }}>
              <div style={{ width: 78, height: 78, borderRadius: 20, border: '1.5px dashed #2E343F', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F5882E', fontSize: 30 }}>
                ⬡
              </div>
              <div>
                <div style={{ fontFamily: SG, fontWeight: 600, fontSize: 18, color: '#E7E9ED' }}>Drop your first factory on the map</div>
                <div style={{ color: '#7B828D', marginTop: 6, maxWidth: 320 }}>Pins are placed manually. Each one is a factory you can fill with production lines.</div>
              </div>
              <button
                onClick={openCreateFactory}
                style={{ background: '#F5882E', color: '#120A03', border: 'none', borderRadius: 9, padding: '10px 18px', fontWeight: 600, cursor: 'pointer' }}
              >
                ＋ Place a factory
              </button>
            </div>
          )}

          {facs.length > 0 && (
            <>
              <div
                ref={viewEl}
                onWheel={onWheel}
                onMouseDown={onPanStart}
                onTouchStart={onPanStart}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 12,
                  overflow: 'hidden',
                  border: '1px solid #1C2027',
                  cursor: zoomed ? 'grab' : 'default',
                }}
              >
                <div ref={mapEl} style={worldLayerStyle}>
                  <img
                    src="/assets/map.jpg"
                    alt="World map"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(.78) brightness(.62) contrast(1.04)' }}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 45%,rgba(11,12,15,0) 55%,rgba(11,12,15,.72))', pointerEvents: 'none' }}></div>

                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                    {connections.map((c) => {
                      const a = facById[c.a];
                      const b = facById[c.b];
                      const mx = (a.x + b.x) / 2;
                      const my = (a.y + b.y) / 2;
                      const dx = b.x - a.x;
                      const dy = b.y - a.y;
                      const cx = mx - dy * 0.12;
                      const cy = my + dx * 0.12;
                      const hov = st.hoverRoute === c.key;
                      const d = `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
                      return (
                        <g key={c.key}>
                          <path d={d} fill="none" stroke={a.color} strokeWidth={hov ? 0.8 : 0.5} strokeLinecap="round" opacity={hov ? 1 : 0.92} style={{ vectorEffect: 'non-scaling-stroke' }} />
                          <path
                            d={d}
                            fill="none"
                            stroke={a.color}
                            strokeWidth={hov ? 1.05 : 0.78}
                            strokeLinecap="round"
                            strokeDasharray="2 4"
                            opacity={0.95}
                            style={{ vectorEffect: 'non-scaling-stroke', animation: 'scFlow .9s linear infinite' }}
                          />
                          <path
                            d={d}
                            fill="none"
                            stroke="rgba(0,0,0,0)"
                            strokeWidth={2.6}
                            style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                            onMouseEnter={() => up({ hoverRoute: c.key, mapFocus: { type: 'route', key: c.key } })}
                            onMouseLeave={() => up({ hoverRoute: null })}
                          />
                        </g>
                      );
                    })}
                  </svg>

                  {visible.map((f) => {
                    const hov = st.hoverPin === f.id;
                    return (
                      <div
                        key={f.id}
                        onMouseEnter={() => {
                          if (dragRef.current) return;
                          up({ hoverPin: f.id, mapFocus: { type: 'factory', id: f.id } });
                        }}
                        onMouseLeave={() => {
                          if (dragRef.current) return;
                          up({ hoverPin: null });
                        }}
                        onMouseDown={(e) => startPinDrag(e, f.id)}
                        onTouchStart={(e) => startPinDrag(e, f.id)}
                        style={{
                          position: 'absolute',
                          left: `${f.x}%`,
                          top: `${f.y}%`,
                          width: 34,
                          height: 34,
                          marginLeft: -17,
                          marginTop: -17,
                          cursor: 'pointer',
                          zIndex: hov ? 30 : 22,
                        }}
                      >
                        {f.status === 'operational' && (
                          <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: f.color, animation: 'scPulse 2.4s ease-out infinite' }}></span>
                        )}
                        <span
                          style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: '50%',
                            background: f.color,
                            border: `2px solid ${hov ? '#fff' : 'rgba(255,255,255,.55)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: SG,
                            fontWeight: 700,
                            fontSize: 11,
                            color: '#0C0D11',
                            boxShadow: `0 3px 10px rgba(0,0,0,.5),0 0 0 ${hov ? '4px' : '0px'} ${f.color}44`,
                            transform: `scale(${hov ? 1.12 : 1})`,
                            transition: 'transform .12s',
                          }}
                        >
                          {initials(f.name)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    background: 'rgba(12,13,17,.85)',
                    border: '1px solid #20242D',
                    borderRadius: 9,
                    overflow: 'hidden',
                    backdropFilter: 'blur(6px)',
                    zIndex: 38,
                  }}
                >
                  <button onClick={() => setZoom(camRef.current.zoom + 0.45)} style={{ width: 32, height: 30, background: 'transparent', border: 'none', color: '#C2C8D2', fontSize: 17, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    ＋
                  </button>
                  <div style={{ fontFamily: MONO, fontSize: 9.5, color: '#8A909A', textAlign: 'center', padding: '1px 0', borderTop: '1px solid #20242D', borderBottom: '1px solid #20242D' }}>
                    {Math.round(st.zoom * 100)}%
                  </div>
                  <button onClick={() => setZoom(camRef.current.zoom - 0.45)} style={{ width: 32, height: 30, background: 'transparent', border: 'none', color: '#C2C8D2', fontSize: 17, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    −
                  </button>
                  <button
                    onClick={() => up({ zoom: 1, panX: 0, panY: 0 })}
                    title="Reset"
                    style={{ width: 32, height: 26, background: 'transparent', border: 'none', borderTop: '1px solid #20242D', color: '#727A85', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    ⤢
                  </button>
                </div>
              </div>
              <button
                onClick={openCreateFactory}
                style={{
                  position: 'absolute',
                  right: 16,
                  bottom: 14,
                  background: '#F5882E',
                  color: '#120A03',
                  border: 'none',
                  borderRadius: 9,
                  padding: '10px 15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 6px 18px rgba(245,136,46,.32)',
                }}
              >
                ＋ Factory
              </button>
            </>
          )}
        </div>

        <MapSidebar connMap={connMap} facById={facById} />
      </div>
    </div>
  );
}

// ===================== sidebar =====================

function MapSidebar({ connMap, facById }: { connMap: Record<string, Conn>; facById: Record<string, Factory> }) {
  const { st, up, openFactory } = useStore();
  const world = useWorld();
  const facs = world.factories;
  const mfoc = st.mapFocus;

  let body: React.ReactNode;

  if (mfoc && mfoc.type === 'factory' && facById[mfoc.id]) {
    const f = facById[mfoc.id];
    const agg = aggregate(f);
    const sm = statusMeta(f.status);
    const produced = Object.keys(agg.per)
      .filter((i) => agg.per[i].out > 0.001)
      .map((i) => ({ item: i, out: agg.per[i].out }))
      .sort((a, b) => b.out - a.out);
    const flows = buildFlows(world, f, false);
    body = (
      <>
        <div style={{ height: 3, background: f.color }}></div>
        <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid #161A21' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: sm.color, boxShadow: `0 0 6px ${sm.color}`, flex: '0 0 auto' }}></span>
            <span style={{ fontFamily: SG, fontWeight: 600, fontSize: 16, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</span>
          </div>
          <div style={{ fontSize: 11, color: '#8A909A' }}>
            {sm.label} · {f.tier}
          </div>
        </div>
        <div style={{ display: 'flex', borderBottom: '1px solid #161A21' }}>
          <div style={{ flex: 1, padding: '10px 14px', borderRight: '1px solid #161A21' }}>
            <div style={{ fontSize: 9.5, letterSpacing: '.05em', textTransform: 'uppercase', color: '#5E646E' }}>Power</div>
            <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 15, color: '#F5A95B', marginTop: 2 }}>{fmt(agg.power)} MW</div>
          </div>
          <div style={{ flex: 1, padding: '10px 14px' }}>
            <div style={{ fontSize: 9.5, letterSpacing: '.05em', textTransform: 'uppercase', color: '#5E646E' }}>Machines</div>
            <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 15, color: '#E7E9ED', marginTop: 2 }}>{agg.machines}</div>
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 14px' }}>
          <SectionLabel color="#5BCB86" mb={8}>
            Produced here <span style={{ color: '#5E646E' }}>{produced.length}</span>
          </SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 18 }}>
            {produced.map((x) => (
              <ProducedRow key={x.item} name={x.item} rate={'+' + fmt(x.out) + '/m'} />
            ))}
            {produced.length === 0 && <div style={{ fontSize: 11, color: '#5E646E', fontStyle: 'italic' }}>Nothing produced yet — add a recipe.</div>}
          </div>
          <SectionLabel>
            Exports &amp; imports
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#5BCB86', fontSize: 9 }}>↑ out</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#F5A95B', fontSize: 9 }}>↓ in</span>
          </SectionLabel>
          <FlowList
            flows={flows}
            expandedFlow={st.expandedFlow}
            onToggle={(k) => up((s) => ({ expandedFlow: { ...s.expandedFlow, [k]: !s.expandedFlow[k] } }))}
            emptyText="No routes connected. Draw one from the map."
          />
        </div>
        <div style={{ padding: '12px 14px', borderTop: '1px solid #161A21' }}>
          <button
            onClick={() => openFactory(f.id)}
            style={{ width: '100%', background: '#F5882E', color: '#120A03', border: 'none', borderRadius: 8, padding: 9, fontWeight: 600, cursor: 'pointer', fontSize: 12.5 }}
          >
            Open factory →
          </button>
        </div>
      </>
    );
  } else if (mfoc && mfoc.type === 'route' && connMap[mfoc.key]) {
    const c = connMap[mfoc.key];
    const fa = facById[c.a];
    const fb = facById[c.b];
    let through = 0;
    c.items.forEach((r) => (through += r.rate));
    body = (
      <>
        <div style={{ height: 3, background: `linear-gradient(90deg,${fa.color},${fb.color})` }}></div>
        <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid #161A21' }}>
          <div style={{ fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: '#5E646E', marginBottom: 9 }}>Route flow</div>
          <div onClick={() => openFactory(fa.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: fa.color, flex: '0 0 auto' }}></span>
            <span style={{ fontSize: 12.5, fontWeight: 500, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fa.name}</span>
          </div>
          <div style={{ color: '#5E646E', fontSize: 13, margin: '3px 0 3px 2px' }}>⇅</div>
          <div onClick={() => openFactory(fb.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: fb.color, flex: '0 0 auto' }}></span>
            <span style={{ fontSize: 12.5, fontWeight: 500, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fb.name}</span>
          </div>
        </div>
        <div style={{ display: 'flex', borderBottom: '1px solid #161A21' }}>
          <div style={{ flex: 1, padding: '10px 14px', borderRight: '1px solid #161A21' }}>
            <div style={{ fontSize: 9.5, textTransform: 'uppercase', color: '#5E646E' }}>Flows</div>
            <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 15, color: '#E7E9ED', marginTop: 2 }}>{c.items.length}</div>
          </div>
          <div style={{ flex: 1, padding: '10px 14px' }}>
            <div style={{ fontSize: 9.5, textTransform: 'uppercase', color: '#5E646E' }}>Throughput</div>
            <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 15, color: '#F5A95B', marginTop: 2 }}>{fmt(through)}/m</div>
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 14px' }}>
          <div style={{ fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: '#8A909A', marginBottom: 9 }}>Items in transit</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {c.items.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#0F1116', border: '1px solid #20242D', borderRadius: 8, padding: '7px 9px' }}>
                <ItemSquare item={r.item} size={22} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.item}</div>
                  <div style={{ fontSize: 9.5, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <TransportBadge t={r.t || 'Belt'} pad="1px 4px" />
                    {facById[r.from].name.split(' ')[0]} → {facById[r.to].name.split(' ')[0]}
                  </div>
                </div>
                <span style={{ fontFamily: MONO, fontSize: 11.5, color: '#F5A95B' }}>{fmt(r.rate)}/m</span>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  } else {
    const per = rollupWorld(world);
    let totalPower = 0;
    let totalMachines = 0;
    facs.forEach((f) => {
      const a = aggregate(f);
      totalPower += a.power;
      totalMachines += a.machines;
    });
    const items = Object.keys(per).map((item) => ({ item, net: per[item].produced - per[item].consumed }));
    const surplus = items.filter((x) => x.net > 0.001).sort((a, b) => b.net - a.net).slice(0, 6);
    const deficit = items.filter((x) => x.net < -0.001).sort((a, b) => a.net - b.net).slice(0, 6);
    const drill = (item: string) => up({ screen: 'rollup', drillItem: item });
    body = (
      <>
        <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid #161A21' }}>
          <div style={{ fontFamily: SG, fontWeight: 600, fontSize: 15 }}>{world.name}</div>
          <div style={{ fontSize: 11, color: '#7B828D', marginTop: 2 }}>
            {facs.length} factories · {world.routes.length} routes
          </div>
        </div>
        <div style={{ display: 'flex', borderBottom: '1px solid #161A21' }}>
          <div style={{ flex: 1, padding: '10px 14px', borderRight: '1px solid #161A21' }}>
            <div style={{ fontSize: 9.5, textTransform: 'uppercase', color: '#5E646E' }}>Total draw</div>
            <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 15, color: '#F5A95B', marginTop: 2 }}>{fmt(totalPower)} MW</div>
          </div>
          <div style={{ flex: 1, padding: '10px 14px' }}>
            <div style={{ fontSize: 9.5, textTransform: 'uppercase', color: '#5E646E' }}>Machines</div>
            <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 15, color: '#E7E9ED', marginTop: 2 }}>{totalMachines}</div>
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 14px' }}>
          <SectionLabel color="#5BCB86" mb={8}>Top surplus</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 16 }}>
            {surplus.map((x) => (
              <div key={x.item} onClick={() => drill(x.item)} style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#101510', border: '1px solid #1B2A1E', borderRadius: 7, padding: '6px 8px', cursor: 'pointer' }}>
                <ItemSquare item={x.item} />
                <span style={{ flex: 1, fontSize: 12 }}>{x.item}</span>
                <span style={{ fontFamily: MONO, fontSize: 11.5, color: '#5BCB86' }}>+{fmt(x.net)}/m</span>
              </div>
            ))}
            {surplus.length === 0 && <div style={{ fontSize: 11, color: '#5E646E', fontStyle: 'italic' }}>None yet</div>}
          </div>
          <SectionLabel color="#E5604D" mb={8}>Top deficit</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {deficit.map((x) => (
              <div key={x.item} onClick={() => drill(x.item)} style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#150F0F', border: '1px solid #2A1B1B', borderRadius: 7, padding: '6px 8px', cursor: 'pointer' }}>
                <ItemSquare item={x.item} />
                <span style={{ flex: 1, fontSize: 12 }}>{x.item}</span>
                <span style={{ fontFamily: MONO, fontSize: 11.5, color: '#E5604D' }}>{fmt(x.net)}/m</span>
              </div>
            ))}
            {deficit.length === 0 && <div style={{ fontSize: 11, color: '#5E646E', fontStyle: 'italic' }}>All balanced</div>}
          </div>
        </div>
        <div style={{ padding: '11px 14px', borderTop: '1px solid #161A21', fontSize: 11, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#F5882E', flex: '0 0 auto' }}></span>Hover a pin or route for details
        </div>
      </>
    );
  }

  return (
    <aside
      data-m-hide=""
      style={{ width: 316, flex: '0 0 316px', borderLeft: '1px solid #161A21', background: '#0B0C0F', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      {body}
    </aside>
  );
}
