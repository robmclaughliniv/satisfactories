import {
  cloneWorldDecisions,
  decisionsForDraft,
  type DraftRow,
  type FactoryRow,
  type LineRow,
  type LinkRow,
  type WorldDecisions,
} from '../decisions/tables';
import { polygonSelfIntersects } from '../decisions/geometry';
import type { PointCm } from '../units';
import { CommandError } from './error';
import type { CommandEnvelope } from './envelope';
import { parseCommandEnvelope } from './validate';
import type { CreateWorldPayload } from './payloads/world';
import type { CreateFactoryPayload } from './payloads/factory';
import type { ConfirmLinePayload, SplitLinePayload, MergeLinesPayload } from './payloads/lines';
import type { ConfirmLinkPayload } from './payloads/links';
import type { LegacyMutationPayload } from './payloads/legacy';
import type { SaveDraftPayload } from './payloads/drafts';
import { COMMAND_PAYLOAD_SCHEMAS } from './payloads';
import type { CommandName } from './names';

function nextSeq(d: WorldDecisions): number {
  if (d.command_log.length === 0) return 1;
  return Math.max(...d.command_log.map((r) => r.seq)) + 1;
}

function appendLog(d: WorldDecisions, cmd: CommandEnvelope): void {
  d.command_log.push({
    seq: nextSeq(d),
    world_id: cmd.world_id,
    command: cmd,
  });
}

function requireWorld(d: WorldDecisions): void {
  if (!d.world) throw new CommandError('missing_target', 'world row missing');
}

function requireFactory(d: WorldDecisions, factoryId: string): FactoryRow {
  const f = d.factories.find((x) => x.id === factoryId);
  if (!f) throw new CommandError('missing_target', `factory ${factoryId} not found`);
  return f;
}

function requireLine(d: WorldDecisions, lineId: string): LineRow {
  const line = d.lines.find((x) => x.id === lineId);
  if (!line) throw new CommandError('missing_target', `line ${lineId} not found`);
  return line;
}

function requireLink(d: WorldDecisions, linkId: string): LinkRow {
  const link = d.links.find((x) => x.id === linkId);
  if (!link) throw new CommandError('missing_target', `link ${linkId} not found`);
  return link;
}

function validatePolygon(points: PointCm[]): void {
  if (points.length < 3) throw new CommandError('invalid_payload', 'polygon requires at least 3 points');
  if (polygonSelfIntersects(points)) throw new CommandError('invalid_payload', 'polygon must not self-intersect');
}

function linkTouchesFactoryOrLine(link: LinkRow, factoryId: string, lineIds: Set<string>): boolean {
  const hits = (ep: LinkRow['from']) =>
    (ep.kind === 'factory' && ep.id === factoryId) || (ep.kind === 'line' && lineIds.has(ep.id));
  return hits(link.from) || hits(link.to);
}

