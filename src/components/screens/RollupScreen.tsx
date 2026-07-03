import { fmt, itemColor } from '../../data/gameData';
import { rollupWorld } from '../../state/derive';
import { useActions, useStore } from '../../state/store';
import { ItemSquare, MONO, SG } from '../bits';

export function RollupScreen() {
  const { st, up, world, openFactory } = useStore();
  const { toggleFav } = useActions();

  const per = rollupWorld(world);
  const items = Object.keys(per)
    .map((item) => ({ item, produced: per[item].produced, consumed: per[item].consumed, net: per[item].produced - per[item].consumed }))
    .sort((a, b) => b.net - a.net);

  const netColor = (net: number) => (net > 0.001 ? '#5BCB86' : net < -0.001 ? '#E5604D' : '#9097A1');
  const stOf = (net: number) => (net > 0.001 ? 'Surplus' : net < -0.001 ? 'Deficit' : 'Balanced');
  const badgeBg = (net: number) => (net > 0.001 ? '#0E1A12' : net < -0.001 ? '#1A0E0E' : '#15171D');

  const favorites = items.filter((it) => st.favItems.includes(it.item));
  const maxP = items.reduce((m, x) => Math.max(m, x.produced), 0) || 1;
  const maxC = items.reduce((m, x) => Math.max(m, x.consumed), 0) || 1;

  const fc = st.rollupFocus;
  const rsb = fc && per[fc] ? { name: fc, ...per[fc], net: per[fc].produced - per[fc].consumed } : null;

  return (
    <div data-m-screen="" data-m-stack="" style={{ position: 'absolute', inset: 0, display: 'flex', overflow: 'hidden' }}>
      <div data-m-panel="" data-m-pad="" style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '22px 26px 60px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginBottom: 6 }}>
          <h1 style={{ fontFamily: SG, fontWeight: 700, fontSize: 22, margin: 0 }}>World Rollup</h1>
          <span style={{ fontSize: 12.5, color: '#6B7280', paddingBottom: 3 }}>Net production across {world.factories.length} factories</span>
        </div>
        <div style={{ fontSize: 12.5, color: '#7B828D', marginBottom: 22 }}>What do you have spare, and where is the missing supply coming from?</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11 }}>
          <span style={{ color: '#F5A95B', fontSize: 13 }}>★</span>
          <span style={{ fontFamily: SG, fontWeight: 600, fontSize: 14 }}>Favorites</span>
          <span style={{ fontSize: 11, color: '#5E646E' }}>{favorites.length}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(216px,1fr))', gap: 12, marginBottom: 28 }}>
          {favorites.map((it) => {
            const nc = netColor(it.net);
            const focused = st.rollupFocus === it.item;
            return (
              <div
                key={it.item}
                onMouseEnter={() => up({ rollupFocus: it.item })}
                style={{
                  background: '#0F1116',
                  border: `1px solid ${focused ? nc + '88' : '#1C2027'}`,
                  borderRadius: 13,
                  padding: '15px 16px',
                  cursor: 'pointer',
                  transition: 'border-color .12s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <ItemSquare item={it.item} size={34} radius={8} fontSize={11} />
                  <span style={{ flex: 1, fontWeight: 600, fontSize: 13.5, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.item}</span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFav(it.item);
                    }}
                    style={{ color: '#F5A95B', fontSize: 15, cursor: 'pointer', flex: '0 0 auto' }}
                  >
                    ★
                  </span>
                </div>
                <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 24, color: nc }}>{(it.net > 0 ? '+' : '') + fmt(it.net)}/m</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 9 }}>
                  <span style={{ fontSize: 11, color: '#6B7280' }}>▲ {fmt(it.produced)}/m</span>
                  <span style={{ fontSize: 11, color: '#6B7280' }}>▼ {fmt(it.consumed)}/m</span>
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: 9.5,
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 5,
                      color: nc,
                      background: badgeBg(it.net),
                      border: `1px solid ${nc}33`,
                    }}
                  >
                    {stOf(it.net)}
                  </span>
                </div>
              </div>
            );
          })}
          {favorites.length === 0 && (
            <div style={{ gridColumn: '1/-1', border: '1px dashed #2A2F39', borderRadius: 12, padding: 20, textAlign: 'center', fontSize: 12, color: '#6B7280' }}>
              ★ Star any item below to pin it here.
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11 }}>
          <span style={{ fontFamily: SG, fontWeight: 600, fontSize: 14 }}>All items</span>
          <span style={{ fontSize: 11, color: '#5E646E' }}>{items.length}</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#6B7280' }}>Hover for production map →</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(148px,1fr))', gap: 10 }}>
          {items.map((it) => {
            const nc = netColor(it.net);
            const fav = st.favItems.includes(it.item);
            const focused = st.rollupFocus === it.item;
            const pPct = Math.round((it.produced / maxP) * 100);
            const cPct = Math.round((it.consumed / maxC) * 100);
            return (
              <div
                key={it.item}
                onMouseEnter={() => up({ rollupFocus: it.item })}
                style={{
                  position: 'relative',
                  background: focused ? '#15181E' : '#0F1116',
                  border: `1px solid ${focused ? nc + '88' : '#1C2027'}`,
                  borderRadius: 10,
                  padding: '10px 11px',
                  cursor: 'pointer',
                  transition: 'all .1s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <ItemSquare item={it.item} size={24} radius={6} fontSize={9} />
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFav(it.item);
                    }}
                    style={{ marginLeft: 'auto', color: fav ? '#F5A95B' : '#4B515B', fontSize: 14, cursor: 'pointer', flex: '0 0 auto' }}
                  >
                    {fav ? '★' : '☆'}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#C2C8D2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.item}</div>
                <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 14, color: nc, margin: '3px 0 9px' }}>
                  {(it.net > 0 ? '+' : '') + fmt(it.net)}
                  <span style={{ fontSize: 9, color: '#5E646E', fontWeight: 400 }}>/m</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 8.5, marginBottom: 3 }}>
                      <span style={{ color: '#5BCB86', letterSpacing: '.04em', textTransform: 'uppercase' }}>Prod</span>
                      <span style={{ fontFamily: MONO, color: '#9097A1' }}>
                        {fmt(it.produced)}/{fmt(maxP)} · {pPct}%
                      </span>
                    </div>
                    <div style={{ height: 5, background: '#15181E', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pPct}%`, background: '#5BCB86', borderRadius: 3 }}></div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 8.5, marginBottom: 3 }}>
                      <span style={{ color: '#E5604D', letterSpacing: '.04em', textTransform: 'uppercase' }}>Cons</span>
                      <span style={{ fontFamily: MONO, color: '#9097A1' }}>
                        {fmt(it.consumed)}/{fmt(maxC)} · {cPct}%
                      </span>
                    </div>
                    <div style={{ height: 5, background: '#15181E', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${cPct}%`, background: '#E5604D', borderRadius: 3 }}></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <aside
        data-m-hide=""
        style={{ width: 312, flex: '0 0 312px', borderLeft: '1px solid #161A21', background: '#0B0C0F', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        {rsb ? (
          <>
            <div style={{ height: 3, background: itemColor(rsb.name) }}></div>
            <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid #161A21', display: 'flex', alignItems: 'center', gap: 11 }}>
              <ItemSquare item={rsb.name} size={34} radius={8} fontSize={11} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: SG, fontWeight: 600, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rsb.name}</div>
                <div style={{ fontFamily: MONO, fontSize: 12, color: netColor(rsb.net) }}>{(rsb.net > 0 ? '+' : '') + fmt(rsb.net)}/m net</div>
              </div>
            </div>
            <div style={{ display: 'flex', borderBottom: '1px solid #161A21' }}>
              <div style={{ flex: 1, padding: '10px 14px', borderRight: '1px solid #161A21' }}>
                <div style={{ fontSize: 9.5, textTransform: 'uppercase', color: '#5E646E' }}>Produced</div>
                <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 14, color: '#5BCB86', marginTop: 2 }}>{fmt(rsb.produced)}/m</div>
              </div>
              <div style={{ flex: 1, padding: '10px 14px' }}>
                <div style={{ fontSize: 9.5, textTransform: 'uppercase', color: '#5E646E' }}>Consumed</div>
                <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 14, color: '#E5604D', marginTop: 2 }}>{fmt(rsb.consumed)}/m</div>
              </div>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 14px' }}>
              <div style={{ fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: '#5BCB86', marginBottom: 9 }}>Produced by</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
                {rsb.producers.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => openFactory(p.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#0C100C', border: '1px solid #1B2A1E', borderRadius: 8, padding: '8px 10px', cursor: 'pointer' }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color, flex: '0 0 auto' }}></span>
                    <span style={{ flex: 1, fontSize: 12, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                    <span style={{ fontFamily: MONO, fontSize: 11.5, color: '#5BCB86' }}>+{fmt(p.rate)}/m</span>
                  </div>
                ))}
                {rsb.producers.length === 0 && <div style={{ fontSize: 11, color: '#5E646E', fontStyle: 'italic' }}>Nothing produces this yet.</div>}
              </div>
              <div style={{ fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: '#E5604D', marginBottom: 9 }}>Consumed by</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {rsb.consumers.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => openFactory(p.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#100C0C', border: '1px solid #2A1B1B', borderRadius: 8, padding: '8px 10px', cursor: 'pointer' }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color, flex: '0 0 auto' }}></span>
                    <span style={{ flex: 1, fontSize: 12, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                    <span style={{ fontFamily: MONO, fontSize: 11.5, color: '#E5604D' }}>−{fmt(p.rate)}/m</span>
                  </div>
                ))}
                {rsb.consumers.length === 0 && <div style={{ fontSize: 11, color: '#5E646E', fontStyle: 'italic' }}>Nothing consumes this yet.</div>}
              </div>
            </div>
            <div style={{ padding: '12px 14px', borderTop: '1px solid #161A21' }}>
              <button
                onClick={() => toggleFav(rsb.name)}
                style={{ width: '100%', background: '#13151A', border: '1px solid #2A2F39', color: '#E7E9ED', borderRadius: 8, padding: 9, fontWeight: 500, cursor: 'pointer', fontSize: 12.5 }}
              >
                {st.favItems.includes(rsb.name) ? '★ Favorited' : '☆ Add to favorites'}
              </button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center', padding: 24 }}>
            <div style={{ width: 54, height: 54, borderRadius: 14, border: '1.5px dashed #2E343F', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5E646E', fontSize: 22 }}>
              ⬡
            </div>
            <div style={{ fontSize: 12.5, color: '#7B828D', maxWidth: 200 }}>Hover any item to see its production map — who makes it, who consumes it.</div>
          </div>
        )}
      </aside>
    </div>
  );
}

