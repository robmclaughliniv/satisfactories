import { aggregate, localInputByItem, rollupWorld } from './derive';
import { captureBaseline, isFactoryDirty, type ResourceMetricSnapshot, type World } from '@satisfactories/model';

/** Capture world-wide effective rates at an explicit factory commit, independent of UI filters. */
export function captureResourceMetrics(world: World, factoryId: string, savedAt = new Date().toISOString()): ResourceMetricSnapshot {
  const capacity: Record<string, number> = {};
  world.factories.forEach(factory => {
    Object.entries(aggregate(factory).per).forEach(([item, rates]) => {
      capacity[item] = (capacity[item] ?? 0) + rates.out;
    });
    Object.entries(localInputByItem(factory)).forEach(([item, rate]) => {
      capacity[item] = (capacity[item] ?? 0) + rate;
    });
  });
  return {
    factoryId,
    factoryName: world.factories.find(factory => factory.id === factoryId)?.name ?? factoryId,
    savedAt,
    values: Object.fromEntries(Object.entries(rollupWorld(world)).map(([item, rates]) => [item, {
      produced: rates.produced,
      consumed: rates.consumed,
      efficiency: capacity[item] > 0 ? rates.produced / capacity[item] : null,
    }])),
  };
}

/** Saving a draft adds exactly one immutable world metrics snapshot. Reset never rewrites history. */
export function commitFactoryWithMetrics(world: World, factoryId: string): void {
  const factory = world.factories.find(factory => factory.id === factoryId);
  if (!factory || !isFactoryDirty(factory, world.routes, world.stations)) return;
  factory.baseline = captureBaseline(factory, world.routes, world.stations);
  world.resourceMetricHistory.push(captureResourceMetrics(world, factoryId));
}
