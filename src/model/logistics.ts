import type { Factory, Station, StationRole, StationType, Vehicle, World } from './schema';
import { freshId } from './world';

const STATION_TRANSPORT_TYPES = new Set<StationType>(['train', 'truck', 'drone']);

export function isStationTransportType(t: string): t is StationType {
  return STATION_TRANSPORT_TYPES.has(t as StationType);
}

export function stationTypeLabel(type: StationType): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function transportFromStationType(type: StationType): 'Train' | 'Truck' | 'Drone' {
  return stationTypeLabel(type) as 'Train' | 'Truck' | 'Drone';
}

export function kebabCase(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function nextStationSeq(factory: Factory): number {
  factory.stationSeq = (factory.stationSeq ?? 0) + 1;
  return factory.stationSeq;
}

export function stationName(factory: Factory, resourceId: string, seq: number): string {
  return kebabCase(`${factory.name}-${resourceId}-${seq}`);
}

export function factoryStations(world: World, factoryId: string): Station[] {
  return (world.stations ?? []).filter((s) => s.homeFactoryId === factoryId);
}

export function exportStations(world: World, factoryId: string, resourceId?: string): Station[] {
  return factoryStations(world, factoryId).filter(
    (s) => s.role === 'export' && (resourceId === undefined || s.resourceId === resourceId),
  );
}

export function importStations(world: World, factoryId: string, resourceId?: string): Station[] {
  return factoryStations(world, factoryId).filter(
    (s) => s.role === 'import' && (resourceId === undefined || s.resourceId === resourceId),
  );
}

/** Receiving stations on other factories that match type + resource (explicit destinations). */
export function listDestinationStations(world: World, exportStation: Station): Station[] {
  return (world.stations ?? []).filter(
    (s) =>
      s.role === 'import' &&
      s.type === exportStation.type &&
      s.resourceId === exportStation.resourceId &&
      s.homeFactoryId !== exportStation.homeFactoryId,
  );
}

export function suggestStationName(factory: Factory, resourceId: string): string {
  const seq = (factory.stationSeq ?? 0) + 1;
  return stationName(factory, resourceId, seq);
}

export function findImportStation(
  world: World,
  factoryId: string,
  resourceId: string,
  type: StationType,
): Station | undefined {
  return (world.stations ?? []).find(
    (s) => s.homeFactoryId === factoryId && s.role === 'import' && s.resourceId === resourceId && s.type === type,
  );
}

export function stationById(world: World, id: string | null | undefined): Station | undefined {
  if (!id) return undefined;
  return (world.stations ?? []).find((s) => s.id === id);
}

export function recomputeVehicleRates(station: Station): void {
  const count = station.vehicles.length;
  const per = count > 0 ? station.totalRate / count : 0;
  station.vehicles.forEach((v) => {
    v.perVehicleRate = per;
  });
}

export function createStation(
  world: World,
  factory: Factory,
  opts: {
    name?: string;
    resourceId: string;
    type: StationType;
    role: StationRole;
    totalRate: number;
    vehicles?: Vehicle[];
  },
): Station {
  if (!world.stations) world.stations = [];
  const seq = nextStationSeq(factory);
  const station: Station = {
    id: freshId('st'),
    name: opts.name?.trim() || stationName(factory, opts.resourceId, seq),
    type: opts.type,
    homeFactoryId: factory.id,
    resourceId: opts.resourceId,
    role: opts.role,
    totalRate: opts.totalRate,
    vehicles: opts.vehicles ?? [],
  };
  recomputeVehicleRates(station);
  world.stations.push(station);
  return station;
}

export function createVehicle(type: StationType, destinationStationId: string | null = null): Vehicle {
  return {
    id: freshId('vh'),
    type,
    destinationStationId,
    perVehicleRate: 0,
  };
}

export function findOrCreateImportStation(
  world: World,
  destFactory: Factory,
  resourceId: string,
  type: StationType,
): Station {
  const existing = findImportStation(world, destFactory.id, resourceId, type);
  if (existing) return existing;
  return createStation(world, destFactory, {
    resourceId,
    type,
    role: 'import',
    totalRate: 0,
    vehicles: [],
  });
}

export interface VehicleHop {
  vehicleId: string;
  stationId: string;
  fromFactoryId: string;
  toFactoryId: string;
  item: string;
  rate: number;
  type: StationType;
}

/** Active vehicle links with a resolved destination station. */
export function vehicleHops(world: World): VehicleHop[] {
  const hops: VehicleHop[] = [];
  (world.stations ?? []).forEach((station) => {
    if (station.role !== 'export') return;
    station.vehicles.forEach((vehicle) => {
      if (!vehicle.destinationStationId) return;
      const dest = stationById(world, vehicle.destinationStationId);
      if (!dest || dest.role !== 'import') return;
      hops.push({
        vehicleId: vehicle.id,
        stationId: station.id,
        fromFactoryId: station.homeFactoryId,
        toFactoryId: dest.homeFactoryId,
        item: station.resourceId,
        rate: vehicle.perVehicleRate,
        type: station.type,
      });
    });
  });
  return hops;
}

/** Clear dangling destinations and recompute vehicle rates. Import stations are never auto-deleted. */
export function reconcileLogistics(world: World): void {
  const stations = world.stations ?? [];
  const stationIds = new Set(stations.map((s) => s.id));

  stations.forEach((station) => {
    if (station.role === 'export') {
      station.vehicles.forEach((vehicle) => {
        if (vehicle.destinationStationId && !stationIds.has(vehicle.destinationStationId)) {
          vehicle.destinationStationId = null;
        }
      });
      recomputeVehicleRates(station);
    }
  });
}

export function removeStation(world: World, stationId: string): void {
  const station = stationById(world, stationId);
  if (!station) return;

  world.stations = (world.stations ?? []).filter((s) => s.id !== stationId);

  (world.stations ?? []).forEach((s) => {
    if (s.role !== 'export') return;
    s.vehicles.forEach((v) => {
      if (v.destinationStationId === stationId) v.destinationStationId = null;
    });
    recomputeVehicleRates(s);
  });

  reconcileLogistics(world);
}

export function stationExportTotal(station: Station): number {
  if (station.role !== 'export') return 0;
  const withDest = station.vehicles.filter((v) => v.destinationStationId);
  if (withDest.length === 0) return 0;
  return withDest.reduce((sum, v) => sum + v.perVehicleRate, 0);
}

export function stationReservedTotal(station: Station): number {
  if (station.role !== 'export') return 0;
  if (station.vehicles.length === 0) return station.totalRate;
  return station.totalRate;
}
