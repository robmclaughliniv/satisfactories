import { recipeById } from '../data/gameData';
import type { Factory, World } from '../types';
import { allocationShipments, legacyRouteDelivery, exportStations, importedByItem, vehicleHops } from '../model/logistics';
import { computeFactoryLineFeeds, rowDestinationShares } from './lineFeeds';

export interface Aggregate {
  per: Record<string, { in: number; out: number }>;
  power: number;
  machines: number;
  outputs: { item: string; rate: number }[];
  inputs: { item: string; rate: number }[];
}

/** Sum local input rates by item for a factory. */
export function localInputByItem(factory: Factory): Record<string, number> {
  const byItem: Record<string, number> = {};
  (factory.localInputs || []).forEach((li) => {
    byItem[li.item] = (byItem[li.item] || 0) + li.rate;
  });
  return byItem;
}

export function aggregate(factory: Factory): Aggregate {
  const per: Aggregate['per'] = {};
  let power = 0;
  let machines = 0;
  (factory.sections || []).forEach((sec) =>
    sec.rows.forEach((row) => {
      const rec = recipeById(row.recipeId);
      if (!rec) return;
      machines += row.count;
      power += rec.power * row.count;
      rec.inputs.forEach((ip) => {
        per[ip.item] = per[ip.item] || { in: 0, out: 0 };
        per[ip.item].in += ip.rate * row.count;
      });
      rec.outputs.forEach((op) => {
        per[op.item] = per[op.item] || { in: 0, out: 0 };
        per[op.item].out += op.rate * row.count;
      });
    }),
  );
  const outputs: Aggregate['outputs'] = [];
  const inputs: Aggregate['inputs'] = [];
  Object.keys(per).forEach((item) => {
    const net = per[item].out - per[item].in;
    if (net > 0.001) outputs.push({ item, rate: net });
    else if (net < -0.001) inputs.push({ item, rate: -net });
  });
  outputs.sort((a, b) => b.rate - a.rate);
  inputs.sort((a, b) => b.rate - a.rate);
  return { per, power, machines, outputs, inputs };
}

/** Same as aggregate but inputs/outputs scaled by line-feed efficiency. Power/machines stay nameplate. */
export function aggregateEffective(world: World, factory: Factory): Aggregate {
  const feeds = computeFactoryLineFeeds(world, factory);
  const per: Aggregate['per'] = {};
  let power = 0;
  let machines = 0;
  (factory.sections || []).forEach((sec) =>
    sec.rows.forEach((row) => {
      const rec = recipeById(row.recipeId);
      if (!rec) return;
      const eff = feeds.byRowId[row.id]?.efficiency ?? 1;
      machines += row.count;
      power += rec.power * row.count;
      rec.inputs.forEach((ip) => {
        per[ip.item] = per[ip.item] || { in: 0, out: 0 };
        per[ip.item].in += ip.rate * row.count * eff;
      });
      rec.outputs.forEach((op) => {
        per[op.item] = per[op.item] || { in: 0, out: 0 };
        per[op.item].out += op.rate * row.count * eff;
      });
    }),
  );
  const outputs: Aggregate['outputs'] = [];
  const inputs: Aggregate['inputs'] = [];
  Object.keys(per).forEach((item) => {
    const net = per[item].out - per[item].in;
    if (net > 0.001) outputs.push({ item, rate: net });
    else if (net < -0.001) inputs.push({ item, rate: -net });
  });
  outputs.sort((a, b) => b.rate - a.rate);
  inputs.sort((a, b) => b.rate - a.rate);
  return { per, power, machines, outputs, inputs };
}

export { importedByItem };

