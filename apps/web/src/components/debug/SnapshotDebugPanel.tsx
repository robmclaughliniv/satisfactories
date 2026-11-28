import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  RTREE_CATEGORIES,
  SAMPLE_BBOX,
  SYNTHETIC_PRESETS,
  SnapshotLockedError,
  generateSyntheticSnapshot,
  type CategoryCounts,
  type OpenResult,
  type SnapshotRow,
  type StoreStatus,
  type SyntheticPreset,
  type WorldInfo,
  type WriteTimings,
} from '@satisfactories/snapshot-store';
import { getSnapshotStore, publishStatus } from '../../snapshot/store';

// Hidden panel for the Step 4 snapshot store (`?debug=snapshot`). Not in the nav.

const DEFAULT_WORLD = 'debug-synthetic';

type WriteReport = {
  preset: SyntheticPreset;
  generation: number;
  generateMs: number;
  roundTripMs: number;
  timings: WriteTimings;
};

type QueryReport = { label: string; ms: number; result: unknown };

const fmtMs = (ms: number) => `${ms.toFixed(ms < 10 ? 1 : 0)} ms`;
const fmtBytes = (n?: number) => (n === undefined ? '?' : `${(n / 1024 / 1024).toFixed(1)} MiB`);

function generationOf(id: string | undefined): number {
  const m = id ? /-g(\d+)$/.exec(id) : null;
  return m ? Number(m[1]) : -1;
}

function presetOf(id: string | undefined): SyntheticPreset {
  return id?.includes('-large-') ? 'large' : 'small';
}

