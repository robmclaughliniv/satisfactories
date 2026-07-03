import type { Recipe, Status, Transport } from '../types';

export const ITEMS: Record<string, { color: string; cat: string }> = {
  'Iron Ore': { color: '#C97B5A', cat: 'Raw Ore' },
  'Copper Ore': { color: '#E0814A', cat: 'Raw Ore' },
  'Caterium Ore': { color: '#E5C14C', cat: 'Raw Ore' },
  Coal: { color: '#41454C', cat: 'Raw Ore' },
  Limestone: { color: '#C9BB97', cat: 'Raw Ore' },
  'Iron Ingot': { color: '#A9AEB4', cat: 'Ingot' },
  'Copper Ingot': { color: '#D98E5A', cat: 'Ingot' },
  'Caterium Ingot': { color: '#E8C24E', cat: 'Ingot' },
  'Steel Ingot': { color: '#71767C', cat: 'Ingot' },
  'Iron Plate': { color: '#9197A0', cat: 'Standard Parts' },
  'Iron Rod': { color: '#838992', cat: 'Standard Parts' },
  Screw: { color: '#AEB4BE', cat: 'Standard Parts' },
  Wire: { color: '#E0913F', cat: 'Standard Parts' },
  Cable: { color: '#C77F3E', cat: 'Standard Parts' },
  Concrete: { color: '#BFB59B', cat: 'Standard Parts' },
  'Steel Beam': { color: '#62676D', cat: 'Steel Parts' },
  'Steel Pipe': { color: '#787D83', cat: 'Steel Parts' },
  Quickwire: { color: '#E8C84E', cat: 'Electronics' },
  'Reinforced Iron Plate': { color: '#8A9098', cat: 'Assembled' },
  'Modular Frame': { color: '#A0A6AC', cat: 'Assembled' },
  'Encased Industrial Beam': { color: '#6B7075', cat: 'Assembled' },
  'Heavy Modular Frame': { color: '#9197A0', cat: 'Assembled' },
  Plastic: { color: '#5BA3C4', cat: 'Polymer' },
};

export const BUILDINGS: Record<string, { power: number; glyph: string }> = {
  Smelter: { power: 4, glyph: '🔥' },
  Foundry: { power: 16, glyph: '⚗' },
  Constructor: { power: 4, glyph: '⚙' },
  Assembler: { power: 15, glyph: '🛠' },
  Manufacturer: { power: 55, glyph: '🏭' },
};

type RawRecipe = [string, string, string, number, [string, number][], [string, number][], boolean];

const RAW: RawRecipe[] = [
  ['iron_ingot', 'Iron Ingot', 'Smelter', 4, [['Iron Ore', 30]], [['Iron Ingot', 30]], false],
  ['copper_ingot', 'Copper Ingot', 'Smelter', 4, [['Copper Ore', 30]], [['Copper Ingot', 30]], false],
  ['caterium_ingot', 'Caterium Ingot', 'Smelter', 4, [['Caterium Ore', 45]], [['Caterium Ingot', 15]], false],
  ['steel_ingot', 'Steel Ingot', 'Foundry', 16, [['Iron Ore', 45], ['Coal', 45]], [['Steel Ingot', 45]], false],
  ['iron_plate', 'Iron Plate', 'Constructor', 4, [['Iron Ingot', 30]], [['Iron Plate', 20]], false],
  ['iron_rod', 'Iron Rod', 'Constructor', 4, [['Iron Ingot', 15]], [['Iron Rod', 15]], false],
  ['screw', 'Screw', 'Constructor', 4, [['Iron Rod', 10]], [['Screw', 40]], false],
  ['wire', 'Wire', 'Constructor', 4, [['Copper Ingot', 15]], [['Wire', 30]], false],
  ['cable', 'Cable', 'Constructor', 4, [['Wire', 60]], [['Cable', 30]], false],
  ['concrete', 'Concrete', 'Constructor', 4, [['Limestone', 45]], [['Concrete', 15]], false],
  ['steel_beam', 'Steel Beam', 'Constructor', 4, [['Steel Ingot', 60]], [['Steel Beam', 15]], false],
  ['steel_pipe', 'Steel Pipe', 'Constructor', 4, [['Steel Ingot', 30]], [['Steel Pipe', 20]], false],
  ['quickwire', 'Quickwire', 'Constructor', 4, [['Caterium Ingot', 12]], [['Quickwire', 60]], false],
  ['reinforced_iron_plate', 'Reinforced Iron Plate', 'Assembler', 15, [['Iron Plate', 30], ['Screw', 60]], [['Reinforced Iron Plate', 5]], false],
  ['modular_frame', 'Modular Frame', 'Assembler', 15, [['Reinforced Iron Plate', 3], ['Iron Rod', 12]], [['Modular Frame', 2]], false],
  ['encased_industrial_beam', 'Encased Industrial Beam', 'Assembler', 15, [['Steel Beam', 24], ['Concrete', 30]], [['Encased Industrial Beam', 6]], false],
  ['heavy_modular_frame', 'Heavy Modular Frame', 'Manufacturer', 55, [['Modular Frame', 10], ['Steel Pipe', 30], ['Encased Industrial Beam', 10], ['Screw', 40]], [['Heavy Modular Frame', 2]], false],
  ['alt_cast_screw', 'Cast Screw', 'Constructor', 4, [['Iron Ingot', 12.5]], [['Screw', 50]], true],
  ['alt_steel_rod', 'Steel Rod', 'Constructor', 4, [['Steel Ingot', 12]], [['Iron Rod', 48]], true],
  ['alt_steel_screw', 'Steel Screw', 'Constructor', 4, [['Steel Beam', 5]], [['Screw', 260]], true],
  ['alt_bolted_frame', 'Bolted Frame', 'Assembler', 15, [['Reinforced Iron Plate', 7.5], ['Screw', 140]], [['Modular Frame', 5]], true],
  ['alt_solid_steel', 'Solid Steel Ingot', 'Foundry', 16, [['Iron Ingot', 40], ['Coal', 40]], [['Steel Ingot', 60]], true],
  ['alt_coated_plate', 'Coated Iron Plate', 'Assembler', 15, [['Iron Ingot', 37.5], ['Plastic', 7.5]], [['Iron Plate', 75]], true],
  ['alt_stitched_plate', 'Stitched Iron Plate', 'Assembler', 15, [['Iron Plate', 18.75], ['Wire', 37.5]], [['Reinforced Iron Plate', 5.625]], true],
  ['alt_encased_beam', 'Encased Industrial Pipe', 'Assembler', 15, [['Steel Pipe', 28], ['Concrete', 20]], [['Encased Industrial Beam', 5]], true],
];

export const RECIPES: Recipe[] = RAW.map((r) => ({
  id: r[0],
  name: r[1],
  building: r[2],
  power: r[3],
  inputs: r[4].map((x) => ({ item: x[0], rate: x[1] })),
  outputs: r[5].map((x) => ({ item: x[0], rate: x[1] })),
  alt: r[6],
}));

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
    ({ Belt: '#8A909A', Train: '#4FB477', Truck: '#E0B341', Drone: '#3FA7C4', Pipe: '#8A6FC4', Unset: '#5BCB86' }as Record<string, string>)[t] || '#8A909A'
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
