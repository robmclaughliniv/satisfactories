import type { CSSProperties } from 'react';
import { RECIPES, fmt, recipeById, statusMeta } from '../../data/gameData';
import { aggregate, localInputByItem } from '../../state/derive';
import { buildFlows } from '../../state/flows';
import { useActions, useStore, useWorld } from '../../state/store';
import type { Factory, World } from '../../types';
import { FlowList, ItemSquare, MONO, ProducedRow, SG, SectionLabel, TransportBadge } from '../bits';

export function FactoryScreen() {
  const { st, up, factory, openFactory } = useStore();
  const world = useWorld();
  const f = factory(st.selFactory);
  if (!f) return null;

  const agg = aggregate(f);
  return (
    <div data-m-screen="" data-m-stack="" style={{ position: 'absolute', inset: 0, display: 'flex', overflow: 'hidden' }}>
      <IdentityPanel f={f} agg={agg} openFactory={openFactory} world={world} />
      <ProductionPanel f={f} agg={agg} />
      <RightPanel f={f} />
    </div>
  );
}

// ===================== identity =====================

function IdentityPanel({
  f,
  agg,
  openFactory,
  world,
}: {
  f: Factory;
  agg: ReturnType<typeof aggregate>;
  openFactory: (id: string) => void;
  world: World;
}) {
  const sm = statusMeta(f.status);
  const linked: { name: string; color: string; dir: string; item: string; id: string }[] = [];
  const facById: Record<string, Factory> = {};
  world.factories.forEach((x) => (facById[x.id] = x));
  world.routes.forEach((r) => {
    if (r.from === f.id) {
      const o = facById[r.to];
      if (o) linked.push({ name: o.name, color: o.color, dir: '→ out', item: r.item, id: o.id });
    }
    if (r.to === f.id) {
      const o = facById[r.from];
      if (o) linked.push({ name: o.name, color: o.color, dir: '← in', item: r.item, id: o.id });
    }
  });
  const coverStyle: CSSProperties = {
    position: 'relative',
    height: 118,
    ...(f.cover
      ? { background: `#0D0E12 url(${f.cover}) center/cover` }
      : { background: `linear-gradient(150deg,${f.color}55,${f.color}10),repeating-linear-gradient(135deg,#0D0E12,#0D0E12 9px,#111319 9px,#111319 18px)` }),
  };
  return (
    <aside data-m-panel="" style={{ width: 280, flex: '0 0 280px', borderRight: '1px solid #1A1E25', overflowY: 'auto', background: '#0D0E12' }}>
      <div style={coverStyle}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(13,14,18,.1),rgba(13,14,18,.92))' }}></div>
        <div style={{ position: 'absolute', left: 16, bottom: 13, right: 16 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(12,13,17,.7)',
              border: `1px solid ${sm.color}`,
              borderRadius: 20,
              padding: '3px 10px',
              marginBottom: 9,
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: sm.color, boxShadow: `0 0 6px ${sm.color}` }}></span>
            <span style={{ fontSize: 11, fontWeight: 500, color: '#E7E9ED' }}>{sm.label}</span>
          </div>
          <div style={{ fontFamily: SG, fontWeight: 700, fontSize: 21, lineHeight: 1.1, color: '#fff' }}>{f.name}</div>
        </div>
      </div>
      <div style={{ padding: '15px 16px' }}>
        <div style={{ fontSize: 12.5, color: '#9097A1', lineHeight: 1.5, marginBottom: 15 }}>{f.tagline}</div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 15 }}>
          <div style={{ flex: 1, background: '#13151A', border: '1px solid #20242D', borderRadius: 9, padding: '10px 11px' }}>
            <div style={{ fontSize: 10, letterSpacing: '.05em', textTransform: 'uppercase', color: '#5E646E' }}>Power</div>
            <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 16, color: '#F5A95B', marginTop: 3 }}>{fmt(agg.power)} MW</div>
          </div>
          <div style={{ flex: 1, background: '#13151A', border: '1px solid #20242D', borderRadius: 9, padding: '10px 11px' }}>
            <div style={{ fontSize: 10, letterSpacing: '.05em', textTransform: 'uppercase', color: '#5E646E' }}>Type</div>
            <div style={{ fontFamily: SG, fontWeight: 600, fontSize: 13.5, lineHeight: 1.2, color: '#E7E9ED', marginTop: 3 }}>{f.tier}</div>
          </div>
        </div>

        <div style={{ fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: '#5E646E', marginBottom: 7 }}>Tags</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {f.tags.map((tg) => (
            <span key={tg} style={{ background: '#181B21', border: '1px solid #262B34', borderRadius: 6, padding: '3px 9px', fontSize: 11, color: '#AEB4BE' }}>
              {tg}
            </span>
          ))}
        </div>

        <div style={{ fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: '#5E646E', marginBottom: 7 }}>Linked factories</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {linked.map((lk, i) => (
            <div
              key={i}
              onClick={() => openFactory(lk.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#13151A', border: '1px solid #20242D', borderRadius: 8, padding: '8px 10px', cursor: 'pointer' }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 2, background: lk.color }}></span>
              <span style={{ flex: 1, fontSize: 12, fontWeight: 500 }}>{lk.name}</span>
              <span style={{ fontSize: 10, color: '#6B7280' }}>{lk.dir}</span>
              <span style={{ fontSize: 11, color: '#9097A1' }}>{lk.item}</span>
            </div>
          ))}
          {linked.length === 0 && <div style={{ fontSize: 11.5, color: '#5E646E', fontStyle: 'italic' }}>No routes connected yet.</div>}
        </div>
      </div>
    </aside>
  );
}

// ===================== production (center) =====================

function ProductionPanel({ f, agg }: { f: Factory; agg: ReturnType<typeof aggregate> }) {
  const { st, up } = useStore();
  const world = useWorld();
  const { setRowCount, toggleRowExport, removeRow, addSection, openRecipePicker, resetFactory, commitFactory, openLocalInput } = useActions();

  const dirty = JSON.stringify(f.sections) !== f.baseline;

  const localByItem = localInputByItem(f);

  // resource balance: supply (made + imported + local) vs demand (required + exported)
  const impByItem: Record<string, number> = {};
  const expByItem: Record<string, number> = {};
  world.routes.forEach((r) => {
    if (r.to === f.id) impByItem[r.item] = (impByItem[r.item] || 0) + r.rate;
    else if (r.from === f.id) expByItem[r.item] = (expByItem[r.item] || 0) + r.rate;
  });
  const resKeys: Record<string, 1> = {};
  Object.keys(agg.per).forEach((k) => (resKeys[k] = 1));
  Object.keys(impByItem).forEach((k) => (resKeys[k] = 1));
  Object.keys(expByItem).forEach((k) => (resKeys[k] = 1));
  Object.keys(localByItem).forEach((k) => (resKeys[k] = 1));
  const resBalance = Object.keys(resKeys)
    .map((item) => {
      const made = agg.per[item]?.out || 0;
      const need = agg.per[item]?.in || 0;
      const imp = impByItem[item] || 0;
      const local = localByItem[item] || 0;
      const exp = expByItem[item] || 0;
      return { item, made, need, imp, local, exp, net: made + imp + local - need - exp };
    })
    .sort((a, b) => a.net - b.net);

  return (
    <section data-m-panel="" data-m-pad="" style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '18px 20px 60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: SG, fontWeight: 600, fontSize: 15 }}>Production</div>
          <div style={{ fontSize: 11.5, color: '#6B7280', marginTop: 1 }}>
            {agg.machines} machines across {f.sections.length} sections
          </div>
        </div>
        {dirty && (
          <span style={{ fontSize: 11, color: '#E0B341', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E0B341' }}></span>Unsaved working state
          </span>
        )}
        <button
          onClick={() => dirty && resetFactory(f.id)}
          style={{
            background: 'transparent',
            border: `1px solid ${dirty ? '#3A2A1A' : '#262B34'}`,
            color: dirty ? '#E0B341' : '#5E646E',
            borderRadius: 8,
            padding: '7px 13px',
            fontSize: 12,
            cursor: dirty ? 'pointer' : 'default',
          }}
        >
          ↺ Reset
        </button>
        <button
          onClick={() => dirty && commitFactory(f.id)}
          style={{
            background: dirty ? '#F5882E' : '#181B21',
            border: `1px solid ${dirty ? '#F5882E' : '#262B34'}`,
            color: dirty ? '#120A03' : '#5E646E',
            borderRadius: 8,
            padding: '7px 14px',
            fontSize: 12,
            fontWeight: 600,
            cursor: dirty ? 'pointer' : 'default',
          }}
        >
          ✓ Commit
        </button>
      </div>

      {resBalance.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontFamily: SG, fontWeight: 600, fontSize: 13, color: '#C2C8D2' }}>Resource balance</span>
            <span style={{ fontSize: 11, color: '#5E646E' }}>{resBalance.length}</span>
            <span style={{ marginLeft: 'auto', fontSize: 10.5, color: '#6B7280' }}>Made + imported + local − required − exported</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(158px,1fr))', gap: 10, marginBottom: 24 }}>
            {resBalance.map((rb) => {
              const deficit = rb.net < -0.001;
              const surplus = rb.net > 0.001;
              const nc = deficit ? '#E5604D' : surplus ? '#5BCB86' : '#9097A1';
              const stats: { label: string; value: string; color: string }[] = [{ label: 'Made here', value: fmt(rb.made), color: '#7FBE98' }];
              if (rb.imp > 0.001) stats.push({ label: 'Imported', value: '+' + fmt(rb.imp), color: '#F5A95B' });
              if (rb.local > 0.001) stats.push({ label: 'Local', value: '+' + fmt(rb.local), color: '#8B9DC3' });
              if (rb.need > 0.001) stats.push({ label: 'Required', value: '−' + fmt(rb.need), color: '#D98176' });
              if (rb.exp > 0.001) stats.push({ label: 'Exported', value: '−' + fmt(rb.exp), color: '#9097A1' });
              return (
                <div key={rb.item} style={{ background: '#0F1116', border: `1px solid ${deficit ? '#3A2020' : '#1C2027'}`, borderRadius: 10, padding: '11px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
                    <ItemSquare item={rb.item} size={26} radius={6} fontSize={9} />
                    <span style={{ flex: 1, fontSize: 11.5, fontWeight: 500, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rb.item}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 9 }}>
                    <span style={{ fontFamily: MONO, fontWeight: 600, fontSize: 18, color: nc }}>{(rb.net > 0 ? '+' : '') + fmt(rb.net)}</span>
                    <span style={{ fontSize: 9, color: '#5E646E' }}>/m</span>
                    <span
                      style={{
                        marginLeft: 'auto',
                        fontSize: 9,
                        fontWeight: 600,
                        padding: '1px 7px',
                        borderRadius: 5,
                        color: nc,
                        background: deficit ? '#1A0E0E' : surplus ? '#0E1A12' : '#15171D',
                        border: `1px solid ${nc}33`,
                      }}
                    >
                      {deficit ? 'Deficit' : surplus ? 'Surplus' : 'Balanced'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, borderTop: '1px solid #1A1E25', paddingTop: 8 }}>
                    {stats.map((stt) => (
                      <div key={stt.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 10, color: '#6B7280' }}>{stt.label}</span>
                        <span style={{ fontFamily: MONO, fontSize: 10.5, color: stt.color }}>{stt.value}</span>
                      </div>
                    ))}
                    {deficit && (() => {
                      const existingLocal = (f.localInputs || []).find((li) => li.item === rb.item);
                      if (existingLocal) {
                        return (
                          <button
                            onClick={() => openLocalInput(f.id, rb.item, existingLocal.id)}
                            style={{
                              marginTop: 6,
                              background: 'transparent',
                              border: '1px dashed #2A3040',
                              color: '#8B9DC3',
                              borderRadius: 6,
                              padding: '5px 8px',
                              fontSize: 10,
                              cursor: 'pointer',
                              width: '100%',
                            }}
                          >
                            Edit local input
                          </button>
                        );
                      }
                      return (
                        <button
                          onClick={() => openLocalInput(f.id, rb.item, undefined, -rb.net)}
                          style={{
                            marginTop: 6,
                            background: 'transparent',
                            border: '1px dashed #3A2020',
                            color: '#E5604D',
                            borderRadius: 6,
                            padding: '5px 8px',
                            fontSize: 10,
                            cursor: 'pointer',
                            width: '100%',
                          }}
                        >
                          ＋ Add local input
                        </button>
                      );
                    })()}
                    {!deficit && rb.local > 0.001 && (() => {
                      const existingLocal = (f.localInputs || []).find((li) => li.item === rb.item);
                      if (!existingLocal) return null;
                      return (
                        <button
                          onClick={() => openLocalInput(f.id, rb.item, existingLocal.id)}
                          style={{
                            marginTop: 6,
                            background: 'transparent',
                            border: '1px dashed #2A3040',
                            color: '#8B9DC3',
                            borderRadius: 6,
                            padding: '5px 8px',
                            fontSize: 10,
                            cursor: 'pointer',
                            width: '100%',
                          }}
                        >
                          Edit local input
                        </button>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11 }}>
        <span style={{ fontFamily: SG, fontWeight: 600, fontSize: 13, color: '#C2C8D2' }}>Production lines</span>
        <span style={{ fontSize: 11, color: '#5E646E' }}>
          {agg.machines} machines · {f.sections.length} sections
        </span>
      </div>

      {f.sections.map((sec) => {
        let secPower = 0;
        sec.rows.forEach((row) => {
          const rec = recipeById(row.recipeId);
          if (rec) secPower += rec.power * row.count;
        });
        return (
          <div key={sec.id} style={{ marginBottom: 16, border: '1px solid #1C2027', borderRadius: 11, overflow: 'hidden', background: '#0F1116' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: '#13151B', borderBottom: '1px solid #1C2027' }}>
              <span style={{ width: 3, height: 15, borderRadius: 2, background: f.color }}></span>
              <span style={{ fontFamily: SG, fontWeight: 600, fontSize: 13.5, flex: 1 }}>{sec.name}</span>
              <span style={{ fontSize: 11, color: '#6B7280', fontFamily: MONO }}>{fmt(secPower)} MW</span>
              <button
                onClick={() => openRecipePicker('add', f.id, sec.id, null)}
                style={{ background: '#1A1D24', border: '1px solid #2A2F39', color: '#C2C8D2', borderRadius: 6, padding: '4px 9px', fontSize: 11, cursor: 'pointer' }}
              >
                ＋ Recipe
              </button>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '7px 14px',
                fontSize: 10,
                letterSpacing: '.05em',
                textTransform: 'uppercase',
                color: '#5E646E',
                borderBottom: '1px solid #181B21',
              }}
            >
              <span style={{ width: 18 }}></span>
              <span style={{ flex: 1, minWidth: 70 }}>Recipe</span>
              <span data-m-colhide="" style={{ width: 82 }}>Building</span>
              <span style={{ width: 58, textAlign: 'center' }}>Machines</span>
              <span style={{ width: 72, textAlign: 'right' }}>Rate</span>
              <span data-m-colhide="" style={{ width: 58, textAlign: 'right' }}>Power</span>
              <span style={{ width: 30, textAlign: 'center' }}>Exp</span>
              <span style={{ width: 20 }}></span>
            </div>
            {sec.rows.map((row) => {
              const rec = recipeById(row.recipeId);
              if (!rec) return null;
              const exp = !!st.expanded[row.id];
              const prim = rec.outputs[0];
              const picking = st.picker?.mode === 'edit' && st.picker.rowId === row.id;
              return (
                <div key={row.id} style={{ borderBottom: '1px solid #15181E' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px' }}>
                    <span
                      onClick={() => up((s) => ({ expanded: { ...s.expanded, [row.id]: !exp } }))}
                      style={{
                        width: 18,
                        textAlign: 'center',
                        cursor: 'pointer',
                        color: '#5E646E',
                        fontSize: 11,
                        display: 'inline-block',
                        transition: 'transform .12s',
                        transform: `rotate(${exp ? 90 : 0}deg)`,
                      }}
                    >
                      ▸
                    </span>
                    <div
                      onClick={() => openRecipePicker('edit', f.id, sec.id, row.id)}
                      title="Change recipe"
                      style={{
                        flex: 1,
                        minWidth: 70,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 9,
                        cursor: 'pointer',
                        borderRadius: 6,
                        padding: '3px 6px',
                        margin: '-3px -6px',
                        background: picking ? '#1E1810' : 'transparent',
                        border: `1px solid ${picking ? '#F5882E55' : 'transparent'}`,
                      }}
                    >
                      <ItemSquare item={prim.item} size={24} radius={6} fontSize={9} />
                      <span style={{ fontWeight: 500, fontSize: 12.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rec.name}</span>
                      {rec.alt && (
                        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '.04em', color: '#C58BE0', border: '1px solid #4A3358', background: '#221A2B', borderRadius: 4, padding: '1px 5px' }}>
                          ALT
                        </span>
                      )}
                      <span style={{ fontSize: 10, color: '#4B515B', flex: '0 0 auto' }}>✎</span>
                    </div>
                    <span data-m-colhide="" style={{ width: 82, fontSize: 11.5, color: '#9097A1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {rec.building}
                    </span>
                    <div style={{ width: 58, display: 'flex', justifyContent: 'center' }}>
                      <input
                        type="number"
                        min={0}
                        value={row.count}
                        onChange={(e) => setRowCount(f.id, sec.id, row.id, e.target.value)}
                        style={{
                          width: 52,
                          background: '#0C0D11',
                          border: '1px solid #2A2F39',
                          borderRadius: 6,
                          color: '#E7E9ED',
                          textAlign: 'center',
                          padding: '5px 4px',
                          fontFamily: MONO,
                          fontSize: 12,
                        }}
                      />
                    </div>
                    <span style={{ width: 72, textAlign: 'right', fontFamily: MONO, fontSize: 12, color: '#5BCB86' }}>+{fmt(prim.rate * row.count)}/m</span>
                    <span data-m-colhide="" style={{ width: 58, textAlign: 'right', fontFamily: MONO, fontSize: 11.5, color: '#F5A95B' }}>
                      {fmt(rec.power * row.count)} MW
                    </span>
                    <div style={{ width: 30, display: 'flex', justifyContent: 'center' }}>
                      <span
                        onClick={() => toggleRowExport(f.id, sec.id, row.id)}
                        title="Mark output for export"
                        style={{
                          width: 17,
                          height: 17,
                          borderRadius: 5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: 11,
                          fontWeight: 700,
                          border: `1px solid ${row.export ? '#5BCB86' : '#3A3F4A'}`,
                          background: row.export ? '#5BCB86' : 'transparent',
                          color: '#0C0D11',
                        }}
                      >
                        {row.export ? '✓' : ''}
                      </span>
                    </div>
                    <span onClick={() => removeRow(f.id, sec.id, row.id)} style={{ width: 20, textAlign: 'center', color: '#5E646E', cursor: 'pointer', fontSize: 15 }}>
                      ×
                    </span>
                  </div>
                  {exp && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 16px 14px 42px', background: '#0B0C10', borderTop: '1px solid #15181E' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontSize: 9, letterSpacing: '.06em', textTransform: 'uppercase', color: '#5E646E' }}>Inputs</span>
                        {rec.inputs.map((ip) => (
                          <div key={ip.item} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <ItemSquare item={ip.item} />
                            <span style={{ fontSize: 11.5, color: '#C2C8D2' }}>{ip.item}</span>
                            <span style={{ fontFamily: MONO, fontSize: 11, color: '#E5604D' }}>{fmt(ip.rate * row.count)}/m</span>
                          </div>
                        ))}
                        {rec.inputs.length === 0 && <span style={{ fontSize: 11, color: '#5E646E' }}>Raw / none</span>}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: '#4B515B' }}>
                        <span style={{ fontFamily: MONO, fontSize: 10, color: '#6B7280' }}>
                          {row.count}× {rec.building}
                        </span>
                        <span style={{ fontSize: 18, color: f.color }}>→</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontSize: 9, letterSpacing: '.06em', textTransform: 'uppercase', color: '#5E646E' }}>Outputs</span>
                        {rec.outputs.map((op) => (
                          <div key={op.item} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <ItemSquare item={op.item} />
                            <span style={{ fontSize: 11.5, color: '#C2C8D2' }}>{op.item}</span>
                            <span style={{ fontFamily: MONO, fontSize: 11, color: '#5BCB86' }}>{fmt(op.rate * row.count)}/m</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {sec.rows.length === 0 && <div style={{ padding: 14, textAlign: 'center', fontSize: 11.5, color: '#5E646E' }}>No recipes yet — add one to derive rates.</div>}
          </div>
        );
      })}

      <button
        onClick={() => addSection(f.id)}
        style={{ width: '100%', background: 'transparent', border: '1px dashed #2A2F39', color: '#8A909A', borderRadius: 10, padding: 11, fontSize: 12, cursor: 'pointer' }}
      >
        ＋ Add section
      </button>
    </section>
  );
}

// ===================== right panel: picker or balance =====================

function RightPanel({ f }: { f: Factory }) {
  const { st, up } = useStore();
  const world = useWorld();
  const { pickRecipe, addFlowLeg, openLocalInput, openRoute } = useActions();

  const agg = aggregate(f);
  const pk = st.picker;

  let content: React.ReactNode;
  if (pk) {
    const pq = (st.pickerSearch || '').toLowerCase();
    let curRecipeId: string | null = null;
    if (pk.mode === 'edit') {
      const ps = f.sections.find((x) => x.id === pk.sectionId);
      const pr = ps?.rows.find((x) => x.id === pk.rowId);
      curRecipeId = pr ? pr.recipeId : null;
    }
    const list = RECIPES.filter((r) => {
      if (!pq) return true;
      return (
        r.name.toLowerCase().includes(pq) ||
        r.building.toLowerCase().includes(pq) ||
        r.inputs.concat(r.outputs).some((x) => x.item.toLowerCase().includes(pq))
      );
    }).sort((a, b) => (a.alt === b.alt ? a.name.localeCompare(b.name) : a.alt ? 1 : -1));
    content = (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontFamily: SG, fontWeight: 600, fontSize: 14, flex: 1 }}>{pk.mode === 'edit' ? 'Change recipe' : 'Add recipe'}</span>
          <span onClick={() => up({ picker: null, pickerSearch: '' })} style={{ color: '#6B7280', cursor: 'pointer', fontSize: 18 }}>
            ×
          </span>
        </div>
        <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 11 }}>
          {pk.mode === 'edit' ? 'Pick a recipe to replace this row.' : 'Pick a recipe to add to this section.'}
        </div>
        <input
          value={st.pickerSearch}
          onChange={(e) => up({ pickerSearch: e.target.value })}
          placeholder="Search recipes…"
          style={{ width: '100%', background: '#0C0D11', border: '1px solid #262B34', borderRadius: 8, color: '#E7E9ED', padding: '8px 11px', fontSize: 12.5, marginBottom: 10 }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {list.map((r) => {
            const prim = r.outputs[0];
            const current = r.id === curRecipeId;
            return (
              <div
                key={r.id}
                onClick={() => pickRecipe(r.id)}
                style={{
                  border: `1px solid ${current ? '#F5882E55' : '#1C2027'}`,
                  background: current ? '#15120C' : '#0F1116',
                  borderRadius: 9,
                  padding: '9px 10px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                  <ItemSquare item={prim.item} size={22} />
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 500, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</span>
                  {r.alt && (
                    <span style={{ fontSize: 8, fontWeight: 600, color: '#C58BE0', border: '1px solid #4A3358', background: '#221A2B', borderRadius: 4, padding: '1px 5px', flex: '0 0 auto' }}>
                      ALT
                    </span>
                  )}
                  {current && <span style={{ fontSize: 8, fontWeight: 600, color: '#5BCB86', flex: '0 0 auto' }}>● now</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#6B7280' }}>
                  <span style={{ fontFamily: MONO }}>{r.building}</span>
                  <span style={{ color: '#3F454E' }}>·</span>
                  <span style={{ fontFamily: MONO, color: '#F5A95B' }}>{r.power} MW</span>
                  <span style={{ marginLeft: 'auto', fontFamily: MONO, color: '#5BCB86' }}>+{fmt(prim.rate)}/m</span>
                </div>
              </div>
            );
          })}
          {list.length === 0 && <div style={{ fontSize: 11.5, color: '#5E646E', fontStyle: 'italic', padding: '6px 2px' }}>No recipes match.</div>}
        </div>
      </>
    );
  } else {
    const produced = Object.keys(agg.per)
      .filter((i) => agg.per[i].out > 0.001)
      .map((i) => ({ item: i, out: agg.per[i].out }))
      .sort((a, b) => b.out - a.out);
    const localInputs = f.localInputs || [];
    const flows = buildFlows(world, f, true);
    content = (
      <>
        <div style={{ fontFamily: SG, fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Factory balance</div>

        <SectionLabel color="#5BCB86" mb={8}>
          Produced here <span style={{ color: '#5E646E' }}>{produced.length}</span>
        </SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 18 }}>
          {produced.map((x) => (
            <ProducedRow key={x.item} name={x.item} rate={'+' + fmt(x.out) + '/m'} />
          ))}
          {produced.length === 0 && <div style={{ fontSize: 11, color: '#5E646E', fontStyle: 'italic' }}>Nothing produced yet — add a recipe.</div>}
        </div>

        <SectionLabel color="#8B9DC3" mb={8}>
          Local inputs <span style={{ color: '#5E646E' }}>{localInputs.length}</span>
        </SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 18 }}>
          {localInputs.map((li) => (
            <div
              key={li.id}
              onClick={() => openLocalInput(f.id, li.item, li.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                background: '#101318',
                border: '1px solid #1C2027',
                borderRadius: 7,
                padding: '6px 8px',
                cursor: 'pointer',
              }}
            >
              <ItemSquare item={li.item} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{li.item}</div>
                <div style={{ fontSize: 9.5, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                  <TransportBadge t={li.t || 'Belt'} pad="1px 4px" />
                  Local node
                </div>
              </div>
              <span style={{ fontFamily: MONO, fontSize: 11.5, color: '#F5A95B' }}>{fmt(li.rate)}/m</span>
              <span style={{ fontSize: 9.5, color: '#5E646E' }}>Edit</span>
            </div>
          ))}
          {localInputs.length === 0 && <div style={{ fontSize: 11, color: '#5E646E', fontStyle: 'italic' }}>No local inputs — belt in ore from nearby nodes.</div>}
          <button
            onClick={() => openLocalInput(f.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'transparent',
              border: '1px dashed #2A2F39',
              color: '#8A909A',
              borderRadius: 6,
              padding: '5px 8px',
              fontSize: 10.5,
              cursor: 'pointer',
            }}
          >
            <span style={{ color: '#8B9DC3', fontWeight: 600 }}>＋</span> Add input
          </button>
        </div>

        <SectionLabel>
          Exports &amp; imports
          <span style={{ color: '#5BCB86', fontSize: 9 }}>↑ out</span>
          <span style={{ color: '#F5A95B', fontSize: 9 }}>↓ in</span>
        </SectionLabel>
        <FlowList
          flows={flows}
          expandedFlow={st.expandedFlow}
          keyPrefix="d_"
          onToggle={(k) => up((s) => ({ expandedFlow: { ...s.expandedFlow, [k]: !s.expandedFlow[k] } }))}
          emptyText="No routes connected. Draw one from the map."
          onLegClick={(leg) => {
            if (leg.localInputId) openLocalInput(f.id, undefined, leg.localInputId);
            else if (leg.routeId) openRoute(leg.routeId);
          }}
          addLeg={(fl) => (
            <button
              onClick={() => addFlowLeg(fl.item, fl.dir, f.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'transparent',
                border: '1px dashed #2A2F39',
                color: '#8A909A',
                borderRadius: 6,
                padding: '5px 8px',
                fontSize: 10.5,
                cursor: 'pointer',
                marginTop: 1,
              }}
            >
              <span style={{ color: '#F5A95B', fontWeight: 600 }}>＋</span> Add transport
            </button>
          )}
        />
      </>
    );
  }

  return (
    <aside data-m-panel="" style={{ width: 262, flex: '0 0 262px', borderLeft: '1px solid #1A1E25', overflowY: 'auto', background: '#0D0E12', padding: '16px 15px' }}>
      {content}
    </aside>
  );
}
