import { useMemo, useRef, useState, type CSSProperties } from 'react';
import { RECIPES, fmt, recipeById, statusMeta } from '../../data/gameData';
import { aggregate, aggregateEffective, exportRemainder, importedByItem, itemExported, itemSupply, localInputByItem } from '../../state/derive';
import {
  computeFactoryLineFeeds,
  effectiveOutputRate,
  inputSourcesForSection,
  isExportDestinationSelected,
  isImportSourceSelected,
  isLocalSourceSelected,
  isSectionDestinationSelected,
  rowDestinationShares,
  rowEfficiency,
  rowFeedStatus,
  sectionFeedStatus,
  sectionHasDeficit,
  sectionMaxDeficit,
  sectionNeeds,
  type FactoryLineFeeds,
} from '../../state/lineFeeds';
import { isFactoryDirty } from '../../model/baseline';
import { vehicleHops } from '../../model/logistics';
import { applyFlowOrder, buildFlows } from '../../state/flows';
import { useActions, useStore, useWorld } from '../../state/store';
import type { Factory, Row, Section, World } from '../../types';
import { ExportStationTree, ImportStationTree } from '../ExportStationTree';
import { AccordionSection, FlowList, FavStar, ItemSquare, MONO, ProducedRow, SG, SectionLabel } from '../bits';
import { SplitLayout } from '../SplitLayout';

