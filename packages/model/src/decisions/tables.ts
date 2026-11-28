import { z } from 'zod';
import { WorldSchema, StatusSchema } from '../schema';
import { CmSchema, PerMinSchema, PointCmSchema } from '../units';
import { polygonSelfIntersects } from './geometry';
import { WorldOriginSchema } from './enums';
export { WorldOriginSchema } from './enums';

export const WorldRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  save_identifier: z.string().nullable(),
  reference_dataset_id: z.string().nullable(),
  origin: WorldOriginSchema,
  created_at: z.string(),
  updated_at: z.string(),
});
export type WorldRow = z.infer<typeof WorldRowSchema>;

export const ManualWorldRowSchema = z.object({
  world_id: z.string(),
  data: WorldSchema,
});
export type ManualWorldRow = z.infer<typeof ManualWorldRowSchema>;

export const FloorSettingsSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('auto') }),
  z.object({
    mode: z.literal('manual'),
    base_z_cm: CmSchema,
    floor_height_cm: CmSchema,
  }),
]);
export type FloorSettings = z.infer<typeof FloorSettingsSchema>;

export const LegacyPinPercentSchema = z
  .object({
    x: z.number(),
    y: z.number(),
  })
  .nullable();

const PolygonSchema = z
  .array(PointCmSchema)
  .min(3)
  .nullable()
  .superRefine((points, ctx) => {
    if (points && polygonSelfIntersects(points)) {
      ctx.addIssue({ code: 'custom', message: 'polygon must not self-intersect' });
    }
  });

export const FactoryRowSchema = z.object({
  id: z.string(),
  world_id: z.string(),
  name: z.string(),
  color: z.string(),
  status: StatusSchema,
  tier: z.string(),
  tagline: z.string(),
  tags: z.array(z.string()),
  cover: z.string(),
  notes: z.string(),
  polygon: PolygonSchema,
  legacy_pin_percent: LegacyPinPercentSchema,
  floor_settings: FloorSettingsSchema,
  favorite_items: z.array(z.string()),
  import_order: z.array(z.string()),
  export_order: z.array(z.string()),
  created_at: z.string(),
  updated_at: z.string(),
});
export type FactoryRow = z.infer<typeof FactoryRowSchema>;

export const MembershipKindSchema = z.enum(['include', 'exclude']);

export const MembershipOverrideRowSchema = z.object({
  id: z.string(),
  world_id: z.string(),
  factory_id: z.string(),
  machine_key: z.string(),
  kind: MembershipKindSchema,
});
export type MembershipOverrideRow = z.infer<typeof MembershipOverrideRowSchema>;

export const LineSignatureSchema = z.object({
  recipe_short: z.string(),
  input_endpoints: z.array(z.string()),
  output_endpoints: z.array(z.string()),
});

export const LineStatusSchema = z.enum(['confirmed', 'archived']);

export const LineRowSchema = z.object({
  id: z.string(),
  world_id: z.string(),
  factory_id: z.string(),
  name: z.string(),
  section_label: z.string(),
  recipe_short: z.string(),
  member_keys: z.array(z.string()),
  signature: LineSignatureSchema,
  status: LineStatusSchema,
  notes: z.string(),
});
export type LineRow = z.infer<typeof LineRowSchema>;

export const LineOverrideKindSchema = z.enum(['assign', 'exclude']);

export const LineOverrideRowSchema = z.object({
  id: z.string(),
  world_id: z.string(),
  machine_key: z.string(),
  line_id: z.string(),
  kind: LineOverrideKindSchema,
});
export type LineOverrideRow = z.infer<typeof LineOverrideRowSchema>;

export const LinkEndpointSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('line'), id: z.string() }),
  z.object({ kind: z.literal('factory'), id: z.string() }),
  z.object({ kind: z.literal('station'), id: z.string() }),
]);
export type LinkEndpointRow = z.infer<typeof LinkEndpointSchema>;

export const LinkMediumSchema = z.enum(['belt', 'pipe', 'train', 'truck', 'drone']);
export const LinkStatusSchema = z.enum(['confirmed', 'rejected']);

export const LinkRowSchema = z.object({
  id: z.string(),
  world_id: z.string(),
  from: LinkEndpointSchema,
  to: LinkEndpointSchema,
  item_short: z.string(),
  medium: LinkMediumSchema,
  via_vehicle_key: z.string().nullable(),
  rate_override: PerMinSchema.nullable(),
  status: LinkStatusSchema,
});
export type LinkRow = z.infer<typeof LinkRowSchema>;