// ===================== drill drawer (overlay) =====================

export function DrillDrawer() {
  const { st, up, world, openFactory } = useStore();
  if (!st.drillItem) return null;
  const per = rollupWorld(world);
  const r = per[st.drillItem] || { produced: 0, consumed: 0, producers: [], consumers: [] };
  const net = r.produced - r.consumed;
  const nc = net > 0.001 ? '#5BCB86' : net < -0.001 ? '#E5604D' : '#9097A1';
  const close = () => up({ drillItem: null });
  return (
    <div onClick={close} style={{ position: 'fixed', inset: 0, background: 'rgba(6,7,9,.55)', zIndex: 70, display: 'flex', justifyContent: 'flex-end' }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: 380, height: '100%', background: '#0F1116', borderLeft: '1px solid #262B34', overflowY: 'auto', animation: 'scFade .16s ease' }}
      >
        <div style={{ height: 4, background: itemColor(st.drillItem) }}></div>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #1C2027', display: 'flex', alignItems: 'center', gap: 11 }}>
          <ItemSquare item={st.drillItem} size={34} radius={8} fontSize={11} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: SG, fontWeight: 600, fontSize: 16 }}>{st.drillItem}</div>
            <div style={{ fontSize: 11.5, color: nc }}>{(net > 0 ? '+' : '') + fmt(net)} net /min</div>
          </div>
          <span onClick={close} style={{ color: '#6B7280', cursor: 'pointer', fontSize: 20 }}>
            ×
          </span>
        </div>
        <div style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: '#5BCB86', marginBottom: 9 }}>Producers</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 18 }}>
            {r.producers.map((p) => (
              <div
                key={p.id}
                onClick={() => openFactory(p.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#0C100C', border: '1px solid #1B2A1E', borderRadius: 9, padding: '9px 11px', cursor: 'pointer' }}
              >
                <span style={{ width: 9, height: 9, borderRadius: 2, background: p.color }}></span>
                <span style={{ flex: 1, fontSize: 12.5, fontWeight: 500 }}>{p.name}</span>
                <span style={{ fontFamily: MONO, fontSize: 12, color: '#5BCB86' }}>+{fmt(p.rate)}/m</span>
              </div>
            ))}
            {r.producers.length === 0 && <div style={{ fontSize: 11.5, color: '#5E646E', fontStyle: 'italic' }}>Nothing produces this yet.</div>}
          </div>
          <div style={{ fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: '#E5604D', marginBottom: 9 }}>Consumers</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {r.consumers.map((p) => (
              <div
                key={p.id}
                onClick={() => openFactory(p.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#100C0C', border: '1px solid #2A1B1B', borderRadius: 9, padding: '9px 11px', cursor: 'pointer' }}
              >
                <span style={{ width: 9, height: 9, borderRadius: 2, background: p.color }}></span>
                <span style={{ flex: 1, fontSize: 12.5, fontWeight: 500 }}>{p.name}</span>
                <span style={{ fontFamily: MONO, fontSize: 12, color: '#E5604D' }}>−{fmt(p.rate)}/m</span>
              </div>
            ))}
            {r.consumers.length === 0 && <div style={{ fontSize: 11.5, color: '#5E646E', fontStyle: 'italic' }}>Nothing consumes this yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
