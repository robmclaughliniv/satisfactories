import { recipeById } from '../data/gameData';
import { transportImportedByItem } from '../model/logistics';
import type { Factory, Row, Section, World } from '../types';

const EPS = 0.001;
export interface RowFeedState {
  sectionId: string;
  efficiency: number;
  inputs: { item: string; need: number; available: number }[];
  nameplateOutputs: { item: string; rate: number }[];
  effectiveOutputs: { item: string; rate: number }[];
}
export interface FactoryLineFeeds {
  byRowId: Record<string, RowFeedState>;
  sectionInbound: Record<string, Record<string, number>>;
  delivered: Record<string, number>;
  imports: Record<string, number>;
  converged: boolean;
}
export function lineName(row: Row): string { return row.name || recipeById(row.recipeId)?.name || 'Production line'; }
export function allLines(factory: Factory): Row[] { return factory.sections.flatMap(s => s.rows); }
export function nextLineName(factory: Factory, recipeId: string): string {
  const base = recipeById(recipeId)?.outputs[0]?.item || 'Production line';
  const names = new Set(allLines(factory).map(lineName));
  let index = 1;
  while (names.has(`${base} ${index}`)) index++;
  return `${base} ${index}`;
}
const key = (factoryId: string, rowId: string) => `${factoryId}:${rowId}`;

/** A shortage never rewrites requests or silently redistributes them.
 * An oversubscribed output/source is held until its explicit rates are adjusted. */
