import type { World } from './schema';
import { transportFromStationType, vehicleHops } from './logistics';

export interface MapConnection {
  key: string;
  a: string;
  b: string;
  items: { item: string; rate: number; t: string; from: string; to: string }[];
}

/** Union of Belt/Pipe routes and derived vehicle hops for map rendering. */
export function buildMapConnections(world: World): MapConnection[] {
  const cm: Record<string, MapConnection> = {};

  world.routes.forEach((r) => {
    const key = [r.from, r.to].slice().sort().join('__');
    if (!cm[key]) cm[key] = { key, a: r.from, b: r.to, items: [] };
    cm[key].items.push({ item: r.item, rate: r.rate, t: r.t, from: r.from, to: r.to });
  });

  vehicleHops(world).forEach((hop) => {
    const key = [hop.fromFactoryId, hop.toFactoryId].slice().sort().join('__');
    if (!cm[key]) cm[key] = { key, a: hop.fromFactoryId, b: hop.toFactoryId, items: [] };
    cm[key].items.push({
      item: hop.item,
      rate: hop.rate,
      t: transportFromStationType(hop.type),
      from: hop.fromFactoryId,
      to: hop.toFactoryId,
    });
  });

  return Object.values(cm);
}

export function connectionCount(world: World): number {
  return buildMapConnections(world).length;
}
