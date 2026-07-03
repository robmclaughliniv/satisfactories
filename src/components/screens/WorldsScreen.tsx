import { initials } from '../../data/gameData';
import { useActions, useStore } from '../../state/store';
import { SG } from '../bits';

export function WorldsScreen() {
  const { st, up } = useStore();
  const { createWorld } = useActions();
  return (
    <div data-m-screen="" style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: 26 }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: SG, fontWeight: 700, fontSize: 22, margin: 0 }}>Worlds</h1>
            <div style={{ fontSize: 12.5, color: '#7B828D', marginTop: 3 }}>Each world is a Satisfactory save.</div>
          </div>
          <button
            onClick={createWorld}
            style={{ background: '#F5882E', color: '#120A03', border: 'none', borderRadius: 9, padding: '10px 16px', fontWeight: 600, cursor: 'pointer' }}
          >
            ＋ New world
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {st.worlds.map((w) => (
            <div
              key={w.id}
              onClick={() => up({ worldId: w.id, screen: 'map', selFactory: null })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                background: '#0F1116',
                border: `1px solid ${w.id === st.worldId ? '#2E343F' : '#1C2027'}`,
                borderRadius: 12,
                padding: '15px 17px',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 11,
                  background: 'linear-gradient(150deg,#1A1D24,#0F1116)',
                  border: '1px solid #262B34',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: SG,
                  fontWeight: 700,
                  fontSize: 18,
                  color: '#F5882E',
                }}
              >
                {initials(w.name)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ fontFamily: SG, fontWeight: 600, fontSize: 16 }}>{w.name}</span>
                  {w.id === st.worldId && (
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#5BCB86', border: '1px solid #1B3A28', background: '#0E1A12', borderRadius: 5, padding: '1px 7px' }}>
                      ACTIVE
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#7B828D', marginTop: 3 }}>
                  {w.factories.length ? `${w.factories.length} factories · ${w.routes.length} routes` : 'Empty — no factories yet'}
                </div>
              </div>
              <span style={{ color: '#4B515B', fontSize: 18 }}>›</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