export default function SnapshotDebugPanel() {
  const store = getSnapshotStore();
  const [open, setOpen] = useState(true);
  const [world, setWorld] = useState(DEFAULT_WORLD);
  const [status, setStatus] = useState<StoreStatus | null>(null);
  const [openResult, setOpenResult] = useState<OpenResult | null>(null);
  const [worlds, setWorlds] = useState<WorldInfo[]>([]);
  const [current, setCurrent] = useState<SnapshotRow | null>(null);
  const [previous, setPrevious] = useState<SnapshotRow | null>(null);
  const [tableCounts, setTableCounts] = useState<Record<string, number> | null>(null);
  const [write, setWrite] = useState<WriteReport | null>(null);
  const [query, setQuery] = useState<QueryReport | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const refresh = useCallback(async () => {
    const s = await store.status();
    setStatus(s);
    publishStatus(s);
    if (s.locked) return;
    setWorlds(await store.listWorlds());
    if (s.openWorld) {
      const cur = await store.getCurrentSnapshot();
      setCurrent(cur);
      setPrevious(await store.getPreviousSnapshot());
      setTableCounts(cur ? await store.tableCounts(cur.id) : null);
    } else {
      setCurrent(null);
      setPrevious(null);
      setTableCounts(null);
    }
  }, [store]);

  const run = useCallback(
    async (label: string, fn: () => Promise<void>) => {
      setBusy(label);
      setError(null);
      try {
        await fn();
      } catch (err) {
        if (err instanceof SnapshotLockedError) {
          setError('Locked: another tab holds the snapshot store.');
        } else {
          setError(`${(err as Error)?.name ?? 'Error'}: ${(err as Error)?.message ?? String(err)}`);
        }
      } finally {
        try {
          await refresh();
        } catch {
          // status already reported above
        }
        setBusy(null);
      }
    },
    [refresh],
  );

  const openWorld = useCallback(
    (id: string) =>
      run(`open ${id}`, async () => {
        setOpenResult(await store.open(id));
      }),
    [run, store],
  );

  useEffect(() => {
    if (started.current) return; // StrictMode runs effects twice in dev
    started.current = true;
    void openWorld(DEFAULT_WORLD);
  }, [openWorld]);

  const writeSynthetic = (preset: SyntheticPreset, generation: number) =>
    run(`write ${preset}`, async () => {
      const g0 = performance.now();
      const { snapshot, tables } = generateSyntheticSnapshot({ saveIdentifier: world, preset, generation });
      const generateMs = performance.now() - g0;
      const r0 = performance.now();
      const timings = await store.writeSnapshot(snapshot, tables);
      setWrite({ preset, generation, generateMs, roundTripMs: performance.now() - r0, timings });
    });

  const timed = (label: string, fn: () => Promise<unknown>) =>
    run(label, async () => {
      const t0 = performance.now();
      const result = await fn();
      setQuery({ label, ms: performance.now() - t0, result });
    });

  const needSnapshot = !current;
  const locked = status?.locked ?? false;

  if (!open) {
    return (
      <button type="button" style={{ ...btn, position: 'fixed', right: 16, top: 16, zIndex: 999 }} onClick={() => setOpen(true)}>
        Snapshot debug
      </button>
    );
  }

  return (
    <aside data-testid="snapshot-debug" style={panel}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 14 }}>Snapshot store (debug)</strong>
        <button type="button" style={btnGhost} onClick={() => setOpen(false)} aria-label="Hide panel">
          ×
        </button>
      </div>

      <Section title="Status">
        {status ? (
          <dl style={dl} data-testid="snapshot-status">
            <Row k="vfs" v={<span data-testid="status-vfs">{status.vfs}</span>} />
            <Row k="persistent" v={<span data-testid="status-persistent">{String(status.persistent)}</span>} />
            <Row k="locked" v={<span data-testid="status-locked">{String(status.locked)}</span>} />
            <Row k="storage.persisted()" v={String(status.storagePersisted)} />
            <Row k="usage / quota" v={`${fmtBytes(status.estimate?.usage)} / ${fmtBytes(status.estimate?.quota)}`} />
            <Row k="sqlite" v={status.sqliteVersion} />
            <Row k="open world" v={<span data-testid="status-open-world">{status.openWorld ?? '—'}</span>} />
            {status.vfsError && <Row k="vfs error" v={status.vfsError} />}
          </dl>
        ) : (
          'Starting…'
        )}
        {openResult?.recreated && (
          <p style={{ color: '#F5882E', margin: '6px 0 0' }}>Schema version changed: DB was recreated, re-import needed.</p>
        )}
      </Section>

      <Section title="World">
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={world}
            onChange={(e) => setWorld(e.target.value)}
            style={{ flex: 1, ...input }}
            aria-label="Save identifier"
          />
          <button type="button" style={btn} disabled={!!busy || locked || !world} onClick={() => void openWorld(world)}>
            Open
          </button>
        </div>
        <ul style={{ margin: '6px 0 0', paddingLeft: 16 }} data-testid="world-list">
          {worlds.length === 0 && <li style={{ color: '#9AA0AA' }}>No DB files</li>}
          {worlds.map((w) => (
            <li key={w.path}>
              {w.saveIdentifier} <span style={{ color: '#6B7280' }}>{w.path}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Snapshots">
        <dl style={dl}>
          <Row k="current" v={<span data-testid="current-snapshot">{current?.id ?? '—'}</span>} />
          <Row k="previous" v={<span data-testid="previous-snapshot">{previous?.id ?? '—'}</span>} />
        </dl>
        {tableCounts && (
          <dl style={{ ...dl, marginTop: 6 }} data-testid="table-counts">
            {Object.entries(tableCounts)
              .filter(([, n]) => n > 0)
              .map(([t, n]) => (
                <Row key={t} k={t} v={<span data-testid={`count-${t}`}>{n.toLocaleString('en-US')}</span>} />
              ))}
          </dl>
        )}
      </Section>

      <Section title="Actions">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {(Object.keys(SYNTHETIC_PRESETS) as SyntheticPreset[]).map((p) => (
            <button
              key={p}
              type="button"
              style={btn}
              data-testid={`write-${p}`}
              disabled={!!busy || locked || !status?.openWorld}
              onClick={() => void writeSynthetic(p, 0)}
              title={`${SYNTHETIC_PRESETS[p].buildables.toLocaleString('en-US')} buildables`}
            >
              Write {p}
            </button>
          ))}
          <button
            type="button"
            style={btn}
            data-testid="write-again"
            disabled={!!busy || locked || needSnapshot}
            onClick={() => void writeSynthetic(presetOf(current?.id), generationOf(current?.id) + 1)}
          >
            Write again
          </button>
          <button
            type="button"
            style={btn}
            data-testid="counts-by-category"
            disabled={!!busy || needSnapshot}
            onClick={() => void timed('countByCategory', () => store.countByCategory(current!.id) as Promise<CategoryCounts>)}
          >
            Counts by category
          </button>
          <button
            type="button"
            style={btn}
            data-testid="bbox-query"
            disabled={!!busy || needSnapshot}
            onClick={() =>
              void timed('buildablesInBBox (sample box)', async () => {
                // R*Tree categories only (the indexed path), then every category (adds a range scan).
                let t = performance.now();
                const indexed = await store.buildablesInBBox(current!.id, SAMPLE_BBOX, [...RTREE_CATEGORIES]);
                const rtreeMs = Math.round(performance.now() - t);
                t = performance.now();
                const all = await store.buildablesInBBox(current!.id, SAMPLE_BBOX);
                const allMs = Math.round(performance.now() - t);
                return {
                  rtreeCategories: { count: indexed.length, ms: rtreeMs },
                  allCategories: { count: all.length, ms: allMs },
                  bbox: SAMPLE_BBOX,
                };
              })
            }
          >
            BBox query
          </button>
          <button
            type="button"
            style={btn}
            disabled={!!busy}
            onClick={() => void timed('navigator.storage.persist()', () => store.requestPersist())}
          >
            Request persistent storage
          </button>
          <button
            type="button"
            style={{ ...btn, borderColor: '#7F1D1D', color: '#FCA5A5' }}
            data-testid="delete-db"
            disabled={!!busy || locked}
            onClick={() =>
              void run('delete', async () => {
                await store.deleteWorld(world);
                setWrite(null);
                setQuery(null);
                setOpenResult(null);
              })
            }
          >
            Delete DB
          </button>
        </div>
        {busy && (
          <p style={{ color: '#9AA0AA', margin: '6px 0 0' }} data-testid="busy">
            Working: {busy}…
          </p>
        )}
        {error && (
          <p style={{ color: '#FCA5A5', margin: '6px 0 0' }} data-testid="debug-error">
            {error}
          </p>
        )}
      </Section>

      {write && (
        <Section title={`Last write: ${write.preset}, generation ${write.generation}`}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }} data-testid="write-timings">
            <tbody>
              {Object.entries(write.timings.tables).map(([t, ms]) => (
                <tr key={t}>
                  <td style={td}>{t}</td>
                  <td style={{ ...td, textAlign: 'right', color: '#9AA0AA' }}>
                    {write.timings.rows[t] !== undefined ? write.timings.rows[t].toLocaleString('en-US') : ''}
                  </td>
                  <td style={{ ...td, textAlign: 'right' }}>{fmtMs(ms)}</td>
                </tr>
              ))}
              <tr>
                <td style={{ ...td, fontWeight: 600 }}>worker total</td>
                <td style={td} />
                <td style={{ ...td, textAlign: 'right', fontWeight: 600 }} data-testid="write-total">
                  {fmtMs(write.timings.totalMs)}
                </td>
              </tr>
              <tr>
                <td style={td}>round trip (incl. postMessage clone)</td>
                <td style={td} />
                <td style={{ ...td, textAlign: 'right' }}>{fmtMs(write.roundTripMs)}</td>
              </tr>
              <tr>
                <td style={td}>generate rows (main thread)</td>
                <td style={td} />
                <td style={{ ...td, textAlign: 'right' }}>{fmtMs(write.generateMs)}</td>
              </tr>
            </tbody>
          </table>
          <p style={{ color: '#9AA0AA', margin: '4px 0 0' }}>
            Zod validation: {write.timings.validated ? 'on (dev build)' : 'off (production build)'}
          </p>
        </Section>
      )}

      {query && (
        <Section title={`${query.label}: ${fmtMs(query.ms)}`}>
          <pre style={pre} data-testid="query-result">
            {JSON.stringify(query.result, null, 2)}
          </pre>
        </Section>
      )}
    </aside>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ borderTop: '1px solid #2A2E36', paddingTop: 8 }}>
      <h3 style={{ margin: '0 0 6px', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#9AA0AA' }}>
        {title}
      </h3>
      {children}
    </section>
  );
}

