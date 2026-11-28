import { useEffect, useState } from 'react';
import { getSnapshotNotice, subscribeSnapshotNotice, type SnapshotNotice } from '../snapshot/notice';

const TEXT: Record<Exclude<SnapshotNotice, null>, string> = {
  locked: 'Satisfactories is open in another tab. The game snapshot is read-only here.',
  memory:
    "This browser can't store the game snapshot on disk, so it is kept in memory and is lost when you close the tab.",
};

/** Non-blocking banner for the snapshot store. Renders nothing until the store reports a problem. */
export function SnapshotBanner() {
  const [notice, setNotice] = useState<SnapshotNotice>(getSnapshotNotice);
  const [dismissed, setDismissed] = useState<SnapshotNotice>(null);
  useEffect(() => subscribeSnapshotNotice(setNotice), []);
  if (!notice || dismissed === notice) return null;
  return (
    <div
      role="status"
      data-testid={`snapshot-banner-${notice}`}
      style={{
        position: 'fixed',
        top: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        maxWidth: 'min(640px, calc(100vw - 32px))',
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        padding: '8px 12px',
        borderRadius: 6,
        background: '#2A2110',
        border: '1px solid #F5882E',
        color: '#F3DDBF',
        fontFamily: "'IBM Plex Sans',system-ui,sans-serif",
        fontSize: 13,
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      }}
    >
      <span>{TEXT[notice]}</span>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => setDismissed(notice)}
        style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 16 }}
      >
        ×
      </button>
    </div>
  );
}
