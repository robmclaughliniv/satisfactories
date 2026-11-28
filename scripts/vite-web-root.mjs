import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
export const webRoot = path.resolve(scriptsDir, '../apps/web');

export async function createWebViteServer() {
  const viteEntry = path.join(webRoot, 'node_modules/vite/dist/node/index.js');
  const { createServer } = await import(pathToFileURL(viteEntry).href);
  return createServer({
    root: webRoot,
    configFile: path.join(webRoot, 'vite.config.ts'),
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
  });
}