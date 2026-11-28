import { z } from 'zod';
import { LineSignatureSchema } from '../../decisions/tables';

export const ConfirmLinePayloadSchema = z.object({
  id: z.string(),
  factory_id: z.string(),
  suggestion_fingerprint: z.string(),
  name: z.string(),
  section_label: z.string(),
  member_keys: z.array(z.string()),
  signature: LineSignatureSchema,
  notes: z.string().default(''),
});
export type ConfirmLinePayload = z.infer<typeof ConfirmLinePayloadSchema>;

export const RenameLinePayloadSchema = z.object({
  line_id: z.string(),
  name: z.string(),
});

export const SplitLinePayloadSchema = z.object({
  line_id: z.string(),
  id_a: z.string(),
  id_b: z.string(),
  keys_a: z.array(z.string()),
  keys_b: z.array(z.string()),
});
export type SplitLinePayload = z.infer<typeof SplitLinePayloadSchema>;

export const MergeLinesPayloadSchema = z.object({
  line_ids: z.array(z.string()).min(2),
});
export type MergeLinesPayload = z.infer<typeof MergeLinesPayloadSchema>;

export const AssignMachineToLinePayloadSchema = z.object({
  id: z.string(),
  machine_key: z.string(),
  line_id: z.string(),
});

export const RemoveMachineFromLinePayloadSchema = z.object({
  id: z.string(),
  machine_key: z.string(),
  line_id: z.string(),
});

export const ArchiveLinePayloadSchema = z.object({
  line_id: z.string(),
});