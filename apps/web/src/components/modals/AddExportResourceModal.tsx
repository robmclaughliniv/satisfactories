import { fmt } from '../../data/gameData';
import { exportableItems } from '../../state/derive';
import { useActions, useStore } from '../../state/store';
import { ItemSquare, SG } from '../bits';

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

export function AddExportResourceModal() {
  const { st, up, world } = useStore();
  const { saveAddExportResource } = useActions();
  const m = st.addExportResourceModal;
  if (!m || !world) return null;

  const factory = world.factories.find((f) => f.id === m.factoryId);
  if (!factory) return null;

  const close = () => up({ addExportResourceModal: null });
  const upd = (patch: Partial<typeof m>) => up({ addExportResourceModal: { ...m, ...patch } });

  const options = exportableItems(world, factory).filter((o) => !(factory.exportOrder ?? []).includes(o.item));
  const selectableItems = options.length ? options.map((o) => o.item) : [m.item];

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
          <div style={{ fontFamily: SG, fontWeight: 600, fontSize: 16, flex: 1 }}>Add export resource</div>
          <span onClick={close} style={{ color: '#6B7280', cursor: 'pointer', fontSize: 20 }}>
            ×
          </span>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveAddExportResource();
          }}
        >
          <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Resource</label>
              <select value={m.item} onChange={(e) => upd({ item: e.target.value })} style={selectStyle}>
                {selectableItems.map((io) => (
                  <option key={io} value={io}>
                    {io}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ItemSquare item={m.item} size={28} radius={6} fontSize={9} />
              <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.45 }}>
                Adds {m.item} to exports. Open the resource row and use <strong style={{ color: '#C2C8D2', fontWeight: 500 }}>Add station</strong> to configure logistics.
              </div>
            </div>
          </div>
          <div style={{ padding: '16px 22px', borderTop: '1px solid #1C2027', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={close} style={{ background: 'transparent', border: '1px solid #2A2F39', color: '#C2C8D2', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontSize: 13 }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={selectableItems.length === 0}
              style={{
                background: selectableItems.length > 0 ? '#F5882E' : '#181B21',
                color: selectableItems.length > 0 ? '#120A03' : '#5E646E',
                border: 'none',
                borderRadius: 8,
                padding: '9px 18px',
                fontWeight: 600,
                cursor: selectableItems.length > 0 ? 'pointer' : 'default',
                fontSize: 13,
              }}
            >
              Add resource
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
