import {
  type BuildableRow,
  type Cm,
  type ClockFraction,
  type ComponentRow,
  type EdgeRow,
  type FoundationTileRow,
  type ResourceNodeRow,
  type UnknownObjectRow,
} from '@satisfactories/model';
import type { BBox, BuildableCategory, SnapshotInput, SnapshotTables } from './types';

export type SyntheticSize = {
  buildables: number;
  edges: number;
  foundationTiles: number;
  components: number;
  resourceNodes: number;
  unknownObjects: number;
};

export const SYNTHETIC_PRESETS = {
  small: { buildables: 5_000, edges: 10_000, foundationTiles: 1_300, components: 700, resourceNodes: 100, unknownObjects: 20 },
  large: { buildables: 150_000, edges: 300_000, foundationTiles: 40_000, components: 20_000, resourceNodes: 600, unknownObjects: 500 },
} as const satisfies Record<string, SyntheticSize>;

export type SyntheticPreset = keyof typeof SYNTHETIC_PRESETS;

/** Rough Satisfactory map bounds in game cm. */
export const MAP_BOUNDS: BBox = { minX: -324_600, maxX: 425_300, minY: -375_000, maxY: 375_000 };

/** Fixed sample box for the debug panel's bbox query: a 1 km × 1 km square near the map centre. */
export const SAMPLE_BBOX: BBox = { minX: -50_000, maxX: 50_000, minY: -50_000, maxY: 50_000 };

/** mulberry32: small, fast, deterministic. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CATEGORY_WEIGHTS: Array<[BuildableCategory, number]> = [
  ['logistics', 0.55],
  ['production', 0.15],
  ['power', 0.12],
  ['storage', 0.05],
  ['other', 0.04],
  ['extractor', 0.03],
  ['generator', 0.03],
  ['station', 0.02],
  ['vehicle', 0.01],
];

const CLASSES: Record<BuildableCategory, string[]> = {
  production: ['Build_ConstructorMk1_C', 'Build_AssemblerMk1_C', 'Build_ManufacturerMk1_C', 'Build_SmelterMk1_C'],
  extractor: ['Build_MinerMk2_C', 'Build_WaterPump_C', 'Build_OilPump_C'],
  generator: ['Build_GeneratorCoal_C', 'Build_GeneratorFuel_C', 'Build_GeneratorNuclear_C'],
  logistics: ['Build_ConveyorBeltMk5_C', 'Build_ConveyorAttachmentSplitter_C', 'Build_PipelineMK2_C'],
  station: ['Build_TrainStation_C', 'Build_TruckStation_C', 'Build_DroneStation_C'],
  storage: ['Build_StorageContainerMk2_C', 'Build_IndustrialTank_C'],
  power: ['Build_PowerPoleMk3_C', 'Build_PowerLine_C'],
  vehicle: ['BP_Truck_C', 'BP_Locomotive_C'],
  other: ['Build_Workshop_C', 'Build_SpaceElevator_C'],
};

const RECIPES = ['Recipe_IronPlate_C', 'Recipe_Screw_C', 'Recipe_Rotor_C', 'Recipe_ModularFrame_C', 'Recipe_IngotIron_C'];
const RESOURCES = ['Desc_OreIron_C', 'Desc_OreCopper_C', 'Desc_Stone_C', 'Desc_Coal_C', 'Desc_LiquidOil_C'];
const PURITIES = ['impure', 'normal', 'pure'] as const;
const MEDIA = ['belt', 'belt', 'belt', 'pipe', 'power'] as const;
const KINDS = ['conveyor_port', 'pipe_port', 'inventory', 'potential', 'power', 'other'] as const;
const UNKNOWN_REASONS = ['raw_bytes', 'trailing_data', 'unknown_class'] as const;

function pickCategory(r: number): BuildableCategory {
  let acc = 0;
  for (const [c, w] of CATEGORY_WEIGHTS) {
    acc += w;
    if (r < acc) return c;
  }
  return 'other';
}

const cm = (v: number) => v as Cm;
const pick = <T>(rand: () => number, list: readonly T[]): T => list[Math.floor(rand() * list.length)];
const between = (rand: () => number, lo: number, hi: number) => lo + rand() * (hi - lo);

export type SyntheticSnapshot = { snapshot: SnapshotInput; tables: SnapshotTables };

export type SyntheticOptions = {
  saveIdentifier: string;
  preset?: SyntheticPreset;
  size?: SyntheticSize;
  seed?: number;
  /** Bump to produce a new snapshot id for "write again". */
  generation?: number;
};

/**
 * Deterministic synthetic snapshot whose rows pass the model Zod schemas.
 * Same options → identical output.
 */
