import type { ReactNode } from 'react';
import { BUILDINGS, ITEMS, RECIPES, fmt, initials, itemColor } from '../../data/gameData';
import { rollupWorld } from '../../state/derive';
import { useStore } from '../../state/store';
import { ItemSquare, MONO, SG } from '../bits';
import { SplitLayout } from '../SplitLayout';
import type { Recipe } from '../../types';

export function ReferenceScreen() {
  const { st, up, world } = useStore();

  // No active world: reference stays browsable, world stats just read as zero.
  const rollupPer = world ? rollupWorld(world) : {};
  const refQ = (st.refSearch || '').toLowerCase();
  const allNames = Object.keys(ITEMS);
  const buildingNames = Object.keys(BUILDINGS);
  const isBuildingSel = !!(st.refSel && BUILDINGS[st.refSel]);
  const refSel =
    st.refSel && (ITEMS[st.refSel] || BUILDINGS[st.refSel])
      ? st.refSel
      : allNames.find((n) => ITEMS[n].cat === 'Raw Ore') || allNames[0];

  const matchItem = (n: string) => !refQ || n.toLowerCase().includes(refQ) || ITEMS[n].cat.toLowerCase().includes(refQ);
  const resources = allNames.filter((n) => ITEMS[n].cat === 'Raw Ore').filter(matchItem);
  const itemsList = allNames.filter((n) => ITEMS[n].cat !== 'Raw Ore').filter(matchItem);
  const buildingsList = buildingNames.filter((b) => !refQ || b.toLowerCase().includes(refQ) || 'machine'.includes(refQ));

  const groups = [
    { label: 'Resources', entries: resources.map((n) => ({ name: n, tileBg: itemColor(n), tileText: initials(n), tileTextColor: '#0C0D11', cat: ITEMS[n].cat })) },
    { label: 'Items', entries: itemsList.map((n) => ({ name: n, tileBg: itemColor(n), tileText: initials(n), tileTextColor: '#0C0D11', cat: ITEMS[n].cat })) },
    { label: 'Buildings', entries: buildingsList.map((b) => ({ name: b, tileBg: '#181B21', tileText: BUILDINGS[b].glyph, tileTextColor: '#E7E9ED', cat: 'Machine' })) },
  ].filter((g) => g.entries.length);

  const nav = (item: string) => {
    if (ITEMS[item]) up({ refSel: item });
  };

  const recipeCard = (rc: Recipe, hideBuilding: boolean, outputsClickable: boolean): ReactNode => (
    <div key={rc.id} style={{ background: '#0F1116', border: `1px solid ${rc.alt ? '#2A2436' : '#1C2027'}`, borderRadius: 11, padding: '13px 15px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
        <span style={{ fontFamily: SG, fontWeight: 600, fontSize: 13.5 }}>{rc.name}</span>
        {rc.alt ? (
          <span style={{ fontSize: 9, fontWeight: 600, color: '#C58BE0', border: '1px solid #4A3358', background: '#221A2B', borderRadius: 4, padding: '1px 6px' }}>ALT</span>
        ) : (
          <span style={{ fontSize: 9, fontWeight: 600, color: '#6B9C7E', border: '1px solid #244A33', background: '#0E1A12', borderRadius: 4, padding: '1px 6px' }}>STANDARD</span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#6B7280' }}>{hideBuilding ? `${rc.power} MW` : `${rc.building} · ${rc.power} MW`}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {rc.inputs.map((ip) => (
            <div key={ip.item} onClick={() => nav(ip.item)} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
              <ItemSquare item={ip.item} size={18} radius={4} fontSize={7} />
              <span style={{ fontSize: 11.5, color: '#AEB4BE', flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ip.item}</span>
              <span style={{ fontFamily: MONO, fontSize: 10.5, color: '#8A909A' }}>{fmt(ip.rate)}/m</span>
            </div>
          ))}
          {rc.inputs.length === 0 && <span style={{ fontSize: 11, color: '#5E646E' }}>Raw extraction</span>}
        </div>
        <span style={{ color: itemColor(rc.outputs[0].item), fontSize: 17, flex: '0 0 auto' }}>→</span>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {rc.outputs.map((op) => (
            <div
              key={op.item}
              onClick={outputsClickable ? () => nav(op.item) : undefined}
              style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: outputsClickable ? 'pointer' : undefined }}
            >
              <ItemSquare item={op.item} size={18} radius={4} fontSize={7} />
              <span style={{ fontSize: 11.5, color: '#E7E9ED', flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{op.item}</span>
              <span style={{ fontFamily: MONO, fontSize: 10.5, color: '#5BCB86' }}>{fmt(op.rate)}/m</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  let detail: ReactNode;
  if (isBuildingSel) {
    const b = refSel;
    const recs = RECIPES.filter((r) => r.building === b).sort((a, c) => (a.alt === c.alt ? 0 : a.alt ? 1 : -1));
    detail = (
      <div style={{ maxWidth: 780 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <span
            style={{
              width: 48,
              height: 48,
              borderRadius: 11,
              background: '#181B21',
              border: '1px solid #2A2F39',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              flex: '0 0 auto',
            }}
          >
            {BUILDINGS[b].glyph}
          </span>
          <div>
            <h1 style={{ fontFamily: SG, fontWeight: 700, fontSize: 23, margin: 0 }}>{b}</h1>
            <div style={{ fontSize: 12, color: '#7B828D', marginTop: 2 }}>Machine</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 26 }}>
          <div style={{ flex: 1, background: '#0F1116', border: '1px solid #1C2027', borderRadius: 10, padding: '11px 13px' }}>
            <div style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '.05em', color: '#5E646E' }}>Base power</div>
            <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 16, color: '#F5A95B', marginTop: 3 }}>{BUILDINGS[b].power} MW</div>
          </div>
          <div style={{ flex: 1, background: '#0F1116', border: '1px solid #1C2027', borderRadius: 10, padding: '11px 13px' }}>
            <div style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '.05em', color: '#5E646E' }}>Recipes</div>
            <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 16, color: '#E7E9ED', marginTop: 3 }}>{recs.length}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontFamily: SG, fontWeight: 600, fontSize: 15 }}>Supported recipes</span>
          <span style={{ fontSize: 11, color: '#5E646E' }}>{recs.length}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>{recs.map((rc) => recipeCard(rc, true, true))}</div>
      </div>
    );
  } else {
    const sel = refSel;
    const r = rollupPer[sel] || { produced: 0, consumed: 0, producers: [], consumers: [] };
    const net = r.produced - r.consumed;
    const makeR = RECIPES.filter((rc) => rc.outputs.some((o) => o.item === sel)).sort((a, b) => (a.alt === b.alt ? 0 : a.alt ? 1 : -1));
    const useR = RECIPES.filter((rc) => rc.inputs.some((i) => i.item === sel));
    detail = (
      <div style={{ maxWidth: 780 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <ItemSquare item={sel} size={48} radius={11} fontSize={15} />
          <div>
            <h1 style={{ fontFamily: SG, fontWeight: 700, fontSize: 23, margin: 0 }}>{sel}</h1>
            <div style={{ fontSize: 12, color: '#7B828D', marginTop: 2 }}>{ITEMS[sel].cat}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 26 }}>
          <div style={{ flex: 1, background: '#0F1116', border: '1px solid #1C2027', borderRadius: 10, padding: '11px 13px' }}>
            <div style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '.05em', color: '#5E646E' }}>Produced</div>
            <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 16, color: '#5BCB86', marginTop: 3 }}>{fmt(r.produced)}/m</div>
          </div>
          <div style={{ flex: 1, background: '#0F1116', border: '1px solid #1C2027', borderRadius: 10, padding: '11px 13px' }}>
            <div style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '.05em', color: '#5E646E' }}>Consumed</div>
            <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 16, color: '#E5604D', marginTop: 3 }}>{fmt(r.consumed)}/m</div>
          </div>
          <div style={{ flex: 1, background: '#0F1116', border: '1px solid #1C2027', borderRadius: 10, padding: '11px 13px' }}>
            <div style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '.05em', color: '#5E646E' }}>Net in world</div>
            <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 16, color: net > 0.001 ? '#5BCB86' : net < -0.001 ? '#E5604D' : '#9097A1', marginTop: 3 }}>
              {(net > 0 ? '+' : '') + fmt(net)}/m
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontFamily: SG, fontWeight: 600, fontSize: 15 }}>Ways to make {sel}</span>
          <span style={{ fontSize: 11, color: '#5E646E' }}>{makeR.length}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 28 }}>
          {makeR.map((rc) => recipeCard(rc, false, false))}
          {makeR.length === 0 && <div style={{ fontSize: 12, color: '#5E646E', fontStyle: 'italic' }}>Raw resource — extracted by a miner, no recipe.</div>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontFamily: SG, fontWeight: 600, fontSize: 15 }}>Used to make</span>
          <span style={{ fontSize: 11, color: '#5E646E' }}>{useR.length}</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {useR.map((rc) => {
            const prim = rc.outputs[0];
            return (
              <div
                key={rc.id}
                onClick={() => up({ refSel: prim.item })}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0F1116', border: '1px solid #20242D', borderRadius: 8, padding: '7px 11px', cursor: 'pointer' }}
              >
                <ItemSquare item={prim.item} />
                <span style={{ fontSize: 12 }}>{prim.item}</span>
                {rc.alt && <span style={{ fontSize: 8, fontWeight: 600, color: '#C58BE0' }}>ALT</span>}
              </div>
            );
          })}
          {useR.length === 0 && <div style={{ fontSize: 12, color: '#5E646E', fontStyle: 'italic' }}>Not used as an ingredient — this is an end product.</div>}
        </div>
      </div>
    );
  }

  return (
    <SplitLayout
      id="reference"
      screen
      stackOnMobile
      left={{ defaultWidth: 252, minWidth: 180, maxWidth: 380 }}
      panes={{
        left: (
      <div data-m-reflist="" style={{ flex: 1, minHeight: 0, background: '#0C0D11', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 12px 10px', borderBottom: '1px solid #161A21' }}>
          <input
            value={st.refSearch}
            onChange={(e) => up({ refSearch: e.target.value })}
            placeholder="Search items…"
            style={{ width: '100%', background: '#0F1116', border: '1px solid #262B34', borderRadius: 8, color: '#E7E9ED', padding: '8px 11px', fontSize: 12.5 }}
          />
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 6 }}>
          {groups.map((grp) => (
            <div key={grp.label}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 9px 5px', fontSize: 9.5, letterSpacing: '.07em', textTransform: 'uppercase', color: '#5E646E' }}>
                {grp.label} <span style={{ color: '#3F454E' }}>{grp.entries.length}</span>
              </div>
              {grp.entries.map((ri) => (
                <div
                  key={ri.name}
                  onClick={() => up({ refSel: ri.name })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    padding: '7px 9px',
                    borderRadius: 7,
                    cursor: 'pointer',
                    background: ri.name === refSel ? '#181B21' : 'transparent',
                    color: ri.name === refSel ? '#E7E9ED' : '#AEB4BE',
                  }}
                >
                  <ItemSquare size={22} color={ri.tileBg} text={ri.tileText} textColor={ri.tileTextColor} fontSize={9} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ri.name}</div>
                  </div>
                  <span style={{ fontSize: 9, color: '#5E646E', whiteSpace: 'nowrap' }}>{ri.cat}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
        ),
        main: (
      <div data-m-panel="" data-m-pad="" style={{ flex: 1, minWidth: 0, minHeight: 0, overflowY: 'auto', padding: '24px 28px 60px' }}>
        {detail}
      </div>
        ),
      }}
    />
  );
}
