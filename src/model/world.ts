import type { Factory, World, WorldTemplate } from './schema';
import { captureBaseline } from './baseline';

let idCounter = 0;

/** Unique id even when called multiple times within the same millisecond. */
export function freshId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter.toString(36)}`;
}

export function createEmptyWorld(name: string): World {
  const now = new Date().toISOString();
  return {
    id: freshId('w'),
    name,
    factories: [],
    routes: [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Clone a bundled template into a real World: fresh world id, timestamps,
 * and each factory's baseline computed from its committed draft state.
 */
export function instantiateTemplate(template: WorldTemplate): World {
  const now = new Date().toISOString();
  const routes = JSON.parse(JSON.stringify(template.routes));
  const factories: Factory[] = template.factories.map((f) => {
    const factory: Factory = {
      ...JSON.parse(JSON.stringify(f)),
      localInputs: f.localInputs ?? [],
      importOrder: f.importOrder ?? [],
      exportOrder: f.exportOrder ?? [],
      baseline: '',
    };
    factory.baseline = captureBaseline(factory, routes);
    return factory;
  });
  return {
    id: freshId('w'),
    name: template.name,
    factories,
    routes,
    createdAt: now,
    updatedAt: now,
  };
}

/** Bump a world's updatedAt in place. */
export function touchWorld(w: World): void {
  w.updatedAt = new Date().toISOString();
}
