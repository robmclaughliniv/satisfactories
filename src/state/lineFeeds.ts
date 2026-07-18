import { recipeById } from '../data/gameData';
import { importedByItem } from '../model/logistics';
import type { Factory, Row, RowDestination, RowSource, Section, World } from '../types';

const EPS = 0.001;
const MAX_ITER = 32;

interface RowRef {
  sectionId: string;
  row: Row;
}

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
}

function collectRows(factory: Factory): RowRef[] {
  const refs: RowRef[] = [];
  factory.sections.forEach((sec) => {
    sec.rows.forEach((row) => refs.push({ sectionId: sec.id, row }));
  });
  return refs;
}

/** Empty destinations resolve to export-only. */
export function resolveRowDestinations(row: Row): RowDestination[] {
  const destinations = row.destinations ?? [];
  if (destinations.length === 0) return [{ kind: 'export' }];
  return destinations;
}

function buildInboundBySection(factory: Factory, eff: Record<string, number>): Record<string, Record<string, number>> {
  const inboundBySection: Record<string, Record<string, number>> = {};
  factory.sections.forEach((sec) => {
    sec.rows.forEach((row) => {
      const rec = recipeById(row.recipeId);
      if (!rec) return;
      const rowEff = eff[row.id] ?? 1;
      const dests = resolveRowDestinations(row);
      const share = dests.length;
      dests.forEach((dest) => {
        if (dest.kind !== 'section') return;
        const targetSecId = dest.sectionId;
        if (!inboundBySection[targetSecId]) inboundBySection[targetSecId] = {};
        rec.outputs.forEach((op) => {
          const rate = (op.rate * row.count * rowEff) / share;
          inboundBySection[targetSecId][op.item] = (inboundBySection[targetSecId][op.item] || 0) + rate;
        });
      });
    });
  });
  return inboundBySection;
}

function countClaimants(rows: RowRef[]): {
  localClaimants: Record<string, string[]>;
  importClaimants: Record<string, string[]>;
} {
  const localClaimants: Record<string, string[]> = {};
  const importClaimants: Record<string, string[]> = {};
  rows.forEach(({ row }) => {
    (row.sources ?? []).forEach((src) => {
      if (src.kind === 'local') {
        if (!localClaimants[src.localInputId]) localClaimants[src.localInputId] = [];
        localClaimants[src.localInputId].push(row.id);
      } else if (src.kind === 'import') {
        if (!importClaimants[src.item]) importClaimants[src.item] = [];
        importClaimants[src.item].push(row.id);
      }
    });
  });
  return { localClaimants, importClaimants };
}

function availableForRowInput(
  world: World,
  factory: Factory,
  sectionId: string,
  sectionNeedByItem: Record<string, number>,
  inboundBySection: Record<string, Record<string, number>>,
  row: Row,
  item: string,
  rowNeed: number,
  localClaimants: Record<string, string[]>,
  importClaimants: Record<string, string[]>,
): number {
  let available = 0;
  const sectionNeed = sectionNeedByItem[item] || 0;
  if (sectionNeed > EPS && rowNeed > EPS) {
    available += ((inboundBySection[sectionId]?.[item] || 0) * rowNeed) / sectionNeed;
  }
  (row.sources ?? []).forEach((src) => {
    if (src.kind === 'local') {
      const li = (factory.localInputs || []).find((x) => x.id === src.localInputId);
      if (li && li.item === item) {
        const claimants = localClaimants[src.localInputId]?.length || 1;
        available += li.rate / claimants;
      }
    }
  });
  if ((row.sources ?? []).some((s) => s.kind === 'import' && s.item === item)) {
    const claimants = importClaimants[item]?.length || 1;
    available += importedByItem(world, factory, item) / claimants;
  }
  return available;
}

