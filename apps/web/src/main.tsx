import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { PwaUpdateToast } from './components/PwaUpdateToast';
import { SnapshotBanner } from './components/SnapshotBanner';
import './styles/global.css';

// Hidden snapshot-store debug panel: `?debug=snapshot`. Lazy, so the worker,
// sqlite-wasm and Comlink are not part of the startup bundle.
const showSnapshotDebug = new URLSearchParams(window.location.search).get('debug') === 'snapshot';
const SnapshotDebugPanel = showSnapshotDebug
  ? lazy(() => import('./components/debug/SnapshotDebugPanel'))
  : null;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <SnapshotBanner />
    <PwaUpdateToast />
    {SnapshotDebugPanel && (
      <Suspense fallback={null}>
        <SnapshotDebugPanel />
      </Suspense>
    )}
  </StrictMode>,
);
