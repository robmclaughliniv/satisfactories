import { recipeById } from '../data/gameData';
import type { Factory, World } from '../types';

export interface Aggregate {
  per: Record<string, { in: number; out: number }>;
  power: number;
  machines: number;
  outputs: { item: string; rate: number }[];
  inputs: { item: string; rate: number }[];
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

export interface RollupEntry {
  produced: number;
  consumed: number;
  producers: { id: string; name: string; color: string; rate: number }[];
  consumers: { id: string; name: string; color: string; rate: number }[];
}

export function rollupWorld(world: World): Record<string, RollupEntry> {
  const per: Record<string, RollupEntry> = {};
  world.factories.forEach((f) => {
    const a = aggregate(f);
    Object.keys(a.per).forEach((item) => {
      per[item] = per[item] || { produced: 0, consumed: 0, producers: [], consumers: [] };
      per[item].produced += a.per[item].out;
      per[item].consumed += a.per[item].in;
      if (a.per[item].out > 0.001) per[item].producers.push({ id: f.id, name: f.name, color: f.color, rate: a.per[item].out });
      if (a.per[item].in > 0.001) per[item].consumers.push({ id: f.id, name: f.name, color: f.color, rate: a.per[item].in });
    });
  });
  return per;
}