/** Iterate to fixed point: row output scales with input availability (cascading). */
export function computeFactoryLineFeeds(world: World, factory: Factory): FactoryLineFeeds {
  const rows = collectRows(factory);
  const eff: Record<string, number> = {};
  rows.forEach(({ row }) => {
    eff[row.id] = 1;
  });

  const sectionNeedCache: Record<string, Record<string, number>> = {};
  factory.sections.forEach((sec) => {
    sectionNeedCache[sec.id] = sectionNeeds(sec);
  });

  for (let iter = 0; iter < MAX_ITER; iter++) {
    const inboundBySection = buildInboundBySection(factory, eff);
    const { localClaimants, importClaimants } = countClaimants(rows);
    let maxDelta = 0;

    rows.forEach(({ sectionId, row }) => {
      const rec = recipeById(row.recipeId);
      if (!rec) return;

      if (rec.inputs.length === 0) {
        const old = eff[row.id] ?? 1;
        maxDelta = Math.max(maxDelta, Math.abs(old - 1));
        eff[row.id] = 1;
        return;
      }

      let minRatio = 1;
      rec.inputs.forEach((ip) => {
        const need = ip.rate * row.count;
        if (need <= EPS) return;
        const available = availableForRowInput(
          world,
          factory,
          sectionId,
          sectionNeedCache[sectionId]!,
          inboundBySection,
          row,
          ip.item,
          need,
          localClaimants,
          importClaimants,
        );
        minRatio = Math.min(minRatio, Math.min(1, available / need));
      });

      const old = eff[row.id] ?? 1;
      maxDelta = Math.max(maxDelta, Math.abs(old - minRatio));
      eff[row.id] = minRatio;
    });

    if (maxDelta < EPS) break;
  }

  const sectionInbound = buildInboundBySection(factory, eff);
  const byRowId: Record<string, RowFeedState> = {};
  const { localClaimants, importClaimants } = countClaimants(rows);
  const finalInbound = buildInboundBySection(factory, eff);

  rows.forEach(({ sectionId, row }) => {
    const rec = recipeById(row.recipeId);
    if (!rec) return;
    const efficiency = eff[row.id] ?? 1;
    const inputs = rec.inputs.map((ip) => {
      const need = ip.rate * row.count;
      const available = availableForRowInput(
        world,
        factory,
        sectionId,
        sectionNeedCache[sectionId]!,
        finalInbound,
        row,
        ip.item,
        need,
        localClaimants,
        importClaimants,
      );
      return { item: ip.item, need, available };
    });
    const nameplateOutputs = rec.outputs.map((op) => ({ item: op.item, rate: op.rate * row.count }));
    const effectiveOutputs = rec.outputs.map((op) => ({
      item: op.item,
      rate: op.rate * row.count * efficiency,
    }));
    byRowId[row.id] = { sectionId, efficiency, inputs, nameplateOutputs, effectiveOutputs };
  });

  return { byRowId, sectionInbound };
}

export function rowEfficiency(feeds: FactoryLineFeeds, rowId: string): number {
  return feeds.byRowId[rowId]?.efficiency ?? 1;
}

export function effectiveOutputRate(feeds: FactoryLineFeeds, row: Row, item: string): number {
  const state = feeds.byRowId[row.id];
  if (!state) {
    const rec = recipeById(row.recipeId);
    const op = rec?.outputs.find((o) => o.item === item);
    return op ? op.rate * row.count : 0;
  }
  return state.effectiveOutputs.find((o) => o.item === item)?.rate ?? 0;
}

export function sectionNeeds(section: Section): Record<string, number> {
  const needs: Record<string, number> = {};
  section.rows.forEach((row) => {
    const rec = recipeById(row.recipeId);
    if (!rec) return;
    rec.inputs.forEach((ip) => {
      needs[ip.item] = (needs[ip.item] || 0) + ip.rate * row.count;
    });
  });
  return needs;
}

export function sectionInboundFromFeeds(feeds: FactoryLineFeeds, sectionId: string): Record<string, number> {
  return feeds.sectionInbound[sectionId] ?? {};
}

export interface ItemBalance {
  item: string;
  need: number;
  inbound: number;
  deficit: number;
}

export function sectionBalance(factory: Factory, sectionId: string, feeds: FactoryLineFeeds): ItemBalance[] {
  const section = factory.sections.find((s) => s.id === sectionId);
  if (!section) return [];
  const needs = sectionNeeds(section);
  const inbound = sectionInboundFromFeeds(feeds, sectionId);
  const items = new Set([...Object.keys(needs), ...Object.keys(inbound)]);
  const result: ItemBalance[] = [];
  items.forEach((item) => {
    const need = needs[item] || 0;
    const inb = inbound[item] || 0;
    const deficit = Math.max(0, need - inb);
    if (need > EPS || inb > EPS || deficit > EPS) {
      result.push({ item, need, inbound: inb, deficit });
    }
  });
  result.sort((a, b) => b.deficit - a.deficit || b.need - a.need);
  return result;
}

export function sectionHasDeficit(factory: Factory, sectionId: string, feeds: FactoryLineFeeds): boolean {
  return sectionBalance(factory, sectionId, feeds).some((b) => b.deficit > EPS);
}

export function sectionMaxDeficit(factory: Factory, sectionId: string, feeds: FactoryLineFeeds): number {
  return Math.max(0, ...sectionBalance(factory, sectionId, feeds).map((b) => b.deficit), 0);
}

export interface InputSource {
  sectionId: string;
  sectionName: string;
  rowId: string;
  recipeName: string;
  rate: number;
}

export function inputSourcesForSection(
  factory: Factory,
  sectionId: string,
  item: string,
  feeds: FactoryLineFeeds,
): InputSource[] {
  const sources: InputSource[] = [];
  factory.sections.forEach((sec) => {
    sec.rows.forEach((row) => {
      const rec = recipeById(row.recipeId);
      if (!rec) return;
      const dests = resolveRowDestinations(row);
      const targetsSection = dests.some((d) => d.kind === 'section' && d.sectionId === sectionId);
      if (!targetsSection) return;
      const produces = rec.outputs.find((op) => op.item === item);
      if (!produces) return;
      const totalEff = feeds.byRowId[row.id]?.efficiency ?? 1;
      const share = dests.length;
      sources.push({
        sectionId: sec.id,
        sectionName: sec.name,
        rowId: row.id,
        recipeName: rec.name,
        rate: (produces.rate * row.count * totalEff) / share,
      });
    });
  });
  return sources;
}

