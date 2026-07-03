import { recipeById } from '../data/gameData';
import type { Factory, World } from '../types';

export interface FlowLeg {
  partner: string;
  color: string;
  transport: string;
  rate: number;
  marked?: boolean;
}

export interface Flow {
  key: string;
  dir: 'import' | 'export';
  item: string;
  total: number;
  legs: FlowLeg[];
}

/**
 * Group the world's routes touching a factory into per-item import/export
 * flows. When `includeMarked` is set, rows checked "for export" contribute a
 * synthetic "Marked for export" leg (used on the factory detail screen).
 */
export function buildFlows(world: World, f: Factory, includeMarked: boolean): Flow[] {
  const facById: Record<string, Factory> = {};
  world.factories.forEach((x) => (facById[x.id] = x));
  const flowMap: Record<string, Flow> = {};
  world.routes.forEach((r) => {
    let dir: 'import' | 'export';
    let partner: Factory | undefined;
    if (r.to === f.id) {
      dir = 'import';
      partner = facById[r.from];
    } else if (r.from === f.id) {
      dir = 'export';
      partner = facById[r.to];
    } else return;
    if (!partner) return;
    const key = dir + '|' + r.item;
    if (!flowMap[key]) flowMap[key] = { key, dir, item: r.item, total: 0, legs: [] };
    flowMap[key].total += r.rate;
    flowMap[key].legs.push({ partner: partner.name, color: partner.color, transport: r.t || 'Belt', rate: r.rate });
  });
  if (includeMarked) {
    (f.sections || []).forEach((sec) =>
      sec.rows.forEach((row) => {
        if (!row.export) return;
        const rec = recipeById(row.recipeId);
        if (!rec || !rec.outputs.length) return;
        const prim = rec.outputs[0];
        const rate = prim.rate * row.count;
        const key = 'export|' + prim.item;
        if (!flowMap[key]) flowMap[key] = { key, dir: 'export', item: prim.item, total: 0, legs: [] };
        flowMap[key].total += rate;
        flowMap[key].legs.push({ partner: 'Marked for export', color: '#5BCB86', transport: 'Unset', rate, marked: true });
      }),
    );
  }
  return Object.keys(flowMap)
    .sort((a, b) => {
      const A = flowMap[a];
      const B = flowMap[b];
      if (A.dir !== B.dir) return A.dir === 'import' ? -1 : 1;
      return B.total - A.total;
    })
    .map((k) => flowMap[k]);
}
