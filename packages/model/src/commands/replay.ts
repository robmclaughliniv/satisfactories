import type { WorldDecisions } from '../decisions/tables';
import { cloneWorldDecisions } from '../decisions/tables';
import type { CommandEnvelope } from './envelope';
import { apply } from './apply';

export function replay(checkpoint: WorldDecisions, commands: CommandEnvelope[]): WorldDecisions {
  let state = cloneWorldDecisions(checkpoint);
  for (const cmd of commands) {
    state = apply(state, cmd);
  }
  return state;
}