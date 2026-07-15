import { ITEMS, TRANSPORTS, defaultTransportForItem, fmt } from '../../data/gameData';
import { exportRemainder, itemExported, itemSupply } from '../../state/derive';
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

const disabledSelectStyle = {
  ...selectStyle,
  opacity: 0.65,
  cursor: 'not-allowed',
} as const;

const BELT_PIPE_TRANSPORTS = ['Belt', 'Pipe'] as const;

const labelStyle = { fontSize: 11, color: '#8A909A', display: 'block', marginBottom: 6 } as const;

export function RouteModal() {
  const { st, up, world, openFactory } = useStore();
  const { saveRoute, removeRoute } = useActions();
  const m = st.routeModal;
  if (!m || !world) return null;

  const upd = (patch: Partial<typeof m>) => {
    if (m.readOnly) return;
    up({ routeModal: { ...m, ...patch } });
  };
  const close = () => up({ routeModal: null });
  const editing = !!m.editingId;
  const readOnly = !!m.readOnly;
  const setItem = (item: string) => {
    const t = defaultTransportForItem(item);
    upd({ item, t: t === 'Pipe' ? 'Pipe' : 'Belt' });
  };

  const fromFac = world.factories.find((f) => f.id === m.from);
  const toFac = world.factories.find((f) => f.id === m.to);
  const supply = fromFac ? itemSupply(world, fromFac, m.item) : 0;
  let otherExports = fromFac ? itemExported(world, fromFac, m.item, true) : 0;
  if (editing && fromFac) {
    const existing = world.routes.find((x) => x.id === m.editingId);
    if (existing && existing.from === m.from && existing.item === m.item) otherExports -= existing.rate;
  }
  const maxRate = Math.max(0, supply - otherExports);
  const rateNum = Math.max(0, parseFloat(String(m.rate)) || 0);
  const overCap = !readOnly && rateNum > maxRate + 0.001;

  const goToSource = () => {
    if (!m.from) return;
    up({ routeModal: null });
    openFactory(m.from);
  };

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
          <div style={{ fontFamily: SG, fontWeight: 600, fontSize: 16, flex: 1 }}>
            {readOnly ? 'Incoming route' : editing ? 'Edit route' : 'Draw belt/pipe route'}
          </div>
          <span onClick={close} style={{ color: '#6B7280', cursor: 'pointer', fontSize: 20 }}>
            ×
          </span>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!readOnly) saveRoute();
          }}
        >
          <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {readOnly && fromFac && (
              <div
                style={{
                  background: '#0C0D11',
                  border: '1px solid #262B34',
                  borderRadius: 8,
                  padding: '10px 12px',
                  fontSize: 12,
                  color: '#AEB4BE',
                  lineHeight: 1.45,
                }}
              >
                This import is controlled by the source factory. Edit the export there.
                <button
                  type="button"
                  onClick={goToSource}
                  style={{
                    display: 'block',
                    marginTop: 8,
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    color: '#F5882E',
                    fontWeight: 600,
                    fontSize: 12.5,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  Open {fromFac.name} →
                </button>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>From</label>
                <select
                  value={m.from}
                  disabled={readOnly}
                  onChange={(e) => upd({ from: e.target.value })}
                  style={readOnly ? disabledSelectStyle : selectStyle}
                >
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
                <select
                  value={m.to}
                  disabled={readOnly}
                  onChange={(e) => upd({ to: e.target.value })}
                  style={readOnly ? disabledSelectStyle : selectStyle}
                >
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
                <select
                  value={m.item}
                  disabled={readOnly}
                  onChange={(e) => setItem(e.target.value)}
                  style={readOnly ? disabledSelectStyle : selectStyle}
                >
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
                  disabled={readOnly}
                  onChange={(e) => upd({ rate: e.target.value })}
                  style={{
                    width: '100%',
                    background: '#0C0D11',
                    border: `1px solid ${overCap ? '#E5604D' : '#2A2F39'}`,
                    borderRadius: 8,
                    color: '#E7E9ED',
                    padding: '9px 12px',
                    fontSize: 13,
                    fontFamily: MONO,
                    opacity: readOnly ? 0.65 : 1,
                    cursor: readOnly ? 'not-allowed' : undefined,
                  }}
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Transport</label>
              <select
                value={m.t}
                disabled={readOnly}
                onChange={(e) => upd({ t: e.target.value as Transport })}
                style={readOnly ? disabledSelectStyle : selectStyle}
              >
                {TRANSPORTS.filter((tp) => readOnly || BELT_PIPE_TRANSPORTS.includes(tp as (typeof BELT_PIPE_TRANSPORTS)[number])).map((tp) => (
                  <option key={tp} value={tp}>
                    {tp}
                  </option>
                ))}
              </select>
            </div>
            {!readOnly && fromFac && (
              <div style={{ fontSize: 11, color: overCap ? '#E5604D' : '#6B7280', lineHeight: 1.4 }}>
                {fromFac.name} can export up to <span style={{ fontFamily: MONO, color: '#C2C8D2' }}>{fmt(maxRate)}/m</span> more of{' '}
                {m.item}
                {toFac ? ` to ${toFac.name}` : ''} (supply {fmt(supply)}/m).
                {overCap ? ' Rate will be clamped on save.' : null}
              </div>
            )}
          </div>
          <div style={{ padding: '16px 22px', borderTop: '1px solid #1C2027', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            {editing && !readOnly && (
              <button
                type="button"
                onClick={() => removeRoute(m.editingId!)}
                style={{ background: 'transparent', border: '1px solid #3A2020', color: '#E5604D', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontSize: 13, marginRight: 'auto' }}
              >
                Delete
              </button>
            )}
            {readOnly ? (
              <>
                <button type="button" onClick={close} style={{ background: 'transparent', border: '1px solid #2A2F39', color: '#C2C8D2', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontSize: 13 }}>
                  Close
                </button>
                {fromFac && (
                  <button
                    type="button"
                    onClick={goToSource}
                    style={{ background: '#F5882E', color: '#120A03', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
                  >
                    Open source
                  </button>
                )}
              </>
            ) : (
              <>
                <button type="button" onClick={close} style={{ background: 'transparent', border: '1px solid #2A2F39', color: '#C2C8D2', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontSize: 13 }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#F5882E', color: '#120A03', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
                >
                  {editing ? 'Save' : 'Draw route'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