/** Explicit export shares plus external supply not claimed by production rows. */
export function itemSupply(world: World, factory: Factory, item: string): number {
  const feeds = computeFactoryLineFeeds(world, factory);
  let made = 0;
  const reservedLocal: Record<string,number> = {};
  let reservedImport = 0;
  factory.sections.forEach(section => section.rows.forEach(row => {
    rowDestinationShares(factory, row, feeds).forEach(share => {
      if (share.kind === 'export') made += share.outputs.find(o => o.item === item)?.rate || 0;
    });
    if (!recipeById(row.recipeId)?.inputs.some(i => i.item === item) || row.count <= 0) return;
    row.sources.forEach(source => {
      if (source.kind === 'local') reservedLocal[source.localInputId] = (reservedLocal[source.localInputId] || 0) + (source.rate || 0);
      else if (source.item === item) reservedImport += source.rate || 0;
    });
  }));
  const local = factory.localInputs.filter(i => i.item === item).reduce((sum,i) => sum+Math.max(0,i.rate-(reservedLocal[i.id] || 0)),0);
  return made + local + Math.max(0,importedByItem(world,factory,item)-reservedImport);
}

/** Outbound route, vehicle hop, and station export total for an item. */
export function itemExported(world: World, factory: Factory, item: string): number {
  let exported = allocationShipments(world).filter(a => a.from === factory.id && a.item === item).reduce((sum,a) => sum+a.rate,0);
  world.routes.forEach(r => {
    if (r.from === factory.id && r.item === item) exported += legacyRouteDelivery(world,r.from,r.to,item,r.rate);
  });
  vehicleHops(world).forEach(h => {
    if (h.fromFactoryId === factory.id && h.item === item) exported += legacyRouteDelivery(world,h.fromFactoryId,h.toFactoryId,item,h.rate);
  });
  return exported;
}

export function exportRemainder(world: World, factory: Factory, item: string): number {
  return itemSupply(world, factory, item) - itemExported(world, factory, item);
}

export interface RollupEntry {
  produced: number;
  consumed: number;
  producers: { id: string; name: string; color: string; rate: number }[];
  consumers: { id: string; name: string; color: string; rate: number }[];
}

export function rollupWorld(world: World): Record<string, RollupEntry> {
  const per: Record<string, RollupEntry> = {};
  world.factories.forEach((f) => {
    const a = aggregateEffective(world, f);
    Object.keys(a.per).forEach((item) => {
      per[item] = per[item] || { produced: 0, consumed: 0, producers: [], consumers: [] };
      per[item].produced += a.per[item].out;
      per[item].consumed += a.per[item].in;
      if (a.per[item].out > 0.001) per[item].producers.push({ id: f.id, name: f.name, color: f.color, rate: a.per[item].out });
      if (a.per[item].in > 0.001) per[item].consumers.push({ id: f.id, name: f.name, color: f.color, rate: a.per[item].in });
    });
    Object.entries(localInputByItem(f)).forEach(([item, rate]) => {
      if (rate <= 0.001) return;
      per[item] = per[item] || { produced: 0, consumed: 0, producers: [], consumers: [] };
      per[item].produced += rate;
      per[item].producers.push({ id: f.id, name: f.name + ' (local)', color: f.color, rate });
    });
  });
  return per;
}

/** Items with export supply not already exported via stations/routes. */
export function exportableItems(world: World, factory: Factory): { item: string; headroom: number }[] {
  const eff = aggregateEffective(world, factory);
  const supplyItems = new Set<string>();
  Object.keys(eff.per).forEach((item) => {
    if (eff.per[item].out > 0.001) supplyItems.add(item);
  });
  (factory.localInputs || []).forEach((li) => supplyItems.add(li.item));
  world.routes.forEach((r) => {
    if (r.to === factory.id) supplyItems.add(r.item);
  });
  vehicleHops(world).forEach((hop) => {
    if (hop.toFactoryId === factory.id) supplyItems.add(hop.item);
  });

  const exportedItems = new Set<string>();
  world.routes.forEach((r) => {
    if (r.from === factory.id) exportedItems.add(r.item);
  });
  exportStations(world, factory.id).forEach((s) => exportedItems.add(s.resourceId));

  return [...supplyItems]
    .filter((item) => !exportedItems.has(item))
    .map((item) => ({ item, headroom: Math.max(0, exportRemainder(world, factory, item)) }))
    .filter((x) => x.headroom > 0.001)
    .sort((a, b) => b.headroom - a.headroom);
}
