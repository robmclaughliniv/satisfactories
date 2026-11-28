import type { Cm, PerMin } from '../units';

export type FactoryView = {
  factoryId: string;
  memberMachineKeys: string[];
  floors: number[];
  rates: Record<string, PerMin>;
};

export type LineSuggestion = {
  fingerprint: string;
  recipe_short: string;
  member_keys: string[];
  input_manifold: unknown;
  output_manifold: unknown;
  matched_line_id?: string;
  overlap: number;
};

export type LinkEndpoint =
  | { kind: 'line'; id: string }
  | { kind: 'factory'; id: string }
  | { kind: 'station'; id: string };

export type LinkSuggestion = {
  fingerprint: string;
  from: LinkEndpoint;
  to: LinkEndpoint;
  item_short: string;
  medium: 'belt' | 'pipe' | 'train' | 'truck' | 'drone';
  via?: string;
  estimated_rate: PerMin;
};

export type AuditItemType =
  | 'unassigned_machine'
  | 'orphaned_override'
  | 'line_split'
  | 'lines_merged'
  | 'line_unmatched'
  | 'line_empty'
  | 'unwired_machine'
  | 'ambiguous_storage'
  | 'link_unconfirmed';

export type AuditItem = {
  fingerprint: string;
  world_id: string;
  factory_id?: string;
  type: AuditItemType;
  refs: string[];
  message: string;
};

export type { Cm };