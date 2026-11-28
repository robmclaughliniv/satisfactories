import type { Factory, Route, Section, Station, World } from './schema';
import { reconcileLogistics } from './logistics';

export type FactoryBaseline = {
  sections: Section[];
  localInputs: Factory['localInputs'];
  importOrder: string[];
  exportOrder: string[];
  routes: Route[];
  stations: Station[];
};

const EMPTY_BASELINE: FactoryBaseline = {
  sections: [],
  localInputs: [],
  importOrder: [],
  exportOrder: [],
  routes: [],
  stations: [],
};

function outboundRoutes(factoryId: string, routes: Route[]): Route[] {
  return routes.filter((r) => r.from === factoryId);
}

function ownedStations(factoryId: string, stations: Station[]): Station[] {
  return (stations ?? []).filter((s) => s.homeFactoryId === factoryId);
}

function snapshot(factory: Factory, routes: Route[], stations: Station[]): FactoryBaseline {
  return {
    sections: JSON.parse(JSON.stringify(factory.sections)),
    localInputs: JSON.parse(JSON.stringify(factory.localInputs ?? [])),
    importOrder: [...(factory.importOrder ?? [])],
    exportOrder: [...(factory.exportOrder ?? [])],
    routes: JSON.parse(JSON.stringify(outboundRoutes(factory.id, routes))),
    stations: JSON.parse(JSON.stringify(ownedStations(factory.id, stations))),
  };
}

export function parseBaseline(raw: string): FactoryBaseline {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return {
        ...EMPTY_BASELINE,
        sections: parsed,
      };
    }
    if (parsed !== null && typeof parsed === 'object') {
      const b = parsed as Partial<FactoryBaseline>;
      return {
        sections: Array.isArray(b.sections) ? b.sections : [],
        localInputs: Array.isArray(b.localInputs) ? b.localInputs : [],
        importOrder: Array.isArray(b.importOrder) ? b.importOrder : [],
        exportOrder: Array.isArray(b.exportOrder) ? b.exportOrder : [],
        routes: Array.isArray(b.routes) ? b.routes : [],
        stations: Array.isArray(b.stations) ? b.stations : [],
      };
    }
  } catch {
    /* fall through */
  }
  return { ...EMPTY_BASELINE };
}

export function captureBaseline(factory: Factory, routes: Route[], stations: Station[]): string {
  return JSON.stringify(snapshot(factory, routes, stations));
}

export function emptyBaseline(): string {
  return JSON.stringify(EMPTY_BASELINE);
}

export function isFactoryDirty(factory: Factory, routes: Route[], stations: Station[]): boolean {
  return JSON.stringify(snapshot(factory, routes, stations)) !== JSON.stringify(parseBaseline(factory.baseline));
}

export function applyBaseline(factory: Factory, world: World, baseline: FactoryBaseline): void {
  const ownedIds = new Set(ownedStations(factory.id, world.stations ?? []).map((s) => s.id));

  factory.sections = JSON.parse(JSON.stringify(baseline.sections));
  factory.localInputs = JSON.parse(JSON.stringify(baseline.localInputs));
  factory.importOrder = [...baseline.importOrder];
  factory.exportOrder = [...baseline.exportOrder];

  world.routes = [
    ...world.routes.filter((r) => r.from !== factory.id),
    ...JSON.parse(JSON.stringify(baseline.routes)),
  ];

  world.stations = [
    ...(world.stations ?? []).filter((s) => !ownedIds.has(s.id)),
    ...JSON.parse(JSON.stringify(baseline.stations)),
  ];

  reconcileLogistics(world);
}
