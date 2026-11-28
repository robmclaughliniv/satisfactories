import { z } from 'zod';

export const SaveDraftPayloadSchema = z.object({
  id: z.string(),
  name: z.string(),
  based_on_snapshot: z.string().nullable().optional(),
});
export type SaveDraftPayload = z.infer<typeof SaveDraftPayloadSchema>;

export const RestoreDraftPayloadSchema = z.object({
  draft_id: z.string(),
});

export const DeleteDraftPayloadSchema = z.object({
  draft_id: z.string(),
});