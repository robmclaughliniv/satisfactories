import { recipeById } from '../data/gameData';
import { importedByItem } from '../model/logistics';
import { allLines } from './lineFeeds';
import type { Factory, RowSource, World } from '../types';

export const inputSourceKey = (source: RowSource) => source.kind === 'local'
  ? `local:${source.localInputId}` : `import:${source.item}`;

export interface InputSupplyRequest {
  kind: 'local' | 'import';
  item: string;
  localInputId?: string;
  rate: number;
  previousKey?: string;
}

export function availableInputSupply(world: World, factory: Factory, rowId: string, request: InputSupplyRequest): number {
  const sourceKey = request.kind === 'local' ? `local:${request.localInputId}` : `import:${request.item}`;
  const supply = request.kind === 'local'
    ? factory.localInputs.find(input => input.id === request.localInputId)?.rate || 0
    : importedByItem(world, factory, request.item);
  const assigned = allLines(factory).reduce((total, line) => total + line.sources
    .filter(source => inputSourceKey(source) === sourceKey && !(line.id === rowId && inputSourceKey(source) === request.previousKey))
    .reduce((sum, source) => sum + (source.rate || 0), 0), 0);
  return Math.max(0, supply - assigned);
}

export function validateInputSupply(world: World, factoryId: string, rowId: string, request: InputSupplyRequest): string | null {
  const factory = world.factories.find(f => f.id === factoryId);
  const line = factory && allLines(factory).find(r => r.id === rowId);
  if (!factory || !line) return 'This production line is no longer available.';
  if (!recipeById(line.recipeId)?.inputs.some(input => input.item === request.item)) return 'Choose an input required by this production line.';
  if (!Number.isFinite(request.rate) || request.rate <= 0) return 'Enter a positive supply rate.';
  if (request.kind === 'local' && !factory.localInputs.some(input => input.id === request.localInputId && input.item === request.item)) return 'Choose a local source for this resource.';
  const sourceKey = request.kind === 'local' ? `local:${request.localInputId}` : `import:${request.item}`;
  if (line.sources.some(source => inputSourceKey(source) === sourceKey && sourceKey !== request.previousKey)) return 'This source is already assigned. Edit its existing assignment.';
  const available = availableInputSupply(world, factory, rowId, request);
  if (request.rate > available + 0.001) return 'The requested rate exceeds the available input supply.';
  return null;
}

/** Claim factory-owned supply without creating or changing its source. */
export function assignInputSupply(world: World, factoryId: string, rowId: string, request: InputSupplyRequest): string | null {
  const error = validateInputSupply(world, factoryId, rowId, request);
  if (error) return error;
  const factory = world.factories.find(f => f.id === factoryId)!;
  const line = allLines(factory).find(r => r.id === rowId)!;
  line.sources = line.sources.filter(source => inputSourceKey(source) !== request.previousKey);
  line.sources.push(request.kind === 'import'
    ? { kind: 'import', item: request.item, rate: request.rate }
    : { kind: 'local', localInputId: request.localInputId!, rate: request.rate });
  return null;
}