export interface DestShare {
  key: string;
  label: string;
  kind: 'section' | 'export';
  sectionId?: string;
  outputs: { item: string; rate: number }[];
}

export function rowDestinationShares(factory: Factory, row: Row, feeds: FactoryLineFeeds): DestShare[] {
  const rec = recipeById(row.recipeId);
  if (!rec) return [];
  const dests = resolveRowDestinations(row);
  const share = dests.length;
  const efficiency = feeds.byRowId[row.id]?.efficiency ?? 1;
  return dests.map((dest) => {
    const outputs = rec.outputs.map((op) => ({
      item: op.item,
      rate: (op.rate * row.count * efficiency) / share,
    }));
    if (dest.kind === 'export') {
      return { key: 'export', label: 'Export', kind: 'export' as const, outputs };
    }
    const sec = factory.sections.find((s) => s.id === dest.sectionId);
    return {
      key: dest.sectionId,
      label: sec?.name ?? 'Unknown',
      kind: 'section' as const,
      sectionId: dest.sectionId,
      outputs,
    };
  });
}

export function sectionFeedStatus(factory: Factory, sectionId: string): string {
  const section = factory.sections.find((s) => s.id === sectionId);
  if (!section || section.rows.length === 0) return '';

  const destKeys = new Set<string>();
  section.rows.forEach((row) => {
    resolveRowDestinations(row).forEach((d) => {
      destKeys.add(d.kind === 'export' ? 'export' : d.sectionId);
    });
  });

  if (destKeys.size === 1) {
    const key = [...destKeys][0]!;
    if (key === 'export') return 'Exported';
    const target = factory.sections.find((s) => s.id === key);
    return target ? `→ ${target.name}` : '→ ?';
  }
  return `${destKeys.size} destinations`;
}

export function rowFeedStatus(factory: Factory, row: Row): string {
  const dests = resolveRowDestinations(row);
  if (dests.length === 1) {
    const d = dests[0]!;
    if (d.kind === 'export') return 'Export';
    const sec = factory.sections.find((s) => s.id === d.sectionId);
    return sec ? `→ ${sec.name}` : '→ ?';
  }
  return `${dests.length} destinations`;
}

export function normalizeDestinations(destinations: RowDestination[], ownSectionId: string): RowDestination[] {
  const seen = new Set<string>();
  const result: RowDestination[] = [];
  let hasExport = false;
  for (const d of destinations) {
    if (d.kind === 'export') {
      if (!hasExport) {
        result.push({ kind: 'export' });
        hasExport = true;
      }
    } else if (d.sectionId !== ownSectionId && !seen.has(d.sectionId)) {
      seen.add(d.sectionId);
      result.push({ kind: 'section', sectionId: d.sectionId });
    }
  }
  return result;
}

export function isExportDestinationSelected(row: Row): boolean {
  const stored = row.destinations ?? [];
  return stored.length === 0 || stored.some((d) => d.kind === 'export');
}

export function isSectionDestinationSelected(row: Row, sectionId: string): boolean {
  return (row.destinations ?? []).some((d) => d.kind === 'section' && d.sectionId === sectionId);
}

export function isLocalSourceSelected(row: Row, localInputId: string): boolean {
  return (row.sources ?? []).some((s) => s.kind === 'local' && s.localInputId === localInputId);
}

export function isImportSourceSelected(row: Row, item: string): boolean {
  return (row.sources ?? []).some((s) => s.kind === 'import' && s.item === item);
}

export function toggleRowDestination(current: RowDestination[], ownSectionId: string, target: RowDestination): RowDestination[] {
  const normalized = normalizeDestinations(current, ownSectionId);
  const isExport = target.kind === 'export';

  const has = normalized.some((d) =>
    isExport ? d.kind === 'export' : d.kind === 'section' && d.sectionId === target.sectionId,
  );

  if (has) {
    return normalized.filter((d) =>
      isExport ? d.kind !== 'export' : !(d.kind === 'section' && d.sectionId === target.sectionId),
    );
  }

  return normalizeDestinations([...normalized, target], ownSectionId);
}

export function toggleRowSource(current: RowSource[], target: RowSource): RowSource[] {
  const key = target.kind === 'local' ? `local:${target.localInputId}` : `import:${target.item}`;
  const has = current.some((s) => (s.kind === 'local' ? `local:${s.localInputId}` : `import:${s.item}`) === key);
  if (has) {
    return current.filter((s) => (s.kind === 'local' ? `local:${s.localInputId}` : `import:${s.item}`) !== key);
  }
  return [...current, target];
}
