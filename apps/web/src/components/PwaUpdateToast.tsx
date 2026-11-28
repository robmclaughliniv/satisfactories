import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Prompt-to-update (amendment 6). A new service worker waits until the user
 * clicks Reload; dismissing keeps the current version. Never auto-reloads.
 */
export function PwaUpdateToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({ immediate: true });

  if (!needRefresh) return null;
  return (
    <div
      role="status"
      data-testid="pwa-update-toast"
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: 1000,
        display: 'flex',
        gap: 10,
        alignItems: 'center',
        padding: '10px 12px',
        borderRadius: 6,
        background: '#15171C',
        border: '1px solid #2A2E36',
        color: '#E7E9ED',
        fontFamily: "'IBM Plex Sans',system-ui,sans-serif",
        fontSize: 13,
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      }}
    >
      <span>Update available</span>
      <button
        type="button"
        data-testid="pwa-update-reload"
        onClick={() => void updateServiceWorker(true)}
        style={{
          background: '#F5882E',
          color: '#0B0C0F',
          border: 'none',
          borderRadius: 4,
          padding: '4px 10px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Reload
      </button>
      <button
        type="button"
        aria-label="Dismiss"
        data-testid="pwa-update-dismiss"
        onClick={() => setNeedRefresh(false)}
        style={{ background: 'none', border: 'none', color: '#9AA0AA', cursor: 'pointer', fontSize: 16 }}
      >
        ×
      </button>
    </div>
  );
}
