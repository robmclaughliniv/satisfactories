import type { Recipe, Status, Transport } from '../types';
import gameData from './satisfactory-game-data.json';

export const ITEMS: Record<string, { color: string; cat: string }> = gameData.items;
export const BUILDINGS: Record<string, { power: number; glyph: string }> = gameData.buildings;
export const RECIPES: Recipe[] = gameData.recipes;

export function recipeById(id: string): Recipe | undefined {
  return RECIPES.find((r) => r.id === id);
}

export const COLORS = ['#F5882E', '#D8553B', '#3FA7C4', '#E0B341', '#8A6FC4', '#4FB477', '#E05A8A', '#5A8AE0'];

export const TYPES = ['Mega-factory', 'Mid-sized Factory', 'Mini-factory', 'Transport Depot'];

export const TRANSPORTS: Transport[] = ['Belt', 'Train', 'Truck', 'Drone', 'Pipe'];

export function fmt(n: number): string {
  const r = Math.round(n * 1000) / 1000;
  return Number.isInteger(r) ? String(r) : String(parseFloat(r.toFixed(3)));
}

export function initials(name: string): string {
  const w = name.split(' ');
  if (w.length === 1) return name.slice(0, 2).toUpperCase();
  return (w[0][0] + w[w.length - 1][0]).toUpperCase();
}

export function itemColor(item: string): string {
  return ITEMS[item]?.color || '#7B828D';
}

export function transportColor(t: string): string {
  return (
    ({ Belt: '#8A909A', Train: '#4FB477', Truck: '#E0B341', Drone: '#3FA7C4', Pipe: '#8A6FC4', Unset: '#5BCB86' } as Record<string, string>)[t] || '#8A909A'
  );
}

export function statusMeta(s: Status | string): { label: string; color: string } {
  return (
    (
      {
        planned: { label: 'Planned', color: '#8A909A' },
        construction: { label: 'Under Construction', color: '#E0B341' },
        operational: { label: 'Operational', color: '#5BCB86' },
        decommissioned: { label: 'Decommissioned', color: '#6B7280' },
      } as Record<string, { label: string; color: string }>
    )[s] || { label: String(s), color: '#8A909A' }
  );
}
