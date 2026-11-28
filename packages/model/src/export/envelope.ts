import { z } from 'zod';
import { EXPORT_FORMAT_VERSION } from '../versions';
import { WorldRowSchema, WorldDecisionsBodySchema, DraftRowSchema } from '../decisions/tables';
import { SnapshotRowSchema, SNAPSHOT_TABLE_NAMES, SNAPSHOT_ROW_SCHEMAS } from '../snapshot/tables';

const SnapshotTablesSchema = z.record(z.string(), z.array(z.unknown()));

export const ExportWorldSnapshotSchema = z.object({
  tables: SnapshotTablesSchema,
  snapshot: SnapshotRowSchema,
});

export const ExportWorldEntrySchema = z.object({
  world: WorldRowSchema,
  decisions: WorldDecisionsBodySchema,
  drafts: z.array(DraftRowSchema),
  snapshot: ExportWorldSnapshotSchema.nullable(),
});

export const ExportEnvelopeSchema = z.object({
  format: z.literal('satisfactories-export'),
  exportVersion: z.literal(EXPORT_FORMAT_VERSION),
  appVersion: z.string(),
  exportedAt: z.string(),
  reference: z.object({ datasetId: z.string() }),
  worlds: z.array(ExportWorldEntrySchema),
});

export type ExportEnvelope = z.infer<typeof ExportEnvelopeSchema>;

export type BuildExportInput = {
  appVersion: string;
  exportedAt: string;
  reference: { datasetId: string };
  worlds: Array<{
    decisions: import('../decisions/tables').WorldDecisions;
    snapshot: z.infer<typeof ExportWorldSnapshotSchema> | null;
  }>;
};

export function buildExport(input: BuildExportInput): ExportEnvelope {
  const worlds = input.worlds.map((w) => {
    if (!w.decisions.world) throw new Error('export requires decisions.world row');
    return {
      world: w.decisions.world,
      decisions: w.decisions,
      drafts: w.decisions.drafts,
      snapshot: w.snapshot,
    };
  });
  const envelope = {
    format: 'satisfactories-export' as const,
    exportVersion: EXPORT_FORMAT_VERSION,
    appVersion: input.appVersion,
    exportedAt: input.exportedAt,
    reference: input.reference,
    worlds,
  };
  return ExportEnvelopeSchema.parse(envelope);
}

export function upgradeExport(raw: unknown): unknown {
  if (typeof raw !== 'object' || raw === null) throw new Error('invalid export');
  const v = (raw as { exportVersion?: number }).exportVersion;
  if (v === EXPORT_FORMAT_VERSION) return raw;
  throw new Error(`unsupported export version ${String(v)}`);
}

export function parseExport(raw: unknown): ExportEnvelope {
  const upgraded = upgradeExport(raw);
  const parsed = ExportEnvelopeSchema.safeParse(upgraded);
  if (!parsed.success) throw new Error(parsed.error.message);
  for (const w of parsed.data.worlds) {
    if (JSON.stringify(w.drafts) !== JSON.stringify(w.decisions.drafts)) {
      throw new Error('drafts must match decisions.drafts');
    }
  }
  return parsed.data;
}

export { SNAPSHOT_TABLE_NAMES, SNAPSHOT_ROW_SCHEMAS };