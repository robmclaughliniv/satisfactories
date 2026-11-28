import { z } from 'zod';
import { StorageRoleKindSchema } from '../../decisions/tables';

export const SetStorageRolePayloadSchema = z.object({
  id: z.string(),
  machine_key: z.string(),
  role: StorageRoleKindSchema,
});