export const StorageRoleKindSchema = z.enum(['pass_through', 'endpoint']);

export const StorageRoleRowSchema = z.object({
  id: z.string(),
  world_id: z.string(),
  machine_key: z.string(),
  role: StorageRoleKindSchema,
});
export type StorageRoleRow = z.infer<typeof StorageRoleRowSchema>;

export const AuditDismissalRowSchema = z.object({
  id: z.string(),
  world_id: z.string(),
  fingerprint: z.string(),
  dismissed_at: z.string(),
});
export type AuditDismissalRow = z.infer<typeof AuditDismissalRowSchema>;

export const FavoritesRowSchema = z.object({
  world_id: z.string().nullable(),
  items: z.array(z.string()),
  factories: z.array(z.string()),
});
export type FavoritesRow = z.infer<typeof FavoritesRowSchema>;

export const MetricValuesSchema = z.record(
  z.string(),
  z.object({
    produced: z.number().nonnegative(),
    consumed: z.number().nonnegative(),
    efficiency: z.number().nonnegative().nullable(),
  }),
);

export const MetricHistoryRowSchema = z.object({
  id: z.string(),
  world_id: z.string(),
  factory_id: z.string(),
  saved_at: z.string(),
  values: MetricValuesSchema,
});
export type MetricHistoryRow = z.infer<typeof MetricHistoryRowSchema>;

export const CommandLogRowSchema = z.object({
  seq: z.number().int(),
  world_id: z.string(),
  command: z.object({
    id: z.string(),
    name: z.string(),
    v: z.number().int(),
    world_id: z.string(),
    at: z.string(),
    payload: z.unknown(),
  }),
});
export type CommandLogRow = z.infer<typeof CommandLogRowSchema>;

export type WorldDecisionsBody = {
  world: WorldRow | null;
  manual_world: ManualWorldRow | null;
  factories: FactoryRow[];
  membership_overrides: MembershipOverrideRow[];
  lines: LineRow[];
  line_overrides: LineOverrideRow[];
  links: LinkRow[];
  storage_roles: StorageRoleRow[];
  audit_dismissals: AuditDismissalRow[];
  favorites: FavoritesRow | null;
  metric_history: MetricHistoryRow[];
  command_log: CommandLogRow[];
  drafts: DraftRow[];
};

export type DraftRow = {
  id: string;
  world_id: string;
  name: string;
  created_at: string;
  based_on_snapshot: string | null;
  decisions: WorldDecisionsBody;
};

export const DraftRowSchema: z.ZodType<DraftRow> = z.object({
  id: z.string(),
  world_id: z.string(),
  name: z.string(),
  created_at: z.string(),
  based_on_snapshot: z.string().nullable(),
  decisions: z.lazy(() => WorldDecisionsBodySchema),
});

export const WorldDecisionsBodySchema: z.ZodType<WorldDecisionsBody> = z.object({
  world: WorldRowSchema.nullable(),
  manual_world: ManualWorldRowSchema.nullable(),
  factories: z.array(FactoryRowSchema),
  membership_overrides: z.array(MembershipOverrideRowSchema),
  lines: z.array(LineRowSchema),
  line_overrides: z.array(LineOverrideRowSchema),
  links: z.array(LinkRowSchema),
  storage_roles: z.array(StorageRoleRowSchema),
  audit_dismissals: z.array(AuditDismissalRowSchema),
  favorites: FavoritesRowSchema.nullable(),
  metric_history: z.array(MetricHistoryRowSchema),
  command_log: z.array(CommandLogRowSchema),
  drafts: z.array(DraftRowSchema),
});

export type WorldDecisions = WorldDecisionsBody;

export function emptyWorldDecisions(): WorldDecisions {
  return {
    world: null,
    manual_world: null,
    factories: [],
    membership_overrides: [],
    lines: [],
    line_overrides: [],
    links: [],
    storage_roles: [],
    audit_dismissals: [],
    favorites: null,
    metric_history: [],
    command_log: [],
    drafts: [],
  };
}

export function cloneWorldDecisions(d: WorldDecisions): WorldDecisions {
  return JSON.parse(JSON.stringify(d)) as WorldDecisions;
}

/** Draft payload: full decision copy without nested draft rows (avoids cycles). */
export function decisionsForDraft(d: WorldDecisions): WorldDecisionsBody {
  const copy = cloneWorldDecisions(d);
  copy.drafts = [];
  return copy;
}