export function generateSyntheticSnapshot(opts: SyntheticOptions): SyntheticSnapshot {
  const size = opts.size ?? SYNTHETIC_PRESETS[opts.preset ?? 'small'];
  const seed = opts.seed ?? 42;
  const generation = opts.generation ?? 0;
  const rand = seededRandom(seed * 1000 + generation);
  const id = `synthetic-${opts.preset ?? 'custom'}-s${seed}-g${generation}`;

  const buildables: BuildableRow[] = new Array(size.buildables);
  for (let i = 0; i < size.buildables; i++) {
    const category = pickCategory(rand());
    const classShort = pick(rand, CLASSES[category]);
    const hasRecipe = category === 'production';
    const hasClock = hasRecipe || category === 'extractor' || category === 'generator';
    buildables[i] = {
      snapshot_id: id,
      key: `Persistent_Level:PersistentLevel.${classShort}_${2147000000 + i}`,
      class_short: classShort,
      class_path: `/Game/FactoryGame/Buildable/${classShort}.${classShort}`,
      category,
      x: cm(Math.round(between(rand, MAP_BOUNDS.minX, MAP_BOUNDS.maxX))),
      y: cm(Math.round(between(rand, MAP_BOUNDS.minY, MAP_BOUNDS.maxY))),
      z: cm(Math.round(between(rand, -2_000, 40_000))),
      qx: 0,
      qy: 0,
      qz: Math.sin(rand() * Math.PI),
      qw: Math.cos(rand() * Math.PI),
      recipe_short: hasRecipe ? pick(rand, RECIPES) : null,
      clock: hasClock ? (Math.round(between(rand, 0.1, 2.5) * 100) / 100) as ClockFraction : null,
      production_boost: hasRecipe ? (rand() < 0.05 ? 2 : 1) : null,
      shards: hasClock ? Math.floor(rand() * 4) : null,
      partial: rand() < 0.01,
    };
  }

  const components: ComponentRow[] = new Array(size.components);
  for (let i = 0; i < size.components; i++) {
    const parent = buildables[Math.floor(rand() * buildables.length)].key;
    const kind = pick(rand, KINDS);
    components[i] = {
      snapshot_id: id,
      key: `${parent}.Port${i}`,
      parent_key: parent,
      class_short: kind === 'pipe_port' ? 'FGPipeConnectionComponent' : 'FGFactoryConnectionComponent',
      kind,
      port_name: kind === 'conveyor_port' ? `Output${i % 4}` : `Port${i % 4}`,
    };
  }

  const edges: EdgeRow[] = new Array(size.edges);
  for (let i = 0; i < size.edges; i++) {
    const from = buildables[Math.floor(rand() * buildables.length)].key;
    const to = buildables[Math.floor(rand() * buildables.length)].key;
    edges[i] = {
      snapshot_id: id,
      from_component: `${from}.Output${i}`,
      to_component: `${to}.Input${i}`,
      from_buildable: from,
      to_buildable: to,
      medium: pick(rand, MEDIA),
      direction_known: rand() < 0.9,
    };
  }

  // Unique (tile_x, tile_y, z_bucket): walk a grid of 16 m tiles around the map centre.
  const tiles: FoundationTileRow[] = new Array(size.foundationTiles);
  const side = Math.ceil(Math.sqrt(size.foundationTiles));
  for (let i = 0; i < size.foundationTiles; i++) {
    tiles[i] = {
      snapshot_id: id,
      tile_x: (i % side) - Math.floor(side / 2),
      tile_y: Math.floor(i / side) - Math.floor(side / 2),
      z_bucket: Math.floor(rand() * 40),
      count: 1 + Math.floor(rand() * 4),
    };
  }

  const nodes: ResourceNodeRow[] = new Array(size.resourceNodes);
  for (let i = 0; i < size.resourceNodes; i++) {
    nodes[i] = {
      snapshot_id: id,
      key: `Persistent_Level:PersistentLevel.BP_ResourceNode${i}`,
      resource_short: pick(rand, RESOURCES),
      purity: pick(rand, PURITIES),
      x: cm(Math.round(between(rand, MAP_BOUNDS.minX, MAP_BOUNDS.maxX))),
      y: cm(Math.round(between(rand, MAP_BOUNDS.minY, MAP_BOUNDS.maxY))),
      z: cm(Math.round(between(rand, -2_000, 20_000))),
      extractor_key: rand() < 0.5 ? buildables[Math.floor(rand() * buildables.length)].key : null,
    };
  }

  const unknown: UnknownObjectRow[] = new Array(size.unknownObjects);
  for (let i = 0; i < size.unknownObjects; i++) {
    unknown[i] = {
      snapshot_id: id,
      key: `Persistent_Level:PersistentLevel.Unknown_${i}`,
      class_path: `/Game/Mods/Unknown/Thing_${i % 7}.Thing_${i % 7}_C`,
      reason: pick(rand, UNKNOWN_REASONS),
    };
  }

  const snapshot: SnapshotInput = {
    id,
    imported_at: new Date(Date.UTC(2026, 10, 28, 0, 0, generation)).toISOString(),
    save_identifier: opts.saveIdentifier,
    session_name: 'Synthetic',
    save_name: `synthetic_${opts.preset ?? 'custom'}`,
    header_version: 13,
    save_version: 46,
    build_version: '++FactoryGame+rel-main-1.2.0-CL-0',
    save_data_hash: `synthetic-${seed}-${generation}`,
    file_size: size.buildables * 400,
    file_mtime: '2026-11-28T00:00:00.000Z',
    play_seconds: 360_000 + generation,
    save_datetime: '2026-11-28T00:00:00.000Z',
    is_creative: false,
    has_mods: false,
    parse_ms: 0,
    warning_count: 0,
    partial_count: buildables.filter((b) => b.partial).length,
  };

  return {
    snapshot,
    tables: {
      buildable: buildables,
      component: components,
      edge: edges,
      foundation_tile: tiles,
      resource_node: nodes,
      unknown_object: unknown,
    },
  };
}
