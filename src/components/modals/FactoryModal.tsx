import { COLORS, TYPES } from '../../data/gameData';
import { useActions, useStore } from '../../state/store';
import type { Status } from '../../types';
import { SG } from '../bits';

const inputStyle = {
  width: '100%',
  background: '#0C0D11',
  border: '1px solid #2A2F39',
  borderRadius: 8,
  color: '#E7E9ED',
  padding: '9px 12px',
  fontSize: 13,
} as const;

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

export function FactoryModal() {
  const { st, up } = useStore();
  const { saveFactory } = useActions();
  const m = st.factoryModal;
  if (!m) return null;

  const upd = (patch: Partial<typeof m>) => up({ factoryModal: { ...m, ...patch } });
  const close = () => up({ factoryModal: null });

  return (
    <div
      onClick={close}
      style={{ position: 'fixed', inset: 0, background: 'rgba(6,7,9,.72)', backdropFilter: 'blur(3px)', zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        data-m-modal=""
        style={{ width: 540, maxHeight: '86vh', overflowY: 'auto', background: '#101218', border: '1px solid #262B34', borderRadius: 16, boxShadow: '0 30px 80px rgba(0,0,0,.6)' }}
      >
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #1C2027', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontFamily: SG, fontWeight: 600, fontSize: 16, flex: 1 }}>{m.editing ? 'Edit factory' : 'New factory'}</div>
          <span onClick={close} style={{ color: '#6B7280', cursor: 'pointer', fontSize: 20 }}>
            ×
          </span>
        </div>
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 15 }}>
          <div>
            <label style={labelStyle}>Factory name</label>
            <input value={m.name} onChange={(e) => upd({ name: e.target.value })} placeholder="e.g. Helios Smelting Complex" style={inputStyle} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Theme color</label>
              <div style={{ display: 'flex', gap: 7 }}>
                {COLORS.map((c) => (
                  <span
                    key={c}
                    onClick={() => upd({ color: c })}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: c,
                      cursor: 'pointer',
                      border: `2px solid ${m.color === c ? '#fff' : 'transparent'}`,
                      boxShadow: `0 0 0 1px ${m.color === c ? c : 'transparent'}`,
                    }}
                  ></span>
                ))}
              </div>
            </div>
            <div style={{ width: 160 }}>
              <label style={labelStyle}>Status</label>
              <select value={m.status} onChange={(e) => upd({ status: e.target.value as Status })} style={selectStyle}>
                <option value="planned">Planned</option>
                <option value="construction">Under Construction</option>
                <option value="operational">Operational</option>
                <option value="decommissioned">Decommissioned</option>
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Purpose tagline</label>
            <input value={m.tagline} onChange={(e) => upd({ tagline: e.target.value })} placeholder="What does this factory do?" style={inputStyle} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Type</label>
              <select value={m.tier} onChange={(e) => upd({ tier: e.target.value })} style={selectStyle}>
                {TYPES.map((ty) => (
                  <option key={ty} value={ty}>
                    {ty}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Tags (comma separated)</label>
              <input value={m.tags} onChange={(e) => upd({ tags: e.target.value })} placeholder="Steel, Heavy" style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>
              Cover image URL <span style={{ color: '#5E646E' }}>(optional)</span>
            </label>
            <input value={m.cover} onChange={(e) => upd({ cover: e.target.value })} placeholder="https://…" style={inputStyle} />
          </div>
          <div style={{ fontSize: 11.5, color: '#6B7280', background: '#0C0D11', border: '1px solid #1C2027', borderRadius: 8, padding: '9px 11px' }}>
            📍 Drops at map center — drag to reposition after placing.
          </div>
        </div>
        <div style={{ padding: '16px 22px', borderTop: '1px solid #1C2027', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={close} style={{ background: 'transparent', border: '1px solid #2A2F39', color: '#C2C8D2', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontSize: 13 }}>
            Cancel
          </button>
          <button
            onClick={saveFactory}
            style={{ background: '#F5882E', color: '#120A03', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
          >
            {m.editing ? 'Save changes' : 'Place factory'}
          </button>
        </div>
      </div>
    </div>
  );
}
