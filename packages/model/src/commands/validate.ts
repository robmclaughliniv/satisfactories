import { COMMAND_PAYLOAD_SCHEMAS } from './payloads';
import { CommandEnvelopeSchema, type CommandEnvelope } from './envelope';
import { CommandError } from './error';
import type { CommandName } from './names';
import { COMMAND_SCHEMA_VERSION } from '../versions';

export function parseCommandEnvelope(input: unknown): CommandEnvelope {
  const base = CommandEnvelopeSchema.safeParse(input);
  if (!base.success) {
    throw new CommandError('invalid_payload', base.error.message);
  }
  if (base.data.v !== COMMAND_SCHEMA_VERSION) {
    throw new CommandError('invalid_payload', `unsupported command version ${base.data.v}`);
  }
  const name = base.data.name as CommandName;
  const schema = COMMAND_PAYLOAD_SCHEMAS[name];
  if (!schema) {
    throw new CommandError('unknown_command', `unknown command ${name}`);
  }
  const payload = schema.safeParse(base.data.payload);
  if (!payload.success) {
    throw new CommandError('invalid_payload', payload.error.message);
  }
  return {
    ...base.data,
    name,
    payload: payload.data,
  };
}