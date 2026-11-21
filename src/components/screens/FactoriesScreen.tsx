import { useRef } from 'react';
import { fmt, initials, statusMeta } from '../../data/gameData';
import { aggregate, aggregateEffective, exportRemainder, itemExported, itemSupply } from '../../state/derive';
import { applyFlowOrder, buildFlows } from '../../state/flows';
import { useActions, useStore, useWorld } from '../../state/store';
import type { Factory } from '../../types';
import { FlowList, MONO, ProducedRow, SG, SectionLabel } from '../bits';
import { SplitLayout, type SplitLayoutHandle } from '../SplitLayout';

function factoryOutputs(world: ReturnType<typeof useWorld>, factory: Factory) {
  const { per } = aggregateEffective(world, factory);
  return Object.entries(per)
    .filter(([, rates]) => rates.out > 0.001)
    .map(([item, rates]) => ({ item, out: rates.out }))
    .sort((a, b) => b.out - a.out);
}

export function FactoriesScreen() {
  const { st, up, openFactory } = useStore();
  const world = useWorld();
  const splitRef = useRef<SplitLayoutHandle>(null);
  const {
    toggleFavFactory,
    openEditFactory,
    openRoute,
    openLocalInput,
    removeLocalInput,
    removeRoute,
    reorderFlows,
  } = useActions();

  const factories = [...world.factories].sort((a, b) => a.name.localeCompare(b.name));
  const favorites = factories.filter((f) => st.favFactories.includes(f.id));
  const focused = st.factoriesFocus ? world.factories.find((f) => f.id === st.factoriesFocus) : null;

  const onCardClick = (f: Factory) => {
    up({ factoriesFocus: f.id });
    splitRef.current?.expandRight();
  };

  const editButton = (f: Factory) => (
    <button
      type="button"
      aria-label={`Edit ${f.name}`}
      title="Edit factory"
      onClick={(event) => {
        event.stopPropagation();
        openEditFactory(f);
      }}
      style={{ display: 'grid', placeItems: 'center', width: 24, height: 24, flexShrink: 0, padding: 0, border: '1px solid #2A2F39', borderRadius: 6, color: '#C2C8D2', background: '#15171D', cursor: 'pointer' }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m16 3 5 5L9 20l-6 1 1-6L16 3Z M13 6l5 5" />
      </svg>
    </button>
  );

  const openProduction = (f: Factory) => (
    <button
      onClick={(event) => {
        event.stopPropagation();
        openFactory(f.id);
      }}
      style={{ marginTop: 9, background: 'transparent', border: 'none', padding: '3px 0', color: '#F5A95B', cursor: 'pointer', fontSize: 11 }}
    >
      Open production →
    </button>
  );

  return (
    <SplitLayout
      ref={splitRef}
      id="factories"
      screen
      stackOnMobile
      right={{ defaultWidth: 312, minWidth: 200, maxWidth: 420, defaultOpen: false }}
      panes={{
        main: (
          <div
            data-m-panel=""
            data-m-pad=""
            style={{ flex: 1, minWidth: 0, minHeight: 0, overflowY: 'auto', padding: '22px 26px 60px' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginBottom: 6 }}>
              <h1 style={{ fontFamily: SG, fontWeight: 700, fontSize: 22, margin: 0 }}>Factories</h1>
              <span style={{ fontSize: 12.5, color: '#6B7280', paddingBottom: 3 }}>
                {world.factories.length} across this world
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: '#7B828D', marginBottom: 22 }}>
              Power and machine counts are planning estimates.
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11 }}>
              <span style={{ color: '#F5A95B', fontSize: 13 }}>★</span>
              <span style={{ fontFamily: SG, fontWeight: 600, fontSize: 14 }}>Favorites</span>
              <span style={{ fontSize: 11, color: '#5E646E' }}>{favorites.length}</span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill,minmax(216px,1fr))',
                gap: 12,
                marginBottom: 28,
              }}
            >
              {favorites.map((f) => {
                const agg = aggregate(f);
                const starred = f.favoriteItems ?? [];
                const effective = starred.length ? aggregateEffective(world, f).per : {};
                const flows = starred.length ? buildFlows(world, f) : [];
                const sm = statusMeta(f.status);
                const isFocused = st.factoriesFocus === f.id;
                return (
                  <div
                    key={f.id}
                    tabIndex={0}
                    aria-label={`View details for ${f.name}`}
                    onClick={() => onCardClick(f)}
                    onKeyDown={(event) => {
                      if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                        event.preventDefault();
                        onCardClick(f);
                      }
                    }}
                    style={{
                      background: '#0F1116',
                      border: `1px solid ${isFocused ? f.color + '88' : '#1C2027'}`,
                      borderRadius: 13,
                      padding: '15px 16px',
                      cursor: 'pointer',
                      transition: 'border-color .12s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <span
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 8,
                          background: f.color + '22',
                          border: `1px solid ${f.color}55`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: SG,
                          fontWeight: 700,
                          fontSize: 11,
                          color: f.color,
                          flex: '0 0 auto',
                        }}
                      >
                        {initials(f.name)}
                      </span>
                      <span
                        style={{
                          flex: 1,
                          fontWeight: 600,
                          fontSize: 13.5,
                          minWidth: 0,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {f.name}
                      </span>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavFactory(f.id);
                        }}
                        style={{ color: '#F5A95B', fontSize: 15, cursor: 'pointer', flex: '0 0 auto' }}
                      >
                        ★
                      </span>
                      {editButton(f)}
                    </div>
                    <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 22, color: '#F5A95B' }}>
                      {fmt(agg.power)}
                      <span style={{ fontSize: 11, color: '#5E646E', fontWeight: 400 }}> MW</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 9 }}>
                      <span style={{ fontSize: 11, color: '#6B7280' }}>{agg.machines} machines</span>
                      <span
                        style={{
                          marginLeft: 'auto',
                          fontSize: 9.5,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 5,
                          color: sm.color,
                          background: '#15171D',
                          border: `1px solid ${sm.color}33`,
                        }}
                      >
                        {sm.label}
                      </span>
                    </div>
                    <div style={{ marginTop: 12, paddingTop: 9, borderTop: '1px solid #262B34' }}>
                      <SectionLabel color="#9097A1" mb={5}>Starred resources</SectionLabel>
                      {starred.map((item) => {
                        const rates = flows.filter((flow) => flow.item === item).map((flow) => (
                          (flow.dir === 'export' ? '↑ ' : '↓ ') + fmt(flow.total) + '/m'
                        ));
                        const produced = effective[item]?.out ?? 0;
                        const required = agg.per[item]?.in ?? 0;
                        const rate = rates.length
                          ? rates.join(' · ')
                          : produced > 0.001 ? '+' + fmt(produced) + '/m'
                            : required > 0.001 ? fmt(required) + '/m required' : '0/m';
                        return <ProducedRow key={item} name={item} rate={rate} />;
                      })}
                      {starred.length === 0 && (
                        <div style={{ fontSize: 11, color: '#9097A1' }}>No starred resources yet</div>
                      )}
                    </div>
                    {openProduction(f)}
                  </div>
                );
              })}
              {favorites.length === 0 && (
                <div
                  style={{
                    gridColumn: '1/-1',
                    border: '1px dashed #2A2F39',
                    borderRadius: 12,
                    padding: 20,
                    textAlign: 'center',
                    fontSize: 12,
                    color: '#6B7280',
                  }}
                >
                  ★ Star any factory below to pin it here.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11 }}>
              <span style={{ fontFamily: SG, fontWeight: 600, fontSize: 14 }}>All factories</span>
              <span style={{ fontSize: 11, color: '#5E646E' }}>{factories.length}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: '#6B7280' }}>
                Click a card for details
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(148px,1fr))', gap: 10 }}>
              {factories.map((f) => {
                const agg = aggregate(f);
                const sm = statusMeta(f.status);
                const fav = st.favFactories.includes(f.id);
                const isFocused = st.factoriesFocus === f.id;
                return (
                  <div
                    key={f.id}
                    tabIndex={0}
                    aria-label={`View details for ${f.name}`}
                    onClick={() => onCardClick(f)}
                    onKeyDown={(event) => {
                      if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                        event.preventDefault();
                        onCardClick(f);
                      }
                    }}
                    style={{
                      position: 'relative',
                      background: isFocused ? '#15181E' : '#0F1116',
                      border: `1px solid ${isFocused ? f.color + '88' : '#1C2027'}`,
                      borderRadius: 10,
                      padding: '10px 11px',
                      cursor: 'pointer',
                      transition: 'all .1s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          background: f.color + '22',
                          border: `1px solid ${f.color}55`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: SG,
                          fontWeight: 700,
                          fontSize: 9,
                          color: f.color,
                          flex: '0 0 auto',
                        }}
                      >
                        {initials(f.name)}
                      </span>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavFactory(f.id);
                        }}
                        style={{
                          marginLeft: 'auto',
                          color: fav ? '#F5A95B' : '#4B515B',
                          fontSize: 14,
                          cursor: 'pointer',
                          flex: '0 0 auto',
                        }}
                      >
                        {fav ? '★' : '☆'}
                      </span>
                      {editButton(f)}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: '#C2C8D2',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {f.name}
                    </div>
                    <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 14, color: '#F5A95B', margin: '3px 0 9px' }}>
                      {fmt(agg.power)}
                      <span style={{ fontSize: 9, color: '#5E646E', fontWeight: 400 }}> MW</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#9097A1' }}>{agg.machines} machines</div>
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 9.5,
                        fontWeight: 600,
                        color: sm.color,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {sm.label}
                    </div>
                    {openProduction(f)}
                  </div>
                );
              })}
              {factories.length === 0 && (
                <div
                  style={{
                    gridColumn: '1/-1',
                    border: '1px dashed #2A2F39',
                    borderRadius: 12,
                    padding: 28,
                    textAlign: 'center',
                    fontSize: 12,
                    color: '#6B7280',
                  }}
                >
                  No factories yet — create one from the Map.
                </div>
              )}
            </div>
          </div>
        ),
        right: (
          <aside
            data-m-hide=""
            style={{
              flex: 1,
              minHeight: 0,
              background: '#0B0C0F',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {focused ? (
              <FactoryDetailSidebar
                factory={focused}
                favorited={st.favFactories.includes(focused.id)}
                onToggleFav={() => toggleFavFactory(focused.id)}
                onOpen={() => openFactory(focused.id)}
                expandedFlow={st.expandedFlow}
                onToggleFlow={(k) => up((s) => ({ expandedFlow: { ...s.expandedFlow, [k]: !s.expandedFlow[k] } }))}
                openRoute={openRoute}
                openLocalInput={openLocalInput}
                removeLocalInput={removeLocalInput}
                removeRoute={removeRoute}
                reorderFlows={reorderFlows}
                openFactory={openFactory}
              />
            ) : (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  textAlign: 'center',
                  padding: 24,
                }}
              >
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 14,
                    border: '1.5px dashed #2E343F',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#5E646E',
                    fontSize: 22,
                  }}
                >
                  ▣
                </div>
                <div style={{ fontSize: 12.5, color: '#7B828D', maxWidth: 200 }}>
                  Select a factory to see its production and flows.
                </div>
              </div>
            )}
          </aside>
        ),
      }}
    />
  );
}

