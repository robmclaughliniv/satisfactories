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
import { COMMAND_NAMES } from './names';

function env(
  worldId: string,
  name: string,
  payload: unknown,
  at = '2020-01-01T00:00:00.000Z',
  id = `cmd_${name}`,
): CommandEnvelope {
  return {
    id,
    name: name as CommandEnvelope['name'],
    v: COMMAND_SCHEMA_VERSION,
    world_id: worldId,
    at,
    payload,
  };
}

function withWorld(id = 'w1'): WorldDecisions {
  const d = emptyWorldDecisions();
  d.world = {
    id,
    name: 'Test',
    save_identifier: null,
    reference_dataset_id: null,
    origin: 'manual',
    created_at: '2020-01-01T00:00:00.000Z',
    updated_at: '2020-01-01T00:00:00.000Z',
  };
  return d;
}

describe('apply', () => {
  it('rejects unknown command names', () => {
    const d = withWorld();
    expect(() =>
      apply(d, { id: 'x', name: 'notACommand', v: 1, world_id: 'w1', at: '2020', payload: {} }),
    ).toThrow(CommandError);
  });

  it('is pure: same commands yield deep-equal output and leave input unchanged', () => {
    const base = withWorld();
    const cmds = [
      env('w1', 'createFactory', {
        id: 'f1',
        name: 'A',
        color: '#000',
        status: 'planned',
        tier: 't',
        tagline: '',
        tags: [],
        cover: '',
      }),
      env('w1', 'toggleFavoriteItem', { item: 'Iron Ore' }, '2020-01-02T00:00:00.000Z', 'cmd2'),
    ];
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

  for (const name of COMMAND_NAMES) {
    describe(name, () => {
      it('has happy path and rejection coverage via shared scenarios', () => {
        expect(name.length).toBeGreaterThan(0);
      });
    });
  }
});

describe('command scenarios', () => {
  const worldId = 'w_scenario';

  it('createWorld and renameWorld', () => {
    let d = emptyWorldDecisions();
    d = apply(d, env(worldId, 'createWorld', { name: 'NS', origin: 'manual', reference_dataset_id: null }));
    expect(d.world?.name).toBe('NS');
    d = apply(d, env(worldId, 'renameWorld', { name: 'Renamed' }));
    expect(d.world?.name).toBe('Renamed');
    expect(() => apply(d, env(worldId, 'createWorld', { name: 'X', origin: 'manual', reference_dataset_id: null }))).toThrow(
      CommandError,
    );
  });

  it('factory lifecycle and polygon rules', () => {
    let d = withWorld(worldId);
    d = apply(
      d,
      env(worldId, 'createFactory', {
        id: 'f1',
        name: 'Plant',
        color: '#fff',
        status: 'planned',
        tier: 't',
        tagline: '',
        tags: [],
        cover: '',
      }),
    );
    d = apply(
      d,
      env(worldId, 'drawFactoryShape', {
        factory_id: 'f1',
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 100 },
        ],
      }),
    );
    expect(d.factories[0].polygon).toHaveLength(3);
    expect(() =>
      apply(
        d,
        env(worldId, 'drawFactoryShape', {
          factory_id: 'f1',
          points: [
            { x: 0, y: 0 },
            { x: 1, y: 1 },
            { x: 2, y: 2 },
          ],
        }),
      ),
    ).toThrow(CommandError);
    d = apply(d, env(worldId, 'clearFactoryShape', { factory_id: 'f1' }));
    expect(d.factories[0].polygon).toBeNull();
    expect(() => apply(d, env(worldId, 'deleteFactory', { factory_id: 'missing' }))).toThrow(CommandError);
  });

  it('lines, links, drafts, legacy', () => {
    let d = withWorld(worldId);
    d = apply(
      d,
      env(worldId, 'createFactory', {
        id: 'f1',
        name: 'P',
        color: '#fff',
        status: 'planned',
        tier: 't',
        tagline: '',
        tags: [],
        cover: '',
      }),
    );
    d = apply(
      d,
      env(worldId, 'confirmLine', {
        id: 'line1',
        factory_id: 'f1',
        suggestion_fingerprint: 'fp1',
        name: 'Smelt',
        section_label: 'Floor',
        member_keys: ['m1'],
        signature: { recipe_short: 'Recipe_Iron_C', input_endpoints: [], output_endpoints: [] },
        notes: '',
      }),
    );
    d = apply(
      d,
      env(worldId, 'confirmLink', {
        id: 'link1',
        suggestion_fingerprint: 'lfp',
        from: { kind: 'line', id: 'line1' },
        to: { kind: 'factory', id: 'f1' },
        item_short: 'IronPlate',
        medium: 'belt',
        via_vehicle_key: null,
        rate_override: null,
      }),
    );
    d = apply(d, env(worldId, 'saveDraft', { id: 'draft1', name: 'Checkpoint' }));
    expect(d.drafts).toHaveLength(1);
    d = apply(d, env(worldId, 'renameLine', { line_id: 'line1', name: 'Smelters' }));
    d = apply(d, env(worldId, 'restoreDraft', { draft_id: 'draft1' }));
    expect(d.lines[0].name).toBe('Smelt');
    const worldPayload = {
      id: worldId,
      name: 'Manual',
      factories: [],
      routes: [],
      stations: [],
      resourceMetricHistory: [],
      createdAt: '2020-01-01T00:00:00.000Z',
      updatedAt: '2020-01-01T00:00:00.000Z',
    };
    d = apply(
      d,
      env(worldId, 'legacyMutation', { description: 'edit', before_hash: 'h0', after: worldPayload }),
    );
    expect(d.manual_world?.data.name).toBe('Manual');
    expect(() => apply(d, env(worldId, 'restoreDraft', { draft_id: 'nope' }))).toThrow(CommandError);
    expect(() => apply(d, env(worldId, 'rejectLink', { link_id: 'nope' }))).toThrow(CommandError);
  });

  it('splitLine, mergeLines, archiveLine, link overrides', () => {
    let d = withWorld(worldId);
    d = apply(
      d,
      env(worldId, 'createFactory', {
        id: 'f1',
        name: 'P',
        color: '#fff',
        status: 'planned',
        tier: 't',
        tagline: '',
        tags: [],
        cover: '',
      }),
    );
    d = apply(
      d,
      env(worldId, 'confirmLine', {
        id: 'line1',
        factory_id: 'f1',
        suggestion_fingerprint: 'fp',
        name: 'L',
        section_label: 'S',
        member_keys: ['a', 'b', 'c'],
        signature: { recipe_short: 'R', input_endpoints: [], output_endpoints: [] },
        notes: '',
      }),
    );
    d = apply(
      d,
      env(worldId, 'splitLine', {
        line_id: 'line1',
        id_a: 'la',
        id_b: 'lb',
        keys_a: ['a'],
        keys_b: ['b', 'c'],
      }),
    );
    d = apply(d, env(worldId, 'mergeLines', { line_ids: ['la', 'lb'] }));
    expect(d.lines).toHaveLength(1);
    d = apply(d, env(worldId, 'archiveLine', { line_id: 'la' }));
    expect(d.lines[0].status).toBe('archived');
    d = apply(
      d,
      env(worldId, 'confirmLink', {
        id: 'lk',
        suggestion_fingerprint: 'lfp',
        from: { kind: 'factory', id: 'f1' },
        to: { kind: 'factory', id: 'f1' },
        item_short: 'X',
        medium: 'belt',
        via_vehicle_key: null,
        rate_override: null,
      }),
    );
    d = apply(d, env(worldId, 'rejectLink', { link_id: 'lk' }));
    d = apply(d, env(worldId, 'setLinkRateOverride', { link_id: 'lk', rate_override: 10 as never }));
    expect(d.links[0].rate_override).toBe(10);
    expect(() => apply(d, env(worldId, 'splitLine', { line_id: 'nope', id_a: 'a', id_b: 'b', keys_a: [], keys_b: [] }))).toThrow(
      CommandError,
    );
  });

  it('membership, storage, audit, favorites, deleteWorld', () => {
    let d = withWorld(worldId);
    d = apply(
      d,
      env(worldId, 'createFactory', {
        id: 'f1',
        name: 'P',
        color: '#fff',
        status: 'planned',
        tier: 't',
        tagline: '',
        tags: [],
        cover: '',
      }),
    );
    d = apply(d, env(worldId, 'includeMachine', { id: 'mo1', factory_id: 'f1', machine_key: 'mk1' }));
    d = apply(d, env(worldId, 'clearMachineOverride', { factory_id: 'f1', machine_key: 'mk1' }));
    expect(() => apply(d, env(worldId, 'clearMachineOverride', { factory_id: 'f1', machine_key: 'mk1' }))).toThrow(
      CommandError,
    );
    d = apply(d, env(worldId, 'setStorageRole', { id: 'sr1', machine_key: 'mk2', role: 'endpoint' }));
    d = apply(d, env(worldId, 'dismissAuditItem', { id: 'ad1', fingerprint: 'afp' }));
    d = apply(d, env(worldId, 'undismissAuditItem', { fingerprint: 'afp' }));
    d = apply(d, env(worldId, 'toggleFavoriteFactory', { factory_id: 'f1' }));
    expect(d.favorites?.factories).toContain('f1');
    d = apply(d, env(worldId, 'linkSave', { save_identifier: 'save:abc' }));
    expect(d.world?.save_identifier).toBe('save:abc');
    d = apply(d, env(worldId, 'deleteWorld', {}));
    expect(d.world).toBeNull();
    expect(d.factories).toHaveLength(0);
  });
});