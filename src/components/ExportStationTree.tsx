import { useState } from 'react';
import { fmt } from '../data/gameData';
import { exportStations, importStations, listDestinationStations, stationById, stationTypeLabel } from '../model/logistics';
import type { Factory, Station, World } from '../types';
import { MONO, TransportBadge } from './bits';

function destinationLabel(world: World, stationId: string | null): string {
  if (!stationId) return '— Unassigned —';
  const dest = stationById(world, stationId);
  if (!dest) return '— Unknown —';
  const fac = world.factories.find((f) => f.id === dest.homeFactoryId);
  return fac ? `${fac.name} · ${dest.name}` : dest.name;
}

function StationVehicleRows({
  station,
  world,
  expanded,
}: {
  station: Station;
  world: World;
  expanded: boolean;
}) {
  if (!expanded || station.role !== 'export') return null;
  const perRate = station.vehicles.length > 0 ? station.totalRate / station.vehicles.length : 0;
  return (
    <div style={{ paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4, marginBottom: 2 }}>
      {station.vehicles.map((vehicle) => (
        <div
          key={vehicle.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 6px',
            borderRadius: 5,
            background: '#0F1116',
            border: '1px solid #1A1E25',
          }}
        >
          <TransportBadge t={stationTypeLabel(vehicle.type)} />
          <span style={{ flex: 1, fontSize: 10.5, color: '#9097A1', minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {destinationLabel(world, vehicle.destinationStationId)}
          </span>
          <span style={{ fontFamily: MONO, fontSize: 10, color: '#5BCB86' }}>{fmt(vehicle.perVehicleRate || perRate)}/m</span>
        </div>
      ))}
      {station.vehicles.length === 0 && (
        <div style={{ fontSize: 10, color: '#5E646E', fontStyle: 'italic', padding: '2px 6px' }}>No vehicles — edit station to add.</div>
      )}
    </div>
  );
}

function StationHeader({
  station,
  expanded,
  onToggle,
  onEdit,
}: {
  station: Station;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const vehicleCount = station.vehicles.length;
  const destined = station.vehicles.filter((v) => v.destinationStationId).length;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '5px 6px',
        borderRadius: 6,
        background: expanded ? '#12151B' : 'transparent',
      }}
    >
      <div
        onClick={onToggle}
        style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0, cursor: 'pointer' }}
      >
        <span style={{ width: 11, textAlign: 'center', color: '#5E646E', fontSize: 9, flex: '0 0 auto' }}>{expanded ? '▾' : '▸'}</span>
        <TransportBadge t={stationTypeLabel(station.type)} />
        <span style={{ flex: 1, fontSize: 11.5, fontWeight: 500, color: '#C2C8D2', minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {station.name}
        </span>
        <span style={{ fontFamily: MONO, fontSize: 10.5, color: '#9097A1', flex: '0 0 auto' }}>
          {fmt(station.totalRate)}/m
          {station.role === 'export' && vehicleCount > 0 ? ` · ${destined}/${vehicleCount}` : ''}
        </span>
      </div>
      <button
        type="button"
        title="Edit station"
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        style={{
          width: 22,
          height: 22,
          flex: '0 0 auto',
          padding: 0,
          border: 'none',
          background: 'transparent',
          color: '#8A909A',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 4,
          fontSize: 12,
        }}
      >
        ✎
      </button>
    </div>
  );
}

export function ExportStationTree({
  world,
  factory,
  resourceId,
  onAddStation,
  onEditStation,
}: {
  world: World;
  factory: Factory;
  resourceId: string;
  onAddStation: () => void;
  onEditStation: (stationId: string) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const stations = exportStations(world, factory.id, resourceId);

  const toggleStation = (stationId: string) => {
    setExpanded((prev) => ({ ...prev, [stationId]: !prev[stationId] }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {stations.map((station) => (
        <div key={station.id}>
          <StationHeader
            station={station}
            expanded={!!expanded[station.id]}
            onToggle={() => toggleStation(station.id)}
            onEdit={() => onEditStation(station.id)}
          />
          <StationVehicleRows station={station} world={world} expanded={!!expanded[station.id]} />
        </div>
      ))}
      <button
        type="button"
        onClick={onAddStation}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'transparent',
          border: '1px dashed #2A2F39',
          color: '#8A909A',
          borderRadius: 6,
          padding: '5px 8px',
          fontSize: 10.5,
          cursor: 'pointer',
          marginTop: stations.length > 0 ? 2 : 0,
        }}
      >
        <span style={{ color: '#5BCB86', fontWeight: 600 }}>＋</span> Add station
      </button>
    </div>
  );
}

export function ImportStationTree({
  world,
  factory,
  resourceId,
  onAddStation,
  onEditStation,
}: {
  world: World;
  factory: Factory;
  resourceId: string;
  onAddStation: () => void;
  onEditStation: (stationId: string) => void;
}) {
  const stations = importStations(world, factory.id, resourceId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
      {stations.map((station) => {
        const inbound = (world.stations ?? []).filter(
          (s) => s.role === 'export' && s.vehicles.some((v) => v.destinationStationId === station.id),
        );
        const inboundRate = inbound.reduce((sum, src) => {
          return (
            sum +
            src.vehicles.filter((v) => v.destinationStationId === station.id).reduce((s, v) => s + v.perVehicleRate, 0)
          );
        }, 0);
        return (
          <div
            key={station.id}
            onClick={() => onEditStation(station.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '5px 6px',
              borderRadius: 6,
              cursor: 'pointer',
              background: '#0F1116',
              border: '1px solid #1A1E25',
            }}
          >
            <TransportBadge t={stationTypeLabel(station.type)} />
            <span style={{ flex: 1, fontSize: 11, color: '#AEB4BE', minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {station.name}
            </span>
            <span style={{ fontFamily: MONO, fontSize: 10, color: '#F5A95B' }}>{fmt(inboundRate)}/m in</span>
          </div>
        );
      })}
      <button
        type="button"
        onClick={onAddStation}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'transparent',
          border: '1px dashed #2A2F39',
          color: '#8A909A',
          borderRadius: 6,
          padding: '5px 8px',
          fontSize: 10.5,
          cursor: 'pointer',
        }}
      >
        <span style={{ color: '#F5A95B', fontWeight: 600 }}>＋</span> Add receiving station
      </button>
    </div>
  );
}

/** Destination options for modal draft (export stations only). */
export function destinationOptions(world: World, exportStation: Pick<Station, 'type' | 'resourceId' | 'homeFactoryId'>) {
  return listDestinationStations(world, exportStation as Station).map((dest) => {
    const fac = world.factories.find((f) => f.id === dest.homeFactoryId);
    return { id: dest.id, label: fac ? `${fac.name} · ${dest.name}` : dest.name };
  });
}
