import {
  transportImportedByItem,
  type Factory,
  type MapConnectionShipment,
  type World,
} from '@satisfactories/model';
import { computeFactoryLineFeeds, computeWorldLineFeeds } from '../state/lineFeeds';

export interface AllocationShipment extends MapConnectionShipment {
  allocationId: string;
  rowId: string;
  requested: number;
}

export function importedByItem(world: World, factory: Factory, item: string): number {
  return transportImportedByItem(world, factory, item) + (computeFactoryLineFeeds(world, factory).imports[item] || 0);
}

export function allocationShipments(world: World): AllocationShipment[] {
  const feeds = computeWorldLineFeeds(world);
  return world.factories.flatMap((f) =>
    f.sections.flatMap((s) =>
      s.rows.flatMap((row) =>
        (row.allocations || [])
          .filter((a) => a.kind === 'factory' && world.factories.some((target) => target.id === a.targetId))
          .map((a) => ({
            allocationId: a.id,
            rowId: row.id,
            from: f.id,
            to: a.targetId,
            item: a.item,
            rate: feeds[f.id]?.delivered[a.id] || 0,
            requested: a.rate,
            t: a.transport || 'Unset',
          })),
      ),
    ),
  );
}