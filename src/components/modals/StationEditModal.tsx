import { fmt } from '../../data/gameData';
import { stationTypeLabel } from '../../model/logistics';
import { exportRemainder } from '../../state/derive';
import { useActions, useStore } from '../../state/store';
import type { StationType } from '../../types';
import { destinationOptions } from '../ExportStationTree';
import { ItemSquare, MONO, SG } from '../bits';

const inputStyle = {
  width: '100%',
  background: '#0C0D11',
  border: '1px solid #2A2F39',
  borderRadius: 8,
  color: '#E7E9ED',
  padding: '9px 12px',
  fontSize: 12.5,
} as const;

const selectStyle = inputStyle;

const labelStyle = { fontSize: 11, color: '#8A909A', display: 'block', marginBottom: 6 } as const;

const STATION_TYPES: { value: StationType; label: string }[] = [
  { value: 'train', label: 'Train' },
  { value: 'truck', label: 'Truck' },
  { value: 'drone', label: 'Drone' },
];

export function StationEditModal() {
  const { st, up, world } = useStore();
  const {
    updateStationModal,
    addStationVehicleDraft,
    removeStationVehicleDraft,
    setStationVehicleDestinationDraft,
    saveStation,
    removeStation,
  } = useActions();
  const m = st.stationEditModal;
  if (!m || !world) return null;

  const factory = world.factories.find((f) => f.id === m.factoryId);
  if (!factory) return null;

  const close = () => up({ stationEditModal: null });
  const isCreate = !m.stationId;
  const isExport = m.role === 'export';
  const isImport = m.role === 'import';
  const typeLocked = !isCreate && m.vehicles.length > 0;

  const destOpts = isExport
    ? destinationOptions(world, {
        type: m.type,
        resourceId: m.resourceId,
        homeFactoryId: m.factoryId,
      })
    : [];

  const perVehicle =
    isExport && m.vehicles.length > 0
      ? Math.max(0, parseFloat(String(m.totalRate)) || 0) / m.vehicles.length
      : 0;

  const headroom = isExport ? Math.max(0, exportRemainder(world, factory, m.resourceId, true)) : 0;
  let maxRate = headroom;
  if (!isCreate && m.stationId) {
    const existing = world.stations?.find((s) => s.id === m.stationId);
    if (existing) maxRate += existing.totalRate;
  }
  const rateNum = Math.max(0, parseFloat(String(m.totalRate)) || 0);
  const overCap = isExport && rateNum > maxRate + 0.001;

  const title = isCreate
    ? isImport
      ? 'Add receiving station'
      : 'Add station'
    : 'Edit station';

  return (
    <div
      onClick={close}
      style={{ position: 'fixed', inset: 0, background: 'rgba(6,7,9,.72)', backdropFilter: 'blur(3px)', zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        data-m-modal=""
        style={{ width: 520, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#101218', border: '1px solid #262B34', borderRadius: 16, boxShadow: '0 30px 80px rgba(0,0,0,.6)' }}
      >
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #1C2027', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontFamily: SG, fontWeight: 600, fontSize: 16, flex: 1 }}>{title}</div>
          <span onClick={close} style={{ color: '#6B7280', cursor: 'pointer', fontSize: 20 }}>
            ×
          </span>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveStation();
          }}
        >
          <div style={{ padding: '20px 22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ItemSquare item={m.resourceId} size={30} radius={6} fontSize={9} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{m.resourceId}</div>
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                  {factory.name} · {isExport ? 'Export' : 'Receiving'} station
                </div>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Station name</label>
              <input
                value={m.name}
                onChange={(e) => updateStationModal({ name: e.target.value })}
                style={inputStyle}
                placeholder="e.g. north-iron-train-1"
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Type</label>
                <select
                  value={m.type}
                  disabled={typeLocked}
                  onChange={(e) => updateStationModal({ type: e.target.value as StationType })}
                  style={{ ...selectStyle, opacity: typeLocked ? 0.65 : 1 }}
                >
                  {STATION_TYPES.map((tp) => (
                    <option key={tp.value} value={tp.value}>
                      {tp.label}
                    </option>
                  ))}
                </select>
              </div>
              {isExport && (
                <div style={{ width: 140 }}>
                  <label style={labelStyle}>Rate /min</label>
                  <input
                    type="number"
                    min={0}
                    value={m.totalRate}
                    onChange={(e) => updateStationModal({ totalRate: e.target.value })}
                    style={{
                      ...inputStyle,
                      fontFamily: MONO,
                      border: `1px solid ${overCap ? '#E5604D' : '#2A2F39'}`,
                    }}
                  />
                </div>
              )}
            </div>

            {isExport && (
              <div style={{ fontSize: 11, color: overCap ? '#E5604D' : '#6B7280', lineHeight: 1.4 }}>
                Up to <span style={{ fontFamily: MONO, color: '#C2C8D2' }}>{fmt(maxRate)}/m</span> available for this resource.
                {overCap ? ' Rate will be clamped on save.' : null}
              </div>
            )}

            {isImport && (
              <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.45 }}>
                Receiving stations accept inbound vehicles from export stations of the same type and resource. Create this first, then select it as a vehicle destination on the source factory.
              </div>
            )}

            {isExport && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: '#5E646E' }}>Vehicles</span>
                  <span style={{ fontSize: 10, color: '#4B515B' }}>{m.vehicles.length}</span>
                  {m.vehicles.length > 0 && (
                    <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 10, color: '#6B7280' }}>
                      {fmt(perVehicle)}/m each
                    </span>
                  )}
                </div>
                <div style={{ border: '1px solid #1C2027', borderRadius: 8, overflow: 'hidden' }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 72px 24px',
                      gap: 8,
                      padding: '8px 10px',
                      fontSize: 9,
                      letterSpacing: '.05em',
                      textTransform: 'uppercase',
                      color: '#5E646E',
                      background: '#0F1116',
                      borderBottom: '1px solid #1A1E25',
                    }}
                  >
                    <span>Destination station</span>
                    <span style={{ textAlign: 'right' }}>Rate</span>
                    <span></span>
                  </div>
                  {m.vehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 72px 24px',
                        gap: 8,
                        padding: '8px 10px',
                        alignItems: 'center',
                        borderBottom: '1px solid #15181E',
                      }}
                    >
                      <select
                        value={vehicle.destinationStationId ?? ''}
                        onChange={(e) =>
                          setStationVehicleDestinationDraft(vehicle.id, e.target.value || null)
                        }
                        style={selectStyle}
                      >
                        <option value="">— Select station —</option>
                        {destOpts.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <span style={{ fontFamily: MONO, fontSize: 11, color: '#5BCB86', textAlign: 'right' }}>
                        {fmt(perVehicle)}/m
                      </span>
                      <button
                        type="button"
                        onClick={() => removeStationVehicleDraft(vehicle.id)}
                        style={{ background: 'transparent', border: 'none', color: '#E5604D', cursor: 'pointer', fontSize: 16, padding: 0 }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {m.vehicles.length === 0 && (
                    <div style={{ padding: 12, fontSize: 11, color: '#5E646E', fontStyle: 'italic' }}>
                      No vehicles yet.
                      {destOpts.length === 0
                        ? ' Add receiving stations on destination factories first.'
                        : ` ${destOpts.length} receiving station${destOpts.length === 1 ? '' : 's'} available.`}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={addStationVehicleDraft}
                  style={{
                    marginTop: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'transparent',
                    border: '1px dashed #2A2F39',
                    color: '#8A909A',
                    borderRadius: 6,
                    padding: '6px 10px',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ color: '#5BCB86', fontWeight: 600 }}>＋</span> Add {stationTypeLabel(m.type)}
                </button>
              </div>
            )}
          </div>
          <div style={{ padding: '16px 22px', borderTop: '1px solid #1C2027', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            {!isCreate && m.stationId && (
              <button
                type="button"
                onClick={() => removeStation(m.stationId!)}
                style={{ background: 'transparent', border: '1px solid #3A2020', color: '#E5604D', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontSize: 13, marginRight: 'auto' }}
              >
                Delete station
              </button>
            )}
            <button type="button" onClick={close} style={{ background: 'transparent', border: '1px solid #2A2F39', color: '#C2C8D2', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontSize: 13 }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={!m.name.trim()}
              style={{
                background: m.name.trim() ? '#F5882E' : '#181B21',
                color: m.name.trim() ? '#120A03' : '#5E646E',
                border: 'none',
                borderRadius: 8,
                padding: '9px 18px',
                fontWeight: 600,
                cursor: m.name.trim() ? 'pointer' : 'default',
                fontSize: 13,
              }}
            >
              {isCreate ? 'Create station' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