function Row({ k, v }: { k: string; v: ReactNode }) {
  return (
    <>
      <dt style={{ color: '#9AA0AA' }}>{k}</dt>
      <dd style={{ margin: 0, wordBreak: 'break-all' }}>{v}</dd>
    </>
  );
}

const panel: CSSProperties = {
  position: 'fixed',
  top: 16,
  right: 16,
  bottom: 16,
  width: 380,
  zIndex: 999,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: 12,
  background: '#111318',
  border: '1px solid #2A2E36',
  borderRadius: 8,
  color: '#E7E9ED',
  fontFamily: "'IBM Plex Sans',system-ui,sans-serif",
  fontSize: 12,
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
};
const dl: CSSProperties = { display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2px 10px', margin: 0 };
const btn: CSSProperties = {
  background: '#1B1E24',
  color: '#E7E9ED',
  border: '1px solid #3A3F49',
  borderRadius: 4,
  padding: '4px 8px',
  fontSize: 12,
  cursor: 'pointer',
};
const btnGhost: CSSProperties = { background: 'none', border: 'none', color: '#9AA0AA', fontSize: 18, cursor: 'pointer' };
const input: CSSProperties = {
  background: '#0B0C0F',
  color: '#E7E9ED',
  border: '1px solid #3A3F49',
  borderRadius: 4,
  padding: '4px 6px',
  fontSize: 12,
};
const td: CSSProperties = { padding: '1px 4px', borderBottom: '1px solid #1F232A', fontFamily: "'IBM Plex Mono',monospace" };
const pre: CSSProperties = {
  margin: 0,
  maxHeight: 200,
  overflow: 'auto',
  background: '#0B0C0F',
  padding: 6,
  borderRadius: 4,
  fontFamily: "'IBM Plex Mono',monospace",
  fontSize: 11,
};
