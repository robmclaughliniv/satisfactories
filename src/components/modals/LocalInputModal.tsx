import { ITEMS, TRANSPORTS, defaultTransportForItem } from '../../data/gameData';
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

export function LocalInputModal() {
  const { st, up } = useStore();
  const { saveLocalInput, removeLocalInput } = useActions();
  const m = st.localInputModal;
  if (!m) return null;

  const upd = (patch: Partial<typeof m>) => up({ localInputModal: { ...m, ...patch } });
  const close = () => up({ localInputModal: null });
  const editing = !!m.editingId;
  const setItem = (item: string) => upd({ item, t: defaultTransportForItem(item) });

  return (
    <div
      onClick={close}
      style={{ position: 'fixed', inset: 0, background: 'rgba(6,7,9,.72)', backdropFilter: 'blur(3px)', zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        data-m-modal=""
        style={{ width: 420, background: '#101218', border: '1px solid #262B34', borderRadius: 16, boxShadow: '0 30px 80px rgba(0,0,0,.6)' }}
      >
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #1C2027', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontFamily: SG, fontWeight: 600, fontSize: 16, flex: 1 }}>{editing ? 'Edit local input' : 'Add local input'}</div>
          <span onClick={close} style={{ color: '#6B7280', cursor: 'pointer', fontSize: 20 }}>
            ×
          </span>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveLocalInput();
          }}
        >
          <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 11.5, color: '#6B7280', lineHeight: 1.45 }}>
              On-site supply belted in from local resource nodes or nearby production.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Item</label>
                <select value={m.item} onChange={(e) => setItem(e.target.value)} style={selectStyle}>
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
            {editing && (
              <button
                type="button"
                onClick={() => removeLocalInput(m.factoryId, m.editingId!)}
                style={{ background: 'transparent', border: '1px solid #3A2020', color: '#E5604D', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontSize: 13, marginRight: 'auto' }}
              >
                Delete
              </button>
            )}
            <button type="button" onClick={close} style={{ background: 'transparent', border: '1px solid #2A2F39', color: '#C2C8D2', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontSize: 13 }}>
              Cancel
            </button>
            <button
              type="submit"
              style={{ background: '#F5882E', color: '#120A03', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
            >
              {editing ? 'Save' : 'Add input'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
