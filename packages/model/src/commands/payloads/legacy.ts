import { z } from 'zod';
import { WorldSchema } from '../../schema';

export const LegacyMutationPayloadSchema = z.object({
  description: z.string(),
  before_hash: z.string(),
  after: WorldSchema,
});
export type LegacyMutationPayload = z.infer<typeof LegacyMutationPayloadSchema>;