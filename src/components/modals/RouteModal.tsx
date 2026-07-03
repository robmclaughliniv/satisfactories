import { ITEMS, TRANSPORTS } from '../../data/gameData';
import { useActions, useStore } from '../../state/store';
import type { Transport } from '../../types';
import { MONO, SG } from '../bits';

const selectStyle = {
  width: '100%',
  background: '#0C0D11',
  border: '1px solid #2A2F39',
  borderRadius: 8,
  color: '#E7E9ED',
  padding: '9px 10px',
  fontSize: 12.5,
} as const;

const labelStyle = { fontSize: 11, color: '#8A909A', display: 'block', marginBottom: 6 } as const;

export function RouteModal() {
  const { st, up, world } = useStore();
  const { saveRoute } = useActions();
  const m = st.routeModal;
  if (!m) return null;

  const upd = (patch: Partial<typeof m>) => up({ routeModal: { ...m, ...patch } });
  const close = () => up({ routeModal: null });

  return (
    <div
      onClick={close}
      style={{ position: 'fixed', inset: 0, background: 'rgba(6,7,9,.72)', backdropFilter: 'blur(3px)', zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        data-m-modal=""
        style={{ width: 460, background: '#101218', border: '1px solid #262B34', borderRadius: 16, boxShadow: '0 30px 80px rgba(0,0,0,.6)' }}
      >
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #1C2027', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontFamily: SG, fontWeight: 600, fontSize: 16, flex: 1 }}>Draw a route</div>
          <span onClick={close} style={{ color: '#6B7280', cursor: 'pointer', fontSize: 20 }}>
            ×
          </span>
        </div>
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>From</label>
              <select value={m.from} onChange={(e) => upd({ from: e.target.value })} style={selectStyle}>
                {world.factories.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <span style={{ color: '#F5882E', fontSize: 18, paddingBottom: 8 }}>→</span>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>To</label>
              <select value={m.to} onChange={(e) => upd({ to: e.target.value })} style={selectStyle}>
                {world.factories.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Item</label>
              <select value={m.item} onChange={(e) => upd({ item: e.target.value })} style={selectStyle}>
                {Object.keys(ITEMS).map((io) => (
                  <option key={io} value={io}>
                    {io}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ width: 130 }}>
              <label style={labelStyle}>Rate /min</label>
              <input
                type="number"
                value={m.rate}
                onChange={(e) => upd({ rate: e.target.value })}
                style={{ width: '100%', background: '#0C0D11', border: '1px solid #2A2F39', borderRadius: 8, color: '#E7E9ED', padding: '9px 12px', fontSize: 13, fontFamily: MONO }}
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Transport</label>
            <select value={m.t} onChange={(e) => upd({ t: e.target.value as Transport })} style={selectStyle}>
              {TRANSPORTS.map((tp) => (
                <option key={tp} value={tp}>
                  {tp}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ padding: '16px 22px', borderTop: '1px solid #1C2027', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={close} style={{ background: 'transparent', border: '1px solid #2A2F39', color: '#C2C8D2', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontSize: 13 }}>
            Cancel
          </button>
          <button
            onClick={saveRoute}
            style={{ background: '#F5882E', color: '#120A03', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
          >
            Draw route
          </button>
        </div>
      </div>
    </div>
  );
}
