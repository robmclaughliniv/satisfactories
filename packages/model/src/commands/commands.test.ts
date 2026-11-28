import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { COMMAND_SCHEMA_VERSION } from '../versions';
import { emptyWorldDecisions, cloneWorldDecisions, type WorldDecisions } from '../decisions/tables';
import { apply } from './apply';
import { replay } from './replay';
import { CommandError } from './error';
import type { CommandEnvelope } from './envelope';
import { COMMAND_NAMES, type CommandName } from './names';

const WORLD = 'w_cmd';

function env(
  name: CommandName,
  payload: unknown,
  opts: { worldId?: string; at?: string; id?: string } = {},
): CommandEnvelope {
  const worldId = opts.worldId ?? WORLD;
  return {
    id: opts.id ?? `cmd_${name}`,
    name,
    v: COMMAND_SCHEMA_VERSION,
    world_id: worldId,
    at: opts.at ?? '2020-01-01T00:00:00.000Z',
    payload,
  };
}

function withWorld(worldId = WORLD): WorldDecisions {
  const d = emptyWorldDecisions();
  d.world = {
    id: worldId,
    name: 'Test',
    save_identifier: null,
    reference_dataset_id: null,
    origin: 'manual',
    created_at: '2020-01-01T00:00:00.000Z',
    updated_at: '2020-01-01T00:00:00.000Z',
  };
  return d;
}

function factoryPayload(id = 'f1') {
  return {
    id,
    name: 'Plant',
    color: '#fff',
    status: 'planned' as const,
    tier: 't',
    tagline: '',
    tags: [] as string[],
    cover: '',
  };
}

const square = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
  { x: 0, y: 100 },
];

const bowTie = [
  { x: 0, y: 0 },
  { x: 100, y: 100 },
  { x: 100, y: 0 },
  { x: 0, y: 100 },
];

function withFactory(d: WorldDecisions, id = 'f1'): WorldDecisions {
  return apply(d, env('createFactory', factoryPayload(id)));
}

function withLine(d: WorldDecisions, lineId = 'line1', factoryId = 'f1'): WorldDecisions {
  return apply(
    d,
    env('confirmLine', {
      id: lineId,
      factory_id: factoryId,
      suggestion_fingerprint: 'fp',
      name: 'Line',
      section_label: 'S',
      member_keys: ['m1'],
      signature: { recipe_short: 'R', input_endpoints: [], output_endpoints: [] },
      notes: '',
    }),
  );
}

function withLink(d: WorldDecisions, linkId = 'link1', lineId = 'line1'): WorldDecisions {
  return apply(
    d,
    env('confirmLink', {
      id: linkId,
      suggestion_fingerprint: 'lfp',
      from: { kind: 'line', id: lineId },
      to: { kind: 'factory', id: 'f1' },
      item_short: 'IronPlate',
      medium: 'belt',
      via_vehicle_key: null,
      rate_override: null,
    }),
  );
}

const manualWorld = {
  id: WORLD,
  name: 'Manual',
  factories: [],
  routes: [],
  stations: [],
  resourceMetricHistory: [],
  createdAt: '2020-01-01T00:00:00.000Z',
  updatedAt: '2020-01-01T00:00:00.000Z',
};

describe('apply', () => {
  it('rejects unknown command names', () => {
    const d = withWorld();
    expect(() =>
      apply(d, { id: 'x', name: 'notACommand', v: 1, world_id: WORLD, at: '2020', payload: {} }),
    ).toThrow(CommandError);
  });

  it('rejects invalid command version', () => {
    const d = withWorld();
    expect(() =>
      apply(d, { id: 'x', name: 'renameWorld', v: 99, world_id: WORLD, at: '2020', payload: { name: 'X' } }),
    ).toThrow(CommandError);
  });

  it('is pure: same commands yield deep-equal output and leave input unchanged', () => {
    const base = withWorld();
    const cmds = [env('createFactory', factoryPayload()), env('toggleFavoriteItem', { item: 'Iron Ore' })];
    const snapshotIn = cloneWorldDecisions(base);
    const once = replay(base, cmds);
    const twice = replay(base, cmds);
    expect(once).toEqual(twice);
    expect(base).toEqual(snapshotIn);
  });

  it('apply.ts does not use Date or randomUUID', () => {
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'apply.ts');
    const src = readFileSync(root, 'utf8');
    expect(src).not.toMatch(/\bDate\b/);
    expect(src).not.toMatch(/randomUUID/);
  });
});

