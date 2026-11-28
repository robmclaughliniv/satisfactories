import { z } from 'zod';
import { COMMAND_NAMES, type CommandName } from './names';
import { COMMAND_SCHEMA_VERSION } from '../versions';

export const CommandNameSchema = z.enum(COMMAND_NAMES);

export const CommandEnvelopeSchema = z.object({
  id: z.string(),
  name: CommandNameSchema,
  v: z.literal(COMMAND_SCHEMA_VERSION),
  world_id: z.string(),
  at: z.string(),
  payload: z.unknown(),
});

export type CommandEnvelope = Omit<z.infer<typeof CommandEnvelopeSchema>, 'name' | 'payload'> & {
  name: CommandName;
  payload: unknown;
};