import { RECIPES } from '../data/gameData';
import { useActions, useStore } from '../state/store';
import { SG } from './bits';

const screenTitle: Record<string, string> = {
  map: 'Map',
  rollup: 'World Rollup',
  reference: 'Reference',
  worlds: 'Worlds',
  factory: 'Map',
};

export function Header() {
  const { st, up, world, factory, go } = useStore();
  const { openRoute } = useActions();

  const leaf = st.screen === 'factory' ? factory(st.selFactory)?.name ?? null : null;

  return (
    <header
      data-m-header=""
      style={{
        height: 52,
        flex: '0 0 52px',
        borderBottom: '1px solid #1E222B',
        background: '#0E0F13',
        display: 'flex',
        alignItems: 'center',
        padding: '0 18px',
        gap: 14,
        zIndex: 20,
      }}
    >
      <button
        onClick={() => up((s) => ({ worldMenuOpen: !s.worldMenuOpen }))}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          background: '#15171D',
          border: '1px solid #262B34',
          borderRadius: 8,
          padding: '6px 11px',
          cursor: 'pointer',
          color: '#E7E9ED',
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#F5882E', boxShadow: '0 0 7px #F5882E' }}></span>
        <span style={{ fontFamily: SG, fontWeight: 600, fontSize: 13 }}>{world.name}</span>
        <span style={{ color: '#6B7280', fontSize: 10 }}>▾</span>
      </button>
      {st.worldMenuOpen && (
        <div
          style={{
            position: 'absolute',
            top: 48,
            left: 18,
            width: 240,
            background: '#14161C',
            border: '1px solid #2A2F39',
            borderRadius: 10,
            padding: 6,
            boxShadow: '0 14px 40px rgba(0,0,0,.55)',
            zIndex: 50,
            animation: 'scFade .12s ease',
          }}
        >
          <div style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: '#6B7280', padding: '6px 8px 4px' }}>Worlds</div>
          {st.worlds.map((w) => (
            <div
              key={w.id}
              onClick={() => up({ worldId: w.id, worldMenuOpen: false, screen: 'map', selFactory: null })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: 8,
                borderRadius: 7,
                cursor: 'pointer',
                background: w.id === st.worldId ? '#1B1E25' : 'transparent',
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#F5882E' }}></span>
              <span style={{ flex: 1, fontWeight: 500 }}>{w.name}</span>
              <span style={{ color: '#6B7280', fontSize: 11 }}>{w.factories.length} factories</span>
            </div>
          ))}
          <div
            onClick={() => go('worlds')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: 8,
              marginTop: 4,
              borderTop: '1px solid #20242D',
              color: '#F5882E',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            ＋ Manage worlds
          </div>
        </div>
      )}
      <div style={{ width: 1, height: 20, background: '#262B34' }}></div>
      <div data-m-crumb="" style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, color: '#9AA0AA', fontSize: 12.5 }}>
        <span onClick={() => go(st.screen === 'factory' ? 'map' : st.screen)} style={{ cursor: 'pointer' }}>
          {screenTitle[st.screen] || 'Map'}
        </span>
        {leaf && (
          <>
            <span style={{ color: '#4B515B' }}>/</span>
            <span style={{ color: '#E7E9ED', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{leaf}</span>
          </>
        )}
      </div>
      <div style={{ flex: 1 }}></div>
      {st.screen === 'map' && (
        <button
          onClick={openRoute}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            background: '#15171D',
            border: '1px solid #262B34',
            borderRadius: 8,
            padding: '7px 12px',
            cursor: 'pointer',
            color: '#C2C8D2',
            fontSize: 12.5,
          }}
        >
          ⛓ Add route
        </button>
      )}
      {st.screen === 'reference' && <div style={{ fontSize: 12, color: '#6B7280' }}>{RECIPES.length} recipes</div>}
    </header>
  );
}