function applyPayload(d: WorldDecisions, cmd: CommandEnvelope): void {
  const name = cmd.name;

  switch (name) {
    case 'createWorld': {
      const p = cmd.payload as CreateWorldPayload;
      if (d.world) throw new CommandError('invalid_payload', 'world already exists');
      d.world = {
        id: cmd.world_id,
        name: p.name,
        save_identifier: null,
        reference_dataset_id: p.reference_dataset_id,
        origin: p.origin,
        created_at: cmd.at,
        updated_at: cmd.at,
      };
      break;
    }
    case 'renameWorld': {
      requireWorld(d);
      const p = cmd.payload as { name: string };
      d.world!.name = p.name;
      d.world!.updated_at = cmd.at;
      break;
    }
    case 'linkSave': {
      requireWorld(d);
      const p = cmd.payload as { save_identifier: string };
      d.world!.save_identifier = p.save_identifier;
      d.world!.updated_at = cmd.at;
      break;
    }
    case 'deleteWorld': {
      d.world = null;
      d.manual_world = null;
      d.factories = [];
      d.membership_overrides = [];
      d.lines = [];
      d.line_overrides = [];
      d.links = [];
      d.storage_roles = [];
      d.audit_dismissals = [];
      d.favorites = null;
      d.metric_history = [];
      d.drafts = [];
      break;
    }
    case 'createFactory': {
      requireWorld(d);
      const p = cmd.payload as CreateFactoryPayload;
      if (d.factories.some((f) => f.id === p.id)) {
        throw new CommandError('invalid_payload', `factory ${p.id} already exists`);
      }
      d.factories.push({
        id: p.id,
        world_id: cmd.world_id,
        name: p.name,
        color: p.color,
        status: p.status,
        tier: p.tier,
        tagline: p.tagline,
        tags: p.tags,
        cover: p.cover,
        notes: '',
        polygon: null,
        legacy_pin_percent: null,
        floor_settings: { mode: 'auto' },
        favorite_items: [],
        import_order: [],
        export_order: [],
        created_at: cmd.at,
        updated_at: cmd.at,
      });
      break;
    }
    case 'updateFactoryMeta': {
      const p = cmd.payload as { factory_id: string; patch: Partial<FactoryRow> };
      const f = requireFactory(d, p.factory_id);
      Object.assign(f, p.patch);
      f.updated_at = cmd.at;
      break;
    }
    case 'drawFactoryShape': {
      const p = cmd.payload as { factory_id: string; points: PointCm[] };
      const f = requireFactory(d, p.factory_id);
      if (f.polygon !== null) throw new CommandError('invalid_payload', 'factory already has a polygon');
      validatePolygon(p.points);
      f.polygon = p.points;
      f.updated_at = cmd.at;
      break;
    }
    case 'editFactoryShape': {
      const p = cmd.payload as { factory_id: string; points: PointCm[] };
      const f = requireFactory(d, p.factory_id);
      if (f.polygon === null) throw new CommandError('missing_target', 'factory has no polygon');
      validatePolygon(p.points);
      f.polygon = p.points;
      f.updated_at = cmd.at;
      break;
    }
    case 'clearFactoryShape': {
      const p = cmd.payload as { factory_id: string };
      const f = requireFactory(d, p.factory_id);
      f.polygon = null;
      f.updated_at = cmd.at;
      break;
    }
    case 'setFloorSettings': {
      const p = cmd.payload as { factory_id: string; floor_settings: FactoryRow['floor_settings'] };
      const f = requireFactory(d, p.factory_id);
      f.floor_settings = p.floor_settings;
      f.updated_at = cmd.at;
      break;
    }
    case 'deleteFactory': {
      const p = cmd.payload as { factory_id: string };
      requireFactory(d, p.factory_id);
      const lineIds = new Set(d.lines.filter((l) => l.factory_id === p.factory_id).map((l) => l.id));
      d.factories = d.factories.filter((f) => f.id !== p.factory_id);
      d.membership_overrides = d.membership_overrides.filter((m) => m.factory_id !== p.factory_id);
      d.lines = d.lines.filter((l) => l.factory_id !== p.factory_id);
      d.line_overrides = d.line_overrides.filter((o) => !lineIds.has(o.line_id));
      d.links = d.links.filter((l) => !linkTouchesFactoryOrLine(l, p.factory_id, lineIds));
      break;
    }
    case 'includeMachine':
    case 'excludeMachine': {
      const p = cmd.payload as { id: string; factory_id: string; machine_key: string };
      requireFactory(d, p.factory_id);
      const kind = name === 'includeMachine' ? 'include' : 'exclude';
      const idx = d.membership_overrides.findIndex(
        (m) => m.factory_id === p.factory_id && m.machine_key === p.machine_key,
      );
      const row = { id: p.id, world_id: cmd.world_id, factory_id: p.factory_id, machine_key: p.machine_key, kind };
      if (idx >= 0) d.membership_overrides[idx] = row as (typeof d.membership_overrides)[0];
      else d.membership_overrides.push(row as (typeof d.membership_overrides)[0]);
      break;
    }
    case 'clearMachineOverride': {
      const p = cmd.payload as { factory_id: string; machine_key: string };
      const before = d.membership_overrides.length;
      d.membership_overrides = d.membership_overrides.filter(
        (m) => !(m.factory_id === p.factory_id && m.machine_key === p.machine_key),
      );
      if (d.membership_overrides.length === before) {
        throw new CommandError('missing_target', 'membership override not found');
      }
      break;
    }
    case 'confirmLine': {
      const p = cmd.payload as ConfirmLinePayload;
      requireFactory(d, p.factory_id);
      d.lines.push({
        id: p.id,
        world_id: cmd.world_id,
        factory_id: p.factory_id,
        name: p.name,
        section_label: p.section_label,
        recipe_short: p.signature.recipe_short,
        member_keys: [...p.member_keys],
        signature: p.signature,
        status: 'confirmed',
        notes: p.notes,
      });
      break;
    }
    case 'renameLine': {
      const p = cmd.payload as { line_id: string; name: string };
      const line = requireLine(d, p.line_id);
      line.name = p.name;
      break;
    }
    case 'splitLine': {
      const p = cmd.payload as SplitLinePayload;
      const source = requireLine(d, p.line_id);
      if (p.keys_a.length === 0 || p.keys_b.length === 0) {
        throw new CommandError('invalid_payload', 'split requires non-empty key sets');
      }
      const base = {
        world_id: source.world_id,
        factory_id: source.factory_id,
        section_label: source.section_label,
        recipe_short: source.recipe_short,
        signature: source.signature,
        status: 'confirmed' as const,
        notes: source.notes,
      };
      d.lines = d.lines.filter((l) => l.id !== p.line_id);
      d.lines.push(
        { ...base, id: p.id_a, name: `${source.name} (A)`, member_keys: [...p.keys_a] },
        { ...base, id: p.id_b, name: `${source.name} (B)`, member_keys: [...p.keys_b] },
      );
      break;
    }
    case 'mergeLines': {
      const p = cmd.payload as MergeLinesPayload;
      const lines = p.line_ids.map((lineId: string) => requireLine(d, lineId));
      const keeper = lines[0];
      const memberKeys = new Set<string>();
      lines.forEach((l: LineRow) => l.member_keys.forEach((k: string) => memberKeys.add(k)));
      keeper.member_keys = [...memberKeys];
      const drop = new Set(p.line_ids.slice(1));
      d.lines = d.lines.filter((l) => !drop.has(l.id));
      break;
    }
    case 'assignMachineToLine':
    case 'removeMachineFromLine': {
      const p = cmd.payload as { id: string; machine_key: string; line_id: string };
      requireLine(d, p.line_id);
      const kind = name === 'assignMachineToLine' ? 'assign' : 'exclude';
      const idx = d.line_overrides.findIndex((o) => o.machine_key === p.machine_key && o.line_id === p.line_id);
      const row = { id: p.id, world_id: cmd.world_id, machine_key: p.machine_key, line_id: p.line_id, kind };
      if (idx >= 0) d.line_overrides[idx] = row as (typeof d.line_overrides)[0];
      else d.line_overrides.push(row as (typeof d.line_overrides)[0]);
      break;
    }
    case 'archiveLine': {
      const p = cmd.payload as { line_id: string };
      requireLine(d, p.line_id).status = 'archived';
      break;
    }
    case 'confirmLink': {
      const p = cmd.payload as ConfirmLinkPayload;
      d.links.push({
        id: p.id,
        world_id: cmd.world_id,
        from: p.from,
        to: p.to,
        item_short: p.item_short,
        medium: p.medium,
        via_vehicle_key: p.via_vehicle_key,
        rate_override: p.rate_override,
        status: 'confirmed',
      });
      break;
    }
    case 'rejectLink': {
      const p = cmd.payload as { link_id: string };
      requireLink(d, p.link_id).status = 'rejected';
      break;
    }
    case 'setLinkRateOverride': {
      const p = cmd.payload as { link_id: string; rate_override: LinkRow['rate_override'] };
      requireLink(d, p.link_id).rate_override = p.rate_override;
      break;
    }
    case 'setStorageRole': {
      const p = cmd.payload as { id: string; machine_key: string; role: 'pass_through' | 'endpoint' };
      const idx = d.storage_roles.findIndex((r) => r.machine_key === p.machine_key);
      const row = { id: p.id, world_id: cmd.world_id, machine_key: p.machine_key, role: p.role };
      if (idx >= 0) d.storage_roles[idx] = row;
      else d.storage_roles.push(row);
      break;
    }
    case 'dismissAuditItem': {
      const p = cmd.payload as { id: string; fingerprint: string };
      d.audit_dismissals.push({
        id: p.id,
        world_id: cmd.world_id,
        fingerprint: p.fingerprint,
        dismissed_at: cmd.at,
      });
      break;
    }
    case 'undismissAuditItem': {
      const p = cmd.payload as { fingerprint: string };
      const before = d.audit_dismissals.length;
      d.audit_dismissals = d.audit_dismissals.filter((a) => a.fingerprint !== p.fingerprint);
      if (d.audit_dismissals.length === before) {
        throw new CommandError('missing_target', 'audit dismissal not found');
      }
      break;
    }
    case 'saveDraft': {
      const p = cmd.payload as SaveDraftPayload;
      const snapshot = decisionsForDraft(d);
      const draft: DraftRow = {
        id: p.id,
        world_id: cmd.world_id,
        name: p.name,
        created_at: cmd.at,
        based_on_snapshot: p.based_on_snapshot ?? null,
        decisions: snapshot,
      };
      d.drafts.push(draft);
      break;
    }
    case 'restoreDraft': {
      const p = cmd.payload as { draft_id: string };
      const draft = d.drafts.find((x) => x.id === p.draft_id);
      if (!draft) throw new CommandError('missing_target', `draft ${p.draft_id} not found`);
      const keptDrafts = d.drafts;
      const restored = cloneWorldDecisions(draft.decisions);
      Object.assign(d, restored);
      d.drafts = keptDrafts;
      break;
    }
    case 'deleteDraft': {
      const p = cmd.payload as { draft_id: string };
      const before = d.drafts.length;
      d.drafts = d.drafts.filter((x) => x.id !== p.draft_id);
      if (d.drafts.length === before) throw new CommandError('missing_target', `draft ${p.draft_id} not found`);
      break;
    }
    case 'toggleFavoriteItem': {
      const p = cmd.payload as { item: string };
      if (!d.favorites) d.favorites = { world_id: cmd.world_id, items: [], factories: [] };
      const i = d.favorites.items.indexOf(p.item);
      if (i >= 0) d.favorites.items.splice(i, 1);
      else d.favorites.items.push(p.item);
      break;
    }
    case 'toggleFavoriteFactory': {
      const p = cmd.payload as { factory_id: string };
      if (!d.favorites) d.favorites = { world_id: cmd.world_id, items: [], factories: [] };
      const i = d.favorites.factories.indexOf(p.factory_id);
      if (i >= 0) d.favorites.factories.splice(i, 1);
      else d.favorites.factories.push(p.factory_id);
      break;
    }
    case 'legacyMutation': {
      const p = cmd.payload as LegacyMutationPayload;
      if (d.manual_world) d.manual_world.data = p.after;
      else d.manual_world = { world_id: cmd.world_id, data: p.after };
      if (d.world) d.world.updated_at = cmd.at;
      break;
    }
    default: {
      const _exhaustive: never = name;
      throw new CommandError('unknown_command', `unhandled command ${_exhaustive as string}`);
    }
  }
}

export function apply(decisions: WorldDecisions, command: unknown): WorldDecisions {
  const cmd = parseCommandEnvelope(command);
  if (!(cmd.name in COMMAND_PAYLOAD_SCHEMAS)) {
    throw new CommandError('unknown_command', `unknown command ${cmd.name}`);
  }
  const next = cloneWorldDecisions(decisions);
  applyPayload(next, cmd);
  appendLog(next, cmd);
  return next;
}