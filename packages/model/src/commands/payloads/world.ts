import { z } from 'zod';
import { WorldOriginSchema } from '../../decisions/enums';

export const CreateWorldPayloadSchema = z.object({
  name: z.string(),
  origin: WorldOriginSchema,
  reference_dataset_id: z.string().nullable(),
});
export type CreateWorldPayload = z.infer<typeof CreateWorldPayloadSchema>;

export const RenameWorldPayloadSchema = z.object({
  name: z.string(),
});

export const LinkSavePayloadSchema = z.object({
  save_identifier: z.string(),
});

export const DeleteWorldPayloadSchema = z.object({});