function FactoryDetailSidebar({
  factory: f,
  favorited,
  onToggleFav,
  onOpen,
  expandedFlow,
  onToggleFlow,
  openRoute,
  openLocalInput,
  removeLocalInput,
  removeRoute,
  reorderFlows,
  openFactory,
}: {
  factory: Factory;
  favorited: boolean;
  onToggleFav: () => void;
  onOpen: () => void;
  expandedFlow: Record<string, boolean>;
  onToggleFlow: (k: string) => void;
  openRoute: ReturnType<typeof useActions>['openRoute'];
  openLocalInput: ReturnType<typeof useActions>['openLocalInput'];
  removeLocalInput: ReturnType<typeof useActions>['removeLocalInput'];
  removeRoute: ReturnType<typeof useActions>['removeRoute'];
  reorderFlows: ReturnType<typeof useActions>['reorderFlows'];
  openFactory: (id: string) => void;
}) {
  const world = useWorld();
  const agg = aggregate(f);
  const sm = statusMeta(f.status);
  const produced = factoryOutputs(world, f);
  const flows = buildFlows(world, f);
  const imports = applyFlowOrder(
    flows.filter((fl) => fl.dir === 'import'),
    f.importOrder,
  );
  const exportFlows = applyFlowOrder(
    flows.filter((fl) => fl.dir === 'export'),
    f.exportOrder,
  );

  return (
    <>
      <div style={{ height: 3, background: f.color }}></div>
      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid #161A21' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: '50%',
              background: sm.color,
              boxShadow: `0 0 6px ${sm.color}`,
              flex: '0 0 auto',
            }}
          ></span>
          <span
            style={{
              fontFamily: SG,
              fontWeight: 600,
              fontSize: 16,
              flex: 1,
              minWidth: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {f.name}
          </span>
        </div>
        <div style={{ fontSize: 11, color: '#8A909A' }}>
          {sm.label} · {f.tier}
        </div>
      </div>
      <div style={{ display: 'flex', borderBottom: '1px solid #161A21' }}>
        <div style={{ flex: 1, padding: '10px 14px', borderRight: '1px solid #161A21' }}>
          <div style={{ fontSize: 9.5, letterSpacing: '.05em', textTransform: 'uppercase', color: '#5E646E' }}>
            Power
          </div>
          <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 15, color: '#F5A95B', marginTop: 2 }}>
            {fmt(agg.power)} MW
          </div>
        </div>
        <div style={{ flex: 1, padding: '10px 14px' }}>
          <div style={{ fontSize: 9.5, letterSpacing: '.05em', textTransform: 'uppercase', color: '#5E646E' }}>
            Machines
          </div>
          <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 15, color: '#E7E9ED', marginTop: 2 }}>
            {agg.machines}
          </div>
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
          {produced.length === 0 && (
            <div style={{ fontSize: 11, color: '#5E646E', fontStyle: 'italic' }}>Nothing produced yet — add a recipe.</div>
          )}
        </div>
        <SectionLabel color="#F5A95B" mb={8}>
          Imports <span style={{ color: '#5E646E' }}>{imports.length}</span>
          <span style={{ fontSize: 9 }}>↓ in</span>
        </SectionLabel>
        <div style={{ borderLeft: '2px solid #F5A95B33', paddingLeft: 10, marginBottom: 18 }}>
          <FlowList
            flows={imports}
            expandedFlow={expandedFlow}
            onToggle={onToggleFlow}
            emptyText="No imports yet."
            onLegClick={(leg) => {
              if (leg.localInputId) openLocalInput(f.id, undefined, leg.localInputId);
              else if (leg.routeId) openRoute(leg.routeId, { readOnly: true });
              else if (leg.stationId && leg.vehicleId) {
                const srcStation = world.stations?.find((s) => s.id === leg.stationId);
                if (srcStation) openFactory(srcStation.homeFactoryId);
              }
            }}
            onLegDelete={(leg) => {
              if (leg.localInputId) removeLocalInput(f.id, leg.localInputId);
            }}
            canDeleteLeg={(leg) => !!leg.localInputId}
            legActionLabel={(leg) => (leg.localInputId ? 'Edit' : 'View')}
            onReorder={(orderedItems) => reorderFlows(f.id, 'import', orderedItems)}
          />
        </div>
        <SectionLabel color="#5BCB86" mb={8}>
          Exports <span style={{ color: '#5E646E' }}>{exportFlows.length}</span>
          <span style={{ fontSize: 9 }}>↑ out</span>
        </SectionLabel>
        <div style={{ borderLeft: '2px solid #5BCB8633', paddingLeft: 10 }}>
          <FlowList
            flows={exportFlows}
            expandedFlow={expandedFlow}
            onToggle={onToggleFlow}
            emptyText="No exports yet."
            onLegClick={(leg) => {
              if (leg.routeId) openRoute(leg.routeId);
            }}
            onLegDelete={(leg) => {
              if (leg.routeId) removeRoute(leg.routeId);
            }}
            canDeleteLeg={(leg) => !!leg.routeId}
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
          />
        </div>
      </div>
      <div style={{ padding: '12px 14px', borderTop: '1px solid #161A21', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={onToggleFav}
          style={{
            width: '100%',
            background: '#13151A',
            border: '1px solid #2A2F39',
            color: '#E7E9ED',
            borderRadius: 8,
            padding: 9,
            fontWeight: 500,
            cursor: 'pointer',
            fontSize: 12.5,
          }}
        >
          {favorited ? '★ Favorited' : '☆ Add to favorites'}
        </button>
        <button
          onClick={onOpen}
          style={{
            width: '100%',
            background: '#F5882E',
            color: '#120A03',
            border: 'none',
            borderRadius: 8,
            padding: 9,
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 12.5,
          }}
        >
          Open factory →
        </button>
      </div>
    </>
  );
}