describe('per-command apply', () => {
  it.each(COMMAND_NAMES)('%s is a registered command', (name) => {
    expect(name.length).toBeGreaterThan(0);
  });

  describe('createWorld', () => {
    it('happy path', () => {
      const d = apply(emptyWorldDecisions(), env('createWorld', { name: 'NS', origin: 'manual', reference_dataset_id: null }));
      expect(d.world?.id).toBe(WORLD);
      expect(d.world?.name).toBe('NS');
    });
    it('rejects when world already exists', () => {
      expect(() =>
        apply(withWorld(), env('createWorld', { name: 'X', origin: 'manual', reference_dataset_id: null })),
      ).toThrow(CommandError);
    });
  });

  describe('renameWorld', () => {
    it('happy path', () => {
      const d = apply(withWorld(), env('renameWorld', { name: 'Renamed' }));
      expect(d.world?.name).toBe('Renamed');
    });
    it('rejects when world row is missing', () => {
      expect(() => apply(emptyWorldDecisions(), env('renameWorld', { name: 'X' }))).toThrow(CommandError);
    });
  });

  describe('linkSave', () => {
    it('happy path', () => {
      const d = apply(withWorld(), env('linkSave', { save_identifier: 'save:abc' }));
      expect(d.world?.save_identifier).toBe('save:abc');
    });
    it('rejects invalid payload', () => {
      expect(() => apply(withWorld(), env('linkSave', {}))).toThrow(CommandError);
    });
  });

  describe('deleteWorld', () => {
    it('happy path', () => {
      const d = apply(withFactory(withWorld()), env('deleteWorld', {}));
      expect(d.world).toBeNull();
      expect(d.factories).toHaveLength(0);
    });
    it('rejects non-object payload', () => {
      expect(() => apply(withWorld(), env('deleteWorld', null))).toThrow(CommandError);
    });
  });

  describe('createFactory', () => {
    it('happy path', () => {
      const d = withFactory(withWorld());
      expect(d.factories[0].name).toBe('Plant');
    });
    it('rejects duplicate factory id', () => {
      const d = withFactory(withWorld());
      expect(() => apply(d, env('createFactory', factoryPayload()))).toThrow(CommandError);
    });
  });

  describe('updateFactoryMeta', () => {
    it('happy path', () => {
      const d = apply(withFactory(withWorld()), env('updateFactoryMeta', { factory_id: 'f1', patch: { name: 'New' } }));
      expect(d.factories[0].name).toBe('New');
    });
    it('rejects empty patch', () => {
      expect(() =>
        apply(withFactory(withWorld()), env('updateFactoryMeta', { factory_id: 'f1', patch: {} })),
      ).toThrow(CommandError);
    });
  });

  describe('drawFactoryShape', () => {
    it('happy path', () => {
      const d = apply(withFactory(withWorld()), env('drawFactoryShape', { factory_id: 'f1', points: square }));
      expect(d.factories[0].polygon).toHaveLength(4);
    });
    it('rejects self-intersecting polygon', () => {
      expect(() =>
        apply(withFactory(withWorld()), env('drawFactoryShape', { factory_id: 'f1', points: bowTie })),
      ).toThrow(CommandError);
    });
  });

  describe('editFactoryShape', () => {
    it('happy path', () => {
      let d = apply(withFactory(withWorld()), env('drawFactoryShape', { factory_id: 'f1', points: square }));
      d = apply(d, env('editFactoryShape', { factory_id: 'f1', points: [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 25, y: 50 }] }));
      expect(d.factories[0].polygon).toHaveLength(3);
    });
    it('rejects when factory has no polygon', () => {
      expect(() =>
        apply(
          withFactory(withWorld()),
          env('editFactoryShape', { factory_id: 'f1', points: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }] }),
        ),
      ).toThrow(CommandError);
    });
  });

  describe('clearFactoryShape', () => {
    it('happy path', () => {
      let d = apply(withFactory(withWorld()), env('drawFactoryShape', { factory_id: 'f1', points: square }));
      d = apply(d, env('clearFactoryShape', { factory_id: 'f1' }));
      expect(d.factories[0].polygon).toBeNull();
    });
    it('rejects missing factory', () => {
      expect(() => apply(withWorld(), env('clearFactoryShape', { factory_id: 'nope' }))).toThrow(CommandError);
    });
  });

  describe('setFloorSettings', () => {
    it('happy path', () => {
      const d = apply(
        withFactory(withWorld()),
        env('setFloorSettings', { factory_id: 'f1', floor_settings: { mode: 'manual', base_z_cm: 0, floor_height_cm: 400 } }),
      );
      expect(d.factories[0].floor_settings.mode).toBe('manual');
    });
    it('rejects missing factory', () => {
      expect(() =>
        apply(withWorld(), env('setFloorSettings', { factory_id: 'nope', floor_settings: { mode: 'auto' } })),
      ).toThrow(CommandError);
    });
  });

  describe('deleteFactory', () => {
    it('happy path', () => {
      const d = apply(withFactory(withWorld()), env('deleteFactory', { factory_id: 'f1' }));
      expect(d.factories).toHaveLength(0);
    });
    it('rejects missing factory', () => {
      expect(() => apply(withWorld(), env('deleteFactory', { factory_id: 'nope' }))).toThrow(CommandError);
    });
  });

  describe('includeMachine', () => {
    it('happy path', () => {
      const d = apply(
        withFactory(withWorld()),
        env('includeMachine', { id: 'mo1', factory_id: 'f1', machine_key: 'mk1' }),
      );
      expect(d.membership_overrides[0].kind).toBe('include');
    });
    it('rejects missing factory', () => {
      expect(() =>
        apply(withWorld(), env('includeMachine', { id: 'mo1', factory_id: 'nope', machine_key: 'mk1' })),
      ).toThrow(CommandError);
    });
  });

  describe('excludeMachine', () => {
    it('happy path', () => {
      const d = apply(
        withFactory(withWorld()),
        env('excludeMachine', { id: 'mo1', factory_id: 'f1', machine_key: 'mk1' }),
      );
      expect(d.membership_overrides[0].kind).toBe('exclude');
    });
    it('rejects missing factory', () => {
      expect(() =>
        apply(withWorld(), env('excludeMachine', { id: 'mo1', factory_id: 'nope', machine_key: 'mk1' })),
      ).toThrow(CommandError);
    });
  });

  describe('clearMachineOverride', () => {
    it('happy path', () => {
      let d = apply(
        withFactory(withWorld()),
        env('includeMachine', { id: 'mo1', factory_id: 'f1', machine_key: 'mk1' }),
      );
      d = apply(d, env('clearMachineOverride', { factory_id: 'f1', machine_key: 'mk1' }));
      expect(d.membership_overrides).toHaveLength(0);
    });
    it('rejects when override absent', () => {
      expect(() =>
        apply(withFactory(withWorld()), env('clearMachineOverride', { factory_id: 'f1', machine_key: 'mk1' })),
      ).toThrow(CommandError);
    });
  });

  describe('confirmLine', () => {
    it('happy path', () => {
      const d = withLine(withFactory(withWorld()));
      expect(d.lines[0].status).toBe('confirmed');
    });
    it('rejects missing factory', () => {
      expect(() =>
        apply(
          withWorld(),
          env('confirmLine', {
            id: 'line1',
            factory_id: 'nope',
            suggestion_fingerprint: 'fp',
            name: 'L',
            section_label: 'S',
            member_keys: [],
            signature: { recipe_short: 'R', input_endpoints: [], output_endpoints: [] },
            notes: '',
          }),
        ),
      ).toThrow(CommandError);
    });
  });

  describe('renameLine', () => {
    it('happy path', () => {
      const d = apply(withLine(withFactory(withWorld())), env('renameLine', { line_id: 'line1', name: 'Smelters' }));
      expect(d.lines[0].name).toBe('Smelters');
    });
    it('rejects missing line', () => {
      expect(() => apply(withFactory(withWorld()), env('renameLine', { line_id: 'nope', name: 'X' }))).toThrow(
        CommandError,
      );
    });
  });

  describe('splitLine', () => {
    it('happy path', () => {
      let d = withFactory(withWorld());
      d = apply(
        d,
        env('confirmLine', {
          id: 'line1',
          factory_id: 'f1',
          suggestion_fingerprint: 'fp',
          name: 'L',
          section_label: 'S',
          member_keys: ['a', 'b'],
          signature: { recipe_short: 'R', input_endpoints: [], output_endpoints: [] },
          notes: '',
        }),
      );
      d = apply(d, env('splitLine', { line_id: 'line1', id_a: 'la', id_b: 'lb', keys_a: ['a'], keys_b: ['b'] }));
      expect(d.lines).toHaveLength(2);
    });
    it('rejects empty key set', () => {
      const d = withLine(withFactory(withWorld()));
      expect(() =>
        apply(d, env('splitLine', { line_id: 'line1', id_a: 'la', id_b: 'lb', keys_a: [], keys_b: ['m1'] })),
      ).toThrow(CommandError);
    });
  });

  describe('mergeLines', () => {
    it('happy path', () => {
      let d = withLine(withFactory(withWorld()), 'l1');
      d = apply(
        d,
        env('confirmLine', {
          id: 'l2',
          factory_id: 'f1',
          suggestion_fingerprint: 'fp2',
          name: 'L2',
          section_label: 'S',
          member_keys: ['m2'],
          signature: { recipe_short: 'R', input_endpoints: [], output_endpoints: [] },
          notes: '',
        }),
      );
      d = apply(d, env('mergeLines', { line_ids: ['l1', 'l2'] }));
      expect(d.lines).toHaveLength(1);
      expect(d.lines[0].member_keys).toEqual(expect.arrayContaining(['m1', 'm2']));
    });
    it('rejects fewer than two line ids', () => {
      expect(() => apply(withLine(withFactory(withWorld())), env('mergeLines', { line_ids: ['line1'] }))).toThrow(
        CommandError,
      );
    });
  });

  describe('assignMachineToLine', () => {
    it('happy path', () => {
      const d = apply(
        withLine(withFactory(withWorld())),
        env('assignMachineToLine', { id: 'lo1', machine_key: 'mk', line_id: 'line1' }),
      );
      expect(d.line_overrides[0].kind).toBe('assign');
    });
    it('rejects missing line', () => {
      expect(() =>
        apply(
          withFactory(withWorld()),
          env('assignMachineToLine', { id: 'lo1', machine_key: 'mk', line_id: 'nope' }),
        ),
      ).toThrow(CommandError);
    });
  });

  describe('removeMachineFromLine', () => {
    it('happy path', () => {
      const d = apply(
        withLine(withFactory(withWorld())),
        env('removeMachineFromLine', { id: 'lo1', machine_key: 'mk', line_id: 'line1' }),
      );
      expect(d.line_overrides[0].kind).toBe('exclude');
    });
    it('rejects missing line', () => {
      expect(() =>
        apply(
          withFactory(withWorld()),
          env('removeMachineFromLine', { id: 'lo1', machine_key: 'mk', line_id: 'nope' }),
        ),
      ).toThrow(CommandError);
    });
  });

  describe('archiveLine', () => {
    it('happy path', () => {
      const d = apply(withLine(withFactory(withWorld())), env('archiveLine', { line_id: 'line1' }));
      expect(d.lines[0].status).toBe('archived');
    });
    it('rejects missing line', () => {
      expect(() => apply(withFactory(withWorld()), env('archiveLine', { line_id: 'nope' }))).toThrow(CommandError);
    });
  });

  describe('confirmLink', () => {
    it('happy path', () => {
      const d = withLink(withLine(withFactory(withWorld())));
      expect(d.links[0].status).toBe('confirmed');
    });
    it('rejects invalid payload', () => {
      expect(() => apply(withWorld(), env('confirmLink', { id: 'link1' }))).toThrow(CommandError);
    });
  });

  describe('rejectLink', () => {
    it('happy path', () => {
      const d = apply(withLink(withLine(withFactory(withWorld()))), env('rejectLink', { link_id: 'link1' }));
      expect(d.links[0].status).toBe('rejected');
    });
    it('rejects missing link', () => {
      expect(() => apply(withWorld(), env('rejectLink', { link_id: 'nope' }))).toThrow(CommandError);
    });
  });

  describe('setLinkRateOverride', () => {
    it('happy path', () => {
      const d = apply(
        withLink(withLine(withFactory(withWorld()))),
        env('setLinkRateOverride', { link_id: 'link1', rate_override: 30 as never }),
      );
      expect(d.links[0].rate_override).toBe(30);
    });
    it('rejects missing link', () => {
      expect(() => apply(withWorld(), env('setLinkRateOverride', { link_id: 'nope', rate_override: null }))).toThrow(
        CommandError,
      );
    });
  });

  describe('setStorageRole', () => {
    it('happy path', () => {
      const d = apply(withWorld(), env('setStorageRole', { id: 'sr1', machine_key: 'mk1', role: 'endpoint' }));
      expect(d.storage_roles[0].role).toBe('endpoint');
    });
    it('rejects invalid role', () => {
      expect(() =>
        apply(withWorld(), env('setStorageRole', { id: 'sr1', machine_key: 'mk1', role: 'invalid' })),
      ).toThrow(CommandError);
    });
  });

  describe('dismissAuditItem', () => {
    it('happy path', () => {
      const d = apply(withWorld(), env('dismissAuditItem', { id: 'ad1', fingerprint: 'afp' }));
      expect(d.audit_dismissals).toHaveLength(1);
    });
    it('rejects invalid payload', () => {
      expect(() => apply(withWorld(), env('dismissAuditItem', { id: 'ad1' }))).toThrow(CommandError);
    });
  });

  describe('undismissAuditItem', () => {
    it('happy path', () => {
      let d = apply(withWorld(), env('dismissAuditItem', { id: 'ad1', fingerprint: 'afp' }));
      d = apply(d, env('undismissAuditItem', { fingerprint: 'afp' }));
      expect(d.audit_dismissals).toHaveLength(0);
    });
    it('rejects missing dismissal', () => {
      expect(() => apply(withWorld(), env('undismissAuditItem', { fingerprint: 'nope' }))).toThrow(CommandError);
    });
  });

  describe('saveDraft', () => {
    it('happy path', () => {
      const d = apply(withFactory(withWorld()), env('saveDraft', { id: 'draft1', name: 'Baseline' }));
      expect(d.drafts[0].name).toBe('Baseline');
    });
    it('rejects invalid payload', () => {
      expect(() => apply(withWorld(), env('saveDraft', { name: 'no id' }))).toThrow(CommandError);
    });
  });

  describe('restoreDraft', () => {
    it('happy path', () => {
      let d = withLine(withFactory(withWorld()));
      d = apply(d, env('saveDraft', { id: 'draft1', name: 'Baseline' }));
      d = apply(d, env('renameLine', { line_id: 'line1', name: 'Changed' }));
      d = apply(d, env('restoreDraft', { draft_id: 'draft1' }));
      expect(d.lines[0].name).toBe('Line');
    });
    it('rejects missing draft', () => {
      expect(() => apply(withWorld(), env('restoreDraft', { draft_id: 'nope' }))).toThrow(CommandError);
    });
  });

  describe('deleteDraft', () => {
    it('happy path', () => {
      let d = apply(withWorld(), env('saveDraft', { id: 'draft1', name: 'Baseline' }));
      d = apply(d, env('deleteDraft', { draft_id: 'draft1' }));
      expect(d.drafts).toHaveLength(0);
    });
    it('rejects missing draft', () => {
      expect(() => apply(withWorld(), env('deleteDraft', { draft_id: 'nope' }))).toThrow(CommandError);
    });
  });

  describe('toggleFavoriteItem', () => {
    it('happy path', () => {
      let d = apply(withWorld(), env('toggleFavoriteItem', { item: 'Iron Ore' }));
      expect(d.favorites?.items).toContain('Iron Ore');
      d = apply(d, env('toggleFavoriteItem', { item: 'Iron Ore' }));
      expect(d.favorites?.items).not.toContain('Iron Ore');
    });
    it('rejects invalid payload', () => {
      expect(() => apply(withWorld(), env('toggleFavoriteItem', {}))).toThrow(CommandError);
    });
  });

  describe('toggleFavoriteFactory', () => {
    it('happy path', () => {
      const d = apply(withFactory(withWorld()), env('toggleFavoriteFactory', { factory_id: 'f1' }));
      expect(d.favorites?.factories).toContain('f1');
    });
    it('rejects invalid payload', () => {
      expect(() => apply(withWorld(), env('toggleFavoriteFactory', {}))).toThrow(CommandError);
    });
  });

  describe('legacyMutation', () => {
    it('happy path', () => {
      const d = apply(
        withWorld(),
        env('legacyMutation', { description: 'edit', before_hash: 'h0', after: manualWorld }),
      );
      expect(d.manual_world?.data.name).toBe('Manual');
    });
    it('rejects invalid world payload', () => {
      expect(() =>
        apply(withWorld(), env('legacyMutation', { description: 'x', before_hash: 'h', after: { bad: true } })),
      ).toThrow(CommandError);
    });
  });
});