export function FactoryScreen() {
  const { st, up, factory, openFactory } = useStore();
  const world = useWorld();
  const f = factory(st.selFactory);
  if (!f) return null;

  const agg = aggregate(f);
  const effAgg = useMemo(() => aggregateEffective(world, f), [world, f]);
  return (
    <SplitLayout
      id="factory"
      screen
      stackOnMobile
      left={{ defaultWidth: 280, minWidth: 200, maxWidth: 420 }}
      right={{ defaultWidth: 262, minWidth: 200, maxWidth: 420 }}
      panes={{
        left: <IdentityPanel f={f} agg={agg} openFactory={openFactory} world={world} />,
        main: <ProductionPanel f={f} agg={agg} effAgg={effAgg} />,
        right: <RightPanel f={f} effAgg={effAgg} />,
      }}
    />
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
  vehicleHops(world).forEach((hop) => {
    if (hop.fromFactoryId === f.id) {
      const o = facById[hop.toFactoryId];
      if (o) linked.push({ name: o.name, color: o.color, dir: '→ out', item: hop.item, id: o.id });
    }
    if (hop.toFactoryId === f.id) {
      const o = facById[hop.fromFactoryId];
      if (o) linked.push({ name: o.name, color: o.color, dir: '← in', item: hop.item, id: o.id });
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
    <aside data-m-panel="" style={{ flex: 1, minHeight: 0, overflowY: 'auto', background: '#0D0E12' }}>
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

function chipStyle(color: string, bg: string, border: string): CSSProperties {
  return {
    fontSize: 10,
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: 5,
    color,
    background: bg,
    border: `1px solid ${border}`,
    whiteSpace: 'nowrap',
  };
}

function RowDestinationsPanel({
  f,
  sec,
  row,
  feeds,
  onToggle,
}: {
  f: Factory;
  sec: Section;
  row: Row;
  feeds: FactoryLineFeeds;
  onToggle: (target: { kind: 'export' } | { kind: 'section'; sectionId: string }) => void;
}) {
  const shares = rowDestinationShares(f, row, feeds);
  const otherSections = f.sections.filter((s) => s.id !== sec.id);

  return (
    <div style={{ flex: 1, minWidth: 180 }}>
      <span style={{ fontSize: 9, letterSpacing: '.06em', textTransform: 'uppercase', color: '#5E646E', display: 'block', marginBottom: 6 }}>
        Destinations
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {otherSections.map((other) => {
          const checked = isSectionDestinationSelected(row, other.id);
          return (
            <label
              key={other.id}
              style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 11.5, color: checked ? '#C2C8D2' : '#8A909A' }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle({ kind: 'section', sectionId: other.id })}
                style={{ accentColor: f.color }}
              />
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{other.name}</span>
            </label>
          );
        })}
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 11.5, color: isExportDestinationSelected(row) ? '#C2C8D2' : '#8A909A' }}>
          <input
            type="checkbox"
            checked={isExportDestinationSelected(row)}
            onChange={() => onToggle({ kind: 'export' })}
            style={{ accentColor: '#9097A1' }}
          />
          <span>Export</span>
        </label>
      </div>
      {shares.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4, borderTop: '1px solid #1A1E25', paddingTop: 8 }}>
          {shares.map((share) => (
            <div key={share.key} style={{ fontSize: 10.5, color: '#9097A1' }}>
              <span style={{ color: share.kind === 'export' ? '#9097A1' : '#C2C8D2' }}>{share.label}</span>
              {share.outputs.map((op) => (
                <span key={op.item} style={{ fontFamily: MONO, marginLeft: 6, color: '#5BCB86' }}>
                  +{fmt(op.rate)}/m {op.item}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RowSourcesPanel({
  f,
  sec,
  row,
  feeds,
  world,
  onToggleSource,
}: {
  f: Factory;
  sec: Section;
  row: Row;
  feeds: FactoryLineFeeds;
  world: World;
  onToggleSource: (target: { kind: 'local'; localInputId: string } | { kind: 'import'; item: string }) => void;
}) {
  const rec = recipeById(row.recipeId);
  if (!rec) return null;
  const needs = sectionNeeds(sec);
  const inputItems = new Set(rec.inputs.map((ip) => ip.item));
  const localOptions = (f.localInputs || []).filter((li) => inputItems.has(li.item));
  const importOptions = [...inputItems].filter(
    (item) => importedByItem(world, f, item) > 0.001 || (f.importOrder ?? []).includes(item),
  );

  return (
    <div style={{ flex: 1, minWidth: 180 }}>
      <span style={{ fontSize: 9, letterSpacing: '.06em', textTransform: 'uppercase', color: '#5E646E', display: 'block', marginBottom: 6 }}>
        Sources
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rec.inputs.length === 0 && <span style={{ fontSize: 11, color: '#5E646E' }}>Raw / none</span>}
        {rec.inputs.map((ip) => {
          const need = needs[ip.item] || 0;
          const sources = inputSourcesForSection(f, sec.id, ip.item, feeds);
          const lineInbound = sources.reduce((sum, s) => sum + s.rate, 0);
          const rowState = feeds.byRowId[row.id];
          const inputState = rowState?.inputs.find((x) => x.item === ip.item);
          const available = inputState?.available ?? lineInbound;
          const deficit = Math.max(0, need - available);
          const rowNeed = ip.rate * row.count;
          return (
            <div key={ip.item}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                <ItemSquare item={ip.item} />
                <span style={{ fontSize: 11.5, color: '#C2C8D2', flex: 1 }}>{ip.item}</span>
                <span style={{ fontFamily: MONO, fontSize: 11, color: '#E5604D' }}>{fmt(rowNeed)}/m</span>
              </div>
              {sources.length > 0 ? (
                <div style={{ paddingLeft: 28, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {sources.map((src) => (
                    <div key={`${src.sectionId}-${src.rowId}`} style={{ fontSize: 10.5, color: '#8A909A' }}>
                      ← {src.sectionName} · {src.recipeName}
                      <span style={{ fontFamily: MONO, marginLeft: 6, color: '#5BCB86' }}>+{fmt(src.rate)}/m</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ paddingLeft: 28, fontSize: 10.5, color: '#5E646E', fontStyle: 'italic' }}>No line feeds mapped</div>
              )}
              {deficit > 0.001 && (
                <div style={{ paddingLeft: 28, marginTop: 3, fontSize: 10.5, fontFamily: MONO, color: '#E5604D' }}>
                  Deficit −{fmt(deficit)}/m (line needs {fmt(need)}/m, available {fmt(available)}/m)
                </div>
              )}
            </div>
          );
        })}
      </div>
      {(localOptions.length > 0 || importOptions.length > 0) && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5, borderTop: '1px solid #1A1E25', paddingTop: 8 }}>
          <span style={{ fontSize: 9, letterSpacing: '.06em', textTransform: 'uppercase', color: '#5E646E' }}>Claim supply</span>
          {localOptions.map((li) => {
            const checked = isLocalSourceSelected(row, li.id);
            return (
              <label
                key={li.id}
                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 11.5, color: checked ? '#C2C8D2' : '#8A909A' }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggleSource({ kind: 'local', localInputId: li.id })}
                  style={{ accentColor: '#8B9DC3' }}
                />
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Local · {li.item} · {fmt(li.rate)}/m
                </span>
              </label>
            );
          })}
          {importOptions.map((item) => {
            const checked = isImportSourceSelected(row, item);
            const rate = importedByItem(world, f, item);
            return (
              <label
                key={item}
                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 11.5, color: checked ? '#C2C8D2' : '#8A909A' }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggleSource({ kind: 'import', item })}
                  style={{ accentColor: '#F5A95B' }}
                />
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Import · {item} · {fmt(rate)}/m
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProductionPanel({ f, agg, effAgg }: { f: Factory; agg: ReturnType<typeof aggregate>; effAgg: ReturnType<typeof aggregateEffective> }) {
  const { st, up } = useStore();
  const world = useWorld();
  const { setRowCount, removeRow, addSection, renameSection, openRecipePicker, resetFactory, commitFactory, openLocalInput, toggleFav, toggleDestination, toggleSource, removeSection } = useActions();

  const lineFeeds = useMemo(() => computeFactoryLineFeeds(world, f), [world, f]);

  const [acc, setAcc] = useState({ favorites: true, balance: true, lines: true });
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editSectionName, setEditSectionName] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  const dirty = isFactoryDirty(f, world.routes, world.stations ?? []);

  const localByItem = localInputByItem(f);

  const balanceForItem = (item: string) => {
    const made = effAgg.per[item]?.out || 0;
    const need = effAgg.per[item]?.in || 0;
    const imp = importedByItem(world, f, item);
    const local = localByItem[item] || 0;
    const exp = itemExported(world, f, item);
    return { item, made, need, imp, local, exp, net: made + imp + local - need - exp };
  };

  const resKeys: Record<string, 1> = {};
  Object.keys(effAgg.per).forEach((k) => (resKeys[k] = 1));
  Object.keys(localByItem).forEach((k) => (resKeys[k] = 1));
  buildFlows(world, f).forEach((fl) => (resKeys[fl.item] = 1));
  (f.exportOrder ?? []).forEach((item) => (resKeys[item] = 1));
  (f.importOrder ?? []).forEach((item) => (resKeys[item] = 1));

  const resBalance = Object.keys(resKeys)
    .map((item) => balanceForItem(item))
    .sort((a, b) => a.net - b.net);

  const favorites = st.favItems.filter((item) => !!resKeys[item]).map((item) => balanceForItem(item));

  const startSectionEdit = (secId: string, name: string) => {
    setEditingSectionId(secId);
    setEditSectionName(name);
    requestAnimationFrame(() => editInputRef.current?.select());
  };

  const commitSectionEdit = (secId: string) => {
    renameSection(f.id, secId, editSectionName);
    setEditingSectionId(null);
  };

  const renderBalanceCard = (rb: (typeof resBalance)[number], showStar = true) => {
    const deficit = rb.net < -0.001;
    const surplus = rb.net > 0.001;
    const nc = deficit ? '#E5604D' : surplus ? '#5BCB86' : '#9097A1';
    const stats: { label: string; value: string; color: string }[] = [{ label: 'Made here', value: fmt(rb.made), color: '#7FBE98' }];
    if (rb.imp > 0.001) stats.push({ label: 'Imported', value: '+' + fmt(rb.imp), color: '#F5A95B' });
    if (rb.local > 0.001) stats.push({ label: 'Local', value: '+' + fmt(rb.local), color: '#8B9DC3' });
    if (rb.need > 0.001) stats.push({ label: 'Required', value: '−' + fmt(rb.need), color: '#D98176' });
    if (rb.exp > 0.001) stats.push({ label: 'Exported', value: '−' + fmt(rb.exp), color: '#9097A1' });
    const favorited = st.favItems.includes(rb.item);
    return (
      <div key={rb.item} style={{ background: '#0F1116', border: `1px solid ${deficit ? '#3A2020' : '#1C2027'}`, borderRadius: 10, padding: '11px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
          <ItemSquare item={rb.item} size={26} radius={6} fontSize={9} />
          <span style={{ flex: 1, fontSize: 11.5, fontWeight: 500, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rb.item}</span>
          {showStar && <FavStar favorited={favorited} onToggle={() => toggleFav(rb.item)} />}
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
  };

  return (
    <section data-m-panel="" data-m-pad="" style={{ flex: 1, minWidth: 0, minHeight: 0, overflowY: 'auto', padding: '18px 20px 60px' }}>
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

      <AccordionSection
        title="Favorites"
        count={favorites.length}
        icon={<span style={{ color: '#F5A95B', fontSize: 12 }}>★</span>}
        expanded={acc.favorites}
        onToggle={() => setAcc((s) => ({ ...s, favorites: !s.favorites }))}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10 }}>
          {favorites.map((rb) => renderBalanceCard(rb, true))}
          {favorites.length === 0 && (
            <div style={{ gridColumn: '1/-1', border: '1px dashed #2A2F39', borderRadius: 10, padding: 18, textAlign: 'center', fontSize: 12, color: '#6B7280' }}>
              ★ Star items in Resource balance or Factory balance to pin them here.
            </div>
          )}
        </div>
      </AccordionSection>

      {resBalance.length > 0 && (
        <AccordionSection
          title="Resource balance"
          count={resBalance.length}
          hint="Made + imported + local − required − exported"
          expanded={acc.balance}
          onToggle={() => setAcc((s) => ({ ...s, balance: !s.balance }))}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(158px,1fr))', gap: 10 }}>
            {resBalance.map((rb) => renderBalanceCard(rb, true))}
          </div>
        </AccordionSection>
      )}

      <AccordionSection
        title="Production lines"
        count={`${agg.machines} machines · ${f.sections.length} sections`}
        expanded={acc.lines}
        onToggle={() => setAcc((s) => ({ ...s, lines: !s.lines }))}
        mb={0}
      >
        {f.sections.map((sec) => {
          let secPower = 0;
          sec.rows.forEach((row) => {
            const rec = recipeById(row.recipeId);
            if (rec) secPower += rec.power * row.count;
          });
          const feedStatus = sectionFeedStatus(f, sec.id);
          const hasDeficit = sectionHasDeficit(f, sec.id, lineFeeds);
          const maxDeficit = sectionMaxDeficit(f, sec.id, lineFeeds);
          return (
            <div key={sec.id} style={{ marginBottom: 16, border: '1px solid #1C2027', borderRadius: 11, overflow: 'hidden', background: '#0F1116' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: '#13151B', borderBottom: '1px solid #1C2027' }}>
                <span style={{ width: 3, height: 15, borderRadius: 2, background: f.color }}></span>
                {editingSectionId === sec.id ? (
                  <input
                    ref={editInputRef}
                    value={editSectionName}
                    onChange={(e) => setEditSectionName(e.target.value)}
                    onBlur={() => commitSectionEdit(sec.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitSectionEdit(sec.id);
                      if (e.key === 'Escape') setEditingSectionId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      flex: 1,
                      background: '#0C0D11',
                      border: '1px solid #F5882E55',
                      borderRadius: 6,
                      color: '#E7E9ED',
                      padding: '4px 8px',
                      fontFamily: SG,
                      fontWeight: 600,
                      fontSize: 13.5,
                    }}
                  />
                ) : (
                  <span
                    onClick={() => startSectionEdit(sec.id, sec.name)}
                    title="Click to rename"
                    style={{ fontFamily: SG, fontWeight: 600, fontSize: 13.5, flex: 1, cursor: 'text', display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}
                  >
                    <span style={{ minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sec.name}</span>
                    <span style={{ fontSize: 10, color: '#4B515B', flex: '0 0 auto' }}>✎</span>
                  </span>
                )}
                {feedStatus && (
                  <span style={chipStyle('#8A909A', '#15171D', '#262B34')} title="Where this line sends its output">
                    {feedStatus}
                  </span>
                )}
                {hasDeficit && (
                  <span style={chipStyle('#E5604D', '#1A0E0E', '#3A2020')} title="Inputs not fully covered by other production lines">
                    Deficit −{fmt(maxDeficit)}/m
                  </span>
                )}
                <span style={{ fontSize: 11, color: '#6B7280', fontFamily: MONO }}>{fmt(secPower)} MW</span>
                <button
                  onClick={() => openRecipePicker('add', f.id, sec.id, null)}
                  style={{ background: '#1A1D24', border: '1px solid #2A2F39', color: '#C2C8D2', borderRadius: 6, padding: '4px 9px', fontSize: 11, cursor: 'pointer' }}
                >
                  ＋ Recipe
                </button>
                <button
                  onClick={() => removeSection(f.id, sec.id)}
                  title="Delete production line"
                  style={{ background: 'transparent', border: 'none', color: '#5E646E', cursor: 'pointer', fontSize: 16, padding: '0 2px', lineHeight: 1 }}
                >
                  ×
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
                <span style={{ width: 20 }}></span>
              </div>
              {sec.rows.map((row) => {
                const rec = recipeById(row.recipeId);
                if (!rec) return null;
                const exp = !!st.expanded[row.id];
                const prim = rec.outputs[0];
                const picking = st.picker?.mode === 'edit' && st.picker.rowId === row.id;
                const destLabel = rowFeedStatus(f, row);
                const efficiency = rowEfficiency(lineFeeds, row.id);
                const nameplateRate = prim.rate * row.count;
                const effectiveRate = effectiveOutputRate(lineFeeds, row, prim.item);
                const throttled = efficiency < 0.999;
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
                        onClick={() => up((s) => ({ expanded: { ...s.expanded, [row.id]: !exp } }))}
                        title={exp ? 'Collapse details' : 'Expand details'}
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
                          background: exp ? '#12141A' : 'transparent',
                          border: '1px solid transparent',
                        }}
                      >
                        <ItemSquare item={prim.item} size={24} radius={6} fontSize={9} />
                        <span style={{ fontWeight: 500, fontSize: 12.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rec.name}</span>
                        {rec.alt && (
                          <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '.04em', color: '#C58BE0', border: '1px solid #4A3358', background: '#221A2B', borderRadius: 4, padding: '1px 5px' }}>
                            ALT
                          </span>
                        )}
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            openRecipePicker('edit', f.id, sec.id, row.id);
                          }}
                          title="Change recipe"
                          style={{
                            fontSize: 10,
                            color: picking ? '#C49A6C' : '#4B515B',
                            flex: '0 0 auto',
                            padding: '1px 4px',
                            borderRadius: 4,
                            background: picking ? '#18151A' : 'transparent',
                          }}
                        >
                          ✎
                        </span>
                        <span data-m-colhide="" style={{ fontSize: 10, color: '#6B7280', flex: '0 0 auto' }}>{destLabel}</span>
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
                      <span style={{ width: 72, textAlign: 'right', fontFamily: MONO, fontSize: 12, color: throttled ? '#9097A1' : '#5BCB86' }}>
                        +{fmt(effectiveRate)}/m
                        {throttled && (
                          <span style={{ display: 'block', fontSize: 9, color: '#5E646E' }}>
                            {Math.round(efficiency * 100)}% of {fmt(nameplateRate)}
                          </span>
                        )}
                      </span>
                      <span data-m-colhide="" style={{ width: 58, textAlign: 'right', fontFamily: MONO, fontSize: 11.5, color: '#F5A95B' }}>
                        {fmt(rec.power * row.count)} MW
                      </span>
                      <span onClick={() => removeRow(f.id, sec.id, row.id)} style={{ width: 20, textAlign: 'center', color: '#5E646E', cursor: 'pointer', fontSize: 15 }}>
                        ×
                      </span>
                    </div>
                    {exp && (
                      <div style={{ padding: '10px 16px 14px 42px', background: '#0B0C10', borderTop: '1px solid #15181E' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
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
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: '#4B515B', paddingTop: 14 }}>
                            <span style={{ fontFamily: MONO, fontSize: 10, color: '#6B7280' }}>
                              {row.count}× {rec.building}
                            </span>
                            <span style={{ fontSize: 18, color: f.color }}>→</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <span style={{ fontSize: 9, letterSpacing: '.06em', textTransform: 'uppercase', color: '#5E646E' }}>Outputs</span>
                            {rec.outputs.map((op) => {
                              const effRate = effectiveOutputRate(lineFeeds, row, op.item);
                              const nameplate = op.rate * row.count;
                              const outThrottled = effRate < nameplate - 0.001;
                              return (
                                <div key={op.item} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                  <ItemSquare item={op.item} />
                                  <span style={{ fontSize: 11.5, color: '#C2C8D2' }}>{op.item}</span>
                                  <span style={{ fontFamily: MONO, fontSize: 11, color: outThrottled ? '#9097A1' : '#5BCB86' }}>
                                    {fmt(effRate)}/m
                                    {outThrottled && <span style={{ color: '#5E646E', marginLeft: 4 }}>({fmt(nameplate)})</span>}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap', borderTop: '1px solid #15181E', paddingTop: 12 }}>
                          <RowSourcesPanel
                            f={f}
                            sec={sec}
                            row={row}
                            feeds={lineFeeds}
                            world={world}
                            onToggleSource={(target) => toggleSource(f.id, sec.id, row.id, target)}
                          />
                          <RowDestinationsPanel
                            f={f}
                            sec={sec}
                            row={row}
                            feeds={lineFeeds}
                            onToggle={(target) => toggleDestination(f.id, sec.id, row.id, target)}
                          />
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
          style={{ width: '100%', background: 'transparent', border: '1px dashed #2A2F39', color: '#8A909A', borderRadius: 10, padding: 11, fontSize: 12, cursor: 'pointer', marginTop: 4 }}
        >
          ＋ Add section
        </button>
      </AccordionSection>
    </section>
  );
}

// ===================== right panel: picker or balance =====================

function RightPanel({ f, effAgg }: { f: Factory; effAgg: ReturnType<typeof aggregateEffective> }) {
  const { st, up, openFactory } = useStore();
  const world = useWorld();
  const {
    pickRecipe,
    openLocalInput,
    openRoute,
    removeLocalInput,
    removeRoute,
    reorderFlows,
    openAddExportResource,
    openAddReceivingStation,
    openStationCreate,
    openStationEdit,
    toggleFav,
    removeExportResource,
  } = useActions();

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
    const produced = Object.keys(effAgg.per)
      .filter((i) => effAgg.per[i].out > 0.001)
      .map((i) => ({ item: i, out: effAgg.per[i].out }))
      .sort((a, b) => b.out - a.out);
    const flows = buildFlows(world, f);
    const imports = applyFlowOrder(
      flows.filter((fl) => fl.dir === 'import'),
      f.importOrder,
    );
    const exportFlows = applyFlowOrder(
      flows.filter((fl) => fl.dir === 'export'),
      f.exportOrder,
    );
    const addTransportBtn = (fl: (typeof flows)[number], accent: string) => (
      <button
        onClick={() => openRoute(undefined)}
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
        <span style={{ color: accent, fontWeight: 600 }}>＋</span> Add belt/pipe route
      </button>
    );
    const deleteImportLeg = (leg: { localInputId?: string; routeId?: string }) => {
      if (leg.localInputId) removeLocalInput(f.id, leg.localInputId);
    };
    const deleteExportLeg = (leg: { localInputId?: string; routeId?: string }) => {
      if (leg.routeId) removeRoute(leg.routeId);
    };
    content = (
      <>
        <div style={{ fontFamily: SG, fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Factory balance</div>

        <SectionLabel color="#5BCB86" mb={8}>
          Produced here <span style={{ color: '#5E646E' }}>{produced.length}</span>
        </SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 18 }}>
          {produced.map((x) => (
            <ProducedRow
              key={x.item}
              name={x.item}
              rate={'+' + fmt(x.out) + '/m'}
              favorited={st.favItems.includes(x.item)}
              onToggleFav={() => toggleFav(x.item)}
            />
          ))}
          {produced.length === 0 && <div style={{ fontSize: 11, color: '#5E646E', fontStyle: 'italic' }}>Nothing produced yet — add a recipe.</div>}
        </div>

        <SectionLabel color="#F5A95B" mb={8}>
          Imports <span style={{ color: '#5E646E' }}>{imports.length}</span>
          <span style={{ fontSize: 9 }}>↓ in</span>
        </SectionLabel>
        <div style={{ borderLeft: '2px solid #F5A95B33', paddingLeft: 10, marginBottom: 18 }}>
          <FlowList
            flows={imports}
            expandedFlow={st.expandedFlow}
            keyPrefix="d_"
            onToggle={(k) => up((s) => ({ expandedFlow: { ...s.expandedFlow, [k]: !s.expandedFlow[k] } }))}
            emptyText="No imports yet."
            favoritedItems={st.favItems}
            onToggleFav={toggleFav}
            onLegClick={(leg) => {
              if (leg.localInputId) openLocalInput(f.id, undefined, leg.localInputId);
              else if (leg.routeId) openRoute(leg.routeId, { readOnly: true });
              else if (leg.stationId && leg.vehicleId) {
                const srcStation = world.stations?.find((s) => s.id === leg.stationId);
                if (srcStation) openFactory(srcStation.homeFactoryId);
              }
            }}
            onLegDelete={deleteImportLeg}
            canDeleteLeg={(leg) => !!leg.localInputId}
            legActionLabel={(leg) => (leg.localInputId ? 'Edit' : 'View')}
            onReorder={(orderedItems) => reorderFlows(f.id, 'import', orderedItems)}
            addLeg={(fl) => (
              <ImportStationTree
                world={world}
                factory={f}
                resourceId={fl.item}
                onEditStation={(id) => openStationEdit(f.id, id)}
              />
            )}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: imports.length > 0 ? 6 : 0 }}>
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
              <span style={{ color: '#8B9DC3', fontWeight: 600 }}>＋</span> Add local input
            </button>
            <button
              onClick={() => openAddReceivingStation(f.id)}
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
              <span style={{ color: '#F5A95B', fontWeight: 600 }}>＋</span> Add receiving station
            </button>
          </div>
        </div>

        <SectionLabel color="#5BCB86" mb={8}>
          Exports <span style={{ color: '#5E646E' }}>{exportFlows.length}</span>
          <span style={{ fontSize: 9 }}>↑ out</span>
        </SectionLabel>
        <div style={{ borderLeft: '2px solid #5BCB8633', paddingLeft: 10 }}>
          <FlowList
            flows={exportFlows}
            expandedFlow={st.expandedFlow}
            keyPrefix="d_"
            onToggle={(k) => up((s) => ({ expandedFlow: { ...s.expandedFlow, [k]: !s.expandedFlow[k] } }))}
            emptyText="No exports yet."
            favoritedItems={st.favItems}
            onToggleFav={toggleFav}
            onLegClick={(leg) => {
              if (leg.routeId) openRoute(leg.routeId);
            }}
            onLegDelete={deleteExportLeg}
            canDeleteLeg={(leg) => !!leg.routeId}
            legActionLabel={() => 'Edit'}
            flowHint={(fl) => {
              const supply = itemSupply(world, f, fl.item);
              const exported = itemExported(world, f, fl.item);
              const left = exportRemainder(world, f, fl.item);
              return (
                <>
                  {fmt(exported)}/{fmt(supply)} exported
                  <span style={{ color: left < -0.001 ? '#E5604D' : '#8A909A' }}> · {fmt(Math.max(0, left))} left</span>
                </>
              );
            }}
            onReorder={(orderedItems) => reorderFlows(f.id, 'export', orderedItems)}
            onFlowDelete={(fl) => removeExportResource(f.id, fl.item)}
            addLeg={(fl) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <ExportStationTree
                  world={world}
                  factory={f}
                  resourceId={fl.item}
                  onAddStation={() => openStationCreate(f.id, fl.item, 'export')}
                  onEditStation={(id) => openStationEdit(f.id, id)}
                />
                {addTransportBtn(fl, '#5BCB86')}
              </div>
            )}
          />
          <button
            onClick={() => openAddExportResource(f.id)}
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
              marginTop: 8,
            }}
          >
            <span style={{ color: '#5BCB86', fontWeight: 600 }}>＋</span> Add Resource
          </button>
        </div>
      </>
    );
  }

  return (
    <aside data-m-panel="" style={{ flex: 1, minHeight: 0, overflowY: 'auto', background: '#0D0E12', padding: '16px 15px' }}>
      {content}
    </aside>
  );
}
