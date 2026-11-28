import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export default defineConfig({
  server: {
    fs: { allow: [repoRoot] },
  },
  // sqlite-wasm resolves sqlite3.wasm with `new URL(..., import.meta.url)`; pre-bundling breaks that path.
  optimizeDeps: {
    exclude: ['@sqlite.org/sqlite-wasm'],
  },
  // The snapshot worker is a module worker with code-split deps (sqlite-wasm, Comlink).
  worker: {
    format: 'es',
  },
  plugins: [
    react(),
    VitePWA({
      // Amendment 6: prompt-to-update. PwaUpdateToast asks; nothing auto-reloads.
      registerType: 'prompt',
      includeAssets: [
        'favicon.ico',
        'favicon-16x16.png',
        'favicon-32x32.png',
        'favicon-48x48.png',
        'apple-touch-icon.png',
        'og-image.png',
        'logo-master.png',
      ],
      manifest: {
        name: 'Satisfactories',
        short_name: 'Satisfactories',
        description: 'Plan and track Satisfactory factory worlds',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#0B0C0F',
        theme_color: '#0B0C0F',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/maskable-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        // wasm so the snapshot store's SQLite works offline (sqlite3.wasm is ~835 KiB, under the 2 MiB default limit).
        globPatterns: ['**/*.{js,css,html,ico,png,woff2,wasm}'],
      },
    }),
  ],
});
