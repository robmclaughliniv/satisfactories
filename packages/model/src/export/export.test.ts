import { describe, expect, it } from 'vitest';
import { buildExport, parseExport } from './envelope';
import { webStreamsGzipCodec } from './gzip';
import { emptyWorldDecisions } from '../decisions/tables';
import { SnapshotRowSchema } from '../snapshot/tables';

describe('export', () => {
  const decisions = () => {
    const d = emptyWorldDecisions();
    d.world = {
      id: 'w1',
      name: 'One',
      save_identifier: null,
      reference_dataset_id: null,
      origin: 'manual',
      created_at: '2020-01-01T00:00:00.000Z',
      updated_at: '2020-01-01T00:00:00.000Z',
    };
    return d;
  };

  it('round-trips without snapshot', () => {
    const built = buildExport({
      appVersion: '0.1.0',
      exportedAt: '2020-01-01T00:00:00.000Z',
      reference: { datasetId: 'default' },
      worlds: [{ decisions: decisions(), snapshot: null }],
    });
    const parsed = parseExport(built);
    expect(parsed.worlds[0].world.id).toBe('w1');
    expect(parsed.worlds[0].snapshot).toBeNull();
  });

  it('round-trips with snapshot tables', () => {
    const snapRow = SnapshotRowSchema.parse({
      id: 'snap1',
      imported_at: '2020-01-01T00:00:00.000Z',
      save_identifier: 'sid',
      session_name: 's',
      save_name: 'n',
      header_version: 1,
      save_version: 1,
      build_version: '1.0',
      save_data_hash: 'hash',
      file_size: 1,
      file_mtime: '2020',
      play_seconds: 0,
      save_datetime: '2020',
      is_creative: false,
      has_mods: false,
      parse_ms: 1,
      warning_count: 0,
      partial_count: 0,
      status: 'current',
    });
    const built = buildExport({
      appVersion: '0.1.0',
      exportedAt: '2020-01-01T00:00:00.000Z',
      reference: { datasetId: 'default' },
      worlds: [
        {
          decisions: decisions(),
          snapshot: { snapshot: snapRow, tables: { meta: [{ key: 'snapshot_schema_version', value: '1' }] } },
        },
      ],
    });
    const parsed = parseExport(built);
    expect(parsed.worlds[0].snapshot?.tables.meta).toHaveLength(1);
  });

  it('gzip round-trip', async () => {
    const json = JSON.stringify(
      buildExport({
        appVersion: '0.1.0',
        exportedAt: '2020-01-01T00:00:00.000Z',
        reference: { datasetId: 'default' },
        worlds: [{ decisions: decisions(), snapshot: null }],
      }),
    );
    const bytes = new TextEncoder().encode(json);
    const compressed = await webStreamsGzipCodec.compress(bytes);
    const plain = await webStreamsGzipCodec.decompress(compressed);
    const parsed = parseExport(JSON.parse(new TextDecoder().decode(plain)));
    expect(parsed.format).toBe('satisfactories-export');
  });
});