export function computeWorldLineFeeds(world: World): Record<string, FactoryLineFeeds> {
  const refs = world.factories.flatMap(factory => factory.sections.flatMap(section =>
    section.rows.map(row => ({ factory, section, row }))));
  let efficiencies: Record<string, number> = Object.fromEntries(refs.map(({factory,row}) => [key(factory.id,row.id), 0]));
  let result: Record<string, FactoryLineFeeds> = {};
  let previousDeliveries: Record<string, number> = {};
  for (let iteration = 0; iteration < 256; iteration++) {
    result = Object.fromEntries(world.factories.map(f => [f.id, {
      byRowId: {}, sectionInbound: {}, delivered: {}, imports: {}, converged: false,
    }]));
    const inbound: Record<string, Record<string, number>> = {};
    const add = (fid: string, rid: string, item: string, rate: number) => {
      const k = key(fid, rid); inbound[k] ??= {}; inbound[k][item] = (inbound[k][item] || 0) + rate;
    };
    refs.forEach(({factory,row}) => {
      const recipe = recipeById(row.recipeId);
      recipe?.outputs.forEach(output => {
        const allocations = (row.allocations ?? []).filter(a => a.item === output.item);
        const requested = allocations.reduce((sum,a) => sum+a.rate,0);
        const actual = output.rate * row.count * (efficiencies[key(factory.id,row.id)] || 0);
        allocations.forEach(a => {
          const targetRow = a.kind === 'line' ? allLines(factory).find(r => r.id === a.targetId) : undefined;
          const valid = a.kind === 'line'
            ? targetRow && targetRow.id !== row.id && recipeById(targetRow.recipeId)?.inputs.some(i => i.item === a.item)
            : a.kind === 'factory' && a.targetId !== factory.id && !!result[a.targetId];
          const delivered = valid && requested <= actual + EPS ? a.rate : 0;
          result[factory.id].delivered[a.id] = delivered;
          if (a.kind === 'line' && targetRow) add(factory.id, targetRow.id, a.item, delivered);
          if (a.kind === 'factory' && result[a.targetId]) {
            result[a.targetId].imports[a.item] = (result[a.targetId].imports[a.item] || 0) + delivered;
          }
        });
      });
    });
    world.factories.forEach(factory => {
      const rows = allLines(factory);
      const requestedLocal: Record<string, number> = {};
      const requestedImport: Record<string, number> = {};
      rows.forEach(row => (row.sources ?? []).forEach(source => {
        const item = source.kind === 'local' ? factory.localInputs.find(li => li.id === source.localInputId)?.item : source.item;
        if (!item || !recipeById(row.recipeId)?.inputs.some(i => i.item === item) || row.count <= 0) return;
        const pool = source.kind === 'local' ? requestedLocal : requestedImport;
        const id = source.kind === 'local' ? source.localInputId : source.item;
        pool[id] = (pool[id] || 0) + (source.rate ?? 0);
      }));
      rows.forEach(row => (row.sources ?? []).forEach(source => {
        const li = source.kind === 'local' ? factory.localInputs.find(i => i.id === source.localInputId) : undefined;
        const item = source.kind === 'local' ? li?.item : source.item;
        if (!item || !recipeById(row.recipeId)?.inputs.some(i => i.item === item) || row.count <= 0) return;
        const supply = source.kind === 'local' ? li?.rate || 0 : transportImportedByItem(world,factory,item) + (result[factory.id].imports[item] || 0);
        const requested = source.kind === 'local' ? requestedLocal[source.localInputId] : requestedImport[item];
        add(factory.id,row.id,item,requested <= supply + EPS ? source.rate ?? 0 : 0);
      }));
    });
    const next: Record<string, number> = {};
    let delta = 0;
    refs.forEach(({factory,section,row}) => {
      const rec = recipeById(row.recipeId);
      if (!rec) return;
      const inputs = rec.inputs.map(i => ({item:i.item, need:i.rate*row.count, available:inbound[key(factory.id,row.id)]?.[i.item] || 0}));
      const efficiency = Math.min(1, ...inputs.map(i => i.need > EPS ? i.available/i.need : 1));
      next[key(factory.id,row.id)] = efficiency;
      delta = Math.max(delta,Math.abs(efficiency-(efficiencies[key(factory.id,row.id)] || 0)));
      result[factory.id].byRowId[row.id] = {
        sectionId:section.id, efficiency, inputs,
        nameplateOutputs:rec.outputs.map(o => ({item:o.item,rate:o.rate*row.count})),
        effectiveOutputs:rec.outputs.map(o => ({item:o.item,rate:o.rate*row.count*efficiency})),
      };
      result[factory.id].sectionInbound[section.id] ??= {};
      inputs.forEach(i => {
        const totals = result[factory.id].sectionInbound[section.id];
        totals[i.item] = (totals[i.item] || 0)+i.available;
      });
    });
    const deliveries: Record<string, number> = Object.fromEntries(Object.entries(result).flatMap(([fid,r]) => Object.entries(r.delivered).map(([id,rate]) => [key(fid,id),rate])));
    Object.entries(deliveries).forEach(([id,value]) => { delta = Math.max(delta, Math.abs(value-(previousDeliveries[id] || 0))); });
    efficiencies = next; previousDeliveries = deliveries;
    if (delta < EPS) { Object.values(result).forEach(r => r.converged = true); break; }
  }
  return result;
}
export function computeFactoryLineFeeds(world: World, factory: Factory): FactoryLineFeeds {
  return computeWorldLineFeeds(world)[factory.id] ?? {byRowId:{},sectionInbound:{},delivered:{},imports:{},converged:true};
}
export function rowEfficiency(feeds: FactoryLineFeeds, rowId: string): number { return feeds.byRowId[rowId]?.efficiency ?? 0; }
export function effectiveOutputRate(feeds: FactoryLineFeeds, row: Row, item: string): number {
  return feeds.byRowId[row.id]?.effectiveOutputs.find(o => o.item === item)?.rate ?? 0;
}
export function outputRemaining(feeds: FactoryLineFeeds, row: Row, item: string, editingId?: string): number {
  return effectiveOutputRate(feeds,row,item) - (row.allocations ?? []).filter(a => a.item === item && a.id !== editingId).reduce((s,a) => s+a.rate,0);
}
export function sectionNeeds(section: Section): Record<string, number> {
  const needs: Record<string, number> = {};
  section.rows.forEach(r => recipeById(r.recipeId)?.inputs.forEach(i => {needs[i.item]=(needs[i.item] || 0)+i.rate*r.count;}));
  return needs;
}
export interface ItemBalance { item:string; need:number; inbound:number; deficit:number; }
export function sectionBalance(factory: Factory, sectionId: string, feeds: FactoryLineFeeds): ItemBalance[] {
  const totals: Record<string,ItemBalance> = {};
  factory.sections.find(s => s.id === sectionId)?.rows.forEach(r => feeds.byRowId[r.id]?.inputs.forEach(i => {
    totals[i.item] ??= {item:i.item,need:0,inbound:0,deficit:0};
    totals[i.item].need+=i.need;totals[i.item].inbound+=i.available;totals[i.item].deficit+=Math.max(0,i.need-i.available);
  }));
  return Object.values(totals);
}
export function sectionHasDeficit(f:Factory,id:string,feeds:FactoryLineFeeds) { return sectionBalance(f,id,feeds).some(i => i.deficit>EPS); }
export function sectionMaxDeficit(f:Factory,id:string,feeds:FactoryLineFeeds) { return Math.max(0,...sectionBalance(f,id,feeds).map(i => i.deficit)); }
export function sectionInboundFromFeeds(feeds:FactoryLineFeeds,id:string) { return feeds.sectionInbound[id] ?? {}; }
export interface InputSource {sectionId:string;sectionName:string;rowId:string;recipeName:string;rate:number;}
export function inputSourcesForSection(f:Factory,sectionId:string,item:string,feeds:FactoryLineFeeds):InputSource[] {
  const targets = new Set(f.sections.find(s => s.id === sectionId)?.rows.map(r => r.id));
  return f.sections.flatMap(s => s.rows.flatMap(r => (r.allocations ?? []).filter(a => a.kind==='line' && targets.has(a.targetId) && a.item===item).map(a => ({sectionId:s.id,sectionName:s.name,rowId:r.id,recipeName:lineName(r),rate:feeds.delivered[a.id] || 0}))));
}
export function rowDestinationShares(factory:Factory,row:Row,feeds:FactoryLineFeeds) {
  return (row.allocations ?? []).map(a => ({key:a.id,label:a.kind==='line' ? lineName(allLines(factory).find(r => r.id===a.targetId) ?? row) : 'Export',kind:a.kind==='line' ? 'section' as const : 'export' as const,outputs:[{item:a.item,rate:feeds.delivered[a.id] || 0}]}));
}
export function sectionFeedStatus(f:Factory,id:string) { return `${f.sections.find(s => s.id===id)?.rows.length || 0} lines`; }
export function rowFeedStatus(_f:Factory,row:Row) { return row.allocations?.length ? `${row.allocations.length} allocations` : 'Unassigned'; }
export function isExportDestinationSelected(row:Row) { return (row.allocations ?? []).some(a => a.kind==='factory'); }
