import { z } from 'zod';

/**
 * Source of truth for all persisted data shapes.
 * Each World is a self-contained document, designed to map 1:1 to a
 * database row/document when a backend is added later.
 */

export const StatusSchema = z.enum(['planned', 'construction', 'operational', 'decommissioned']);

export const TransportSchema = z.enum(['Belt', 'Train', 'Truck', 'Drone', 'Pipe', 'Unset']);

export const RowSchema = z.object({
  id: z.string(),
  recipeId: z.string(),
  count: z.number(),
  export: z.boolean().optional(),
});

export const SectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  rows: z.array(RowSchema),
});

export const FactorySchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  status: StatusSchema,
  tier: z.string(),
  tagline: z.string(),
  tags: z.array(z.string()),
  cover: z.string(),
  x: z.number(),
  y: z.number(),
  sections: z.array(SectionSchema),
  /** JSON snapshot of sections at last commit — used for the dirty indicator. */
  baseline: z.string(),
});

export const RouteSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  item: z.string(),
  rate: z.number(),
  t: TransportSchema,
});

export const WorldSchema = z.object({
  id: z.string(),
  name: z.string(),
  factories: z.array(FactorySchema),
  routes: z.array(RouteSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const SCHEMA_VERSION = 2 as const;

/** Persisted envelope (localStorage now, database later). */
export const PersistedStateSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  worlds: z.array(WorldSchema),
  worldId: z.string().nullable(),
  favItems: z.array(z.string()),
});

export type Status = z.infer<typeof StatusSchema>;
export type Transport = z.infer<typeof TransportSchema>;
export type Row = z.infer<typeof RowSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type Factory = z.infer<typeof FactorySchema>;
export type Route = z.infer<typeof RouteSchema>;
export type World = z.infer<typeof WorldSchema>;
export type PersistedStateV2 = z.infer<typeof PersistedStateSchema>;

/** World template: a World without identity/timestamps/baselines, used for bundled sample data. */
export const WorldTemplateSchema = z.object({
  name: z.string(),
  factories: z.array(FactorySchema.omit({ baseline: true })),
  routes: z.array(RouteSchema),
});

export type WorldTemplate = z.infer<typeof WorldTemplateSchema>;
