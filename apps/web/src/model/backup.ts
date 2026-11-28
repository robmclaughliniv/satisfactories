import {
  buildBackupEnvelope,
  defaultBackupFilename,
  parseBackupJson,
  serializeBackup,
  type PersistedStateV2,
} from '@satisfactories/model';
import { recipeById } from '../data/gameData';

export { buildBackupEnvelope, defaultBackupFilename } from '@satisfactories/model';

const LAST_BACKUP_KEY = 'satisfactories:last-backup-at';

export function getLastBackupAt(): string | null {
  try {
    const raw = localStorage.getItem(LAST_BACKUP_KEY);
    if (!raw) return null;
    const ms = new Date(raw).getTime();
    return Number.isFinite(ms) ? raw : null;
  } catch {
    return null;
  }
}

export function recordLastBackupAt(at = new Date().toISOString()): string {
  try {
    localStorage.setItem(LAST_BACKUP_KEY, at);
  } catch {
    // best-effort metadata
  }
  return at;
}

async function writeBackup(handle: FileSystemFileHandle, envelope: PersistedStateV2): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(serializeBackup(envelope));
  await writable.close();
}

async function saveViaFilePicker(envelope: PersistedStateV2): Promise<void> {
  const handle = await window.showSaveFilePicker!({
    suggestedName: defaultBackupFilename(),
    types: [
      {
        description: 'Satisfactories backup',
        accept: { 'application/json': ['.json'] },
      },
    ],
  });
  await writeBackup(handle, envelope);
}

function saveViaDownload(envelope: PersistedStateV2): void {
  const blob = new Blob([serializeBackup(envelope)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = defaultBackupFilename();
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function saveBackupToFile(envelope: PersistedStateV2): Promise<boolean> {
  if (typeof window.showSaveFilePicker === 'function') {
    try {
      await saveViaFilePicker(envelope);
      return true;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return false;
      throw err;
    }
  }
  saveViaDownload(envelope);
  return true;
}

async function readBackupFile(file: File): Promise<PersistedStateV2> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error('Could not read backup file — invalid JSON.');
  }
  return parseBackupJson(parsed, recipeById);
}

async function loadViaFilePicker(): Promise<PersistedStateV2> {
  const handles = await window.showOpenFilePicker!({
    multiple: false,
    types: [
      {
        description: 'Satisfactories backup',
        accept: { 'application/json': ['.json'] },
      },
    ],
  });
  const file = await handles[0].getFile();
  return readBackupFile(file);
}

function loadViaFileInput(): Promise<PersistedStateV2> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.style.display = 'none';

    const cleanup = () => {
      input.remove();
    };

    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      cleanup();
      if (!file) {
        reject(new DOMException('No file selected', 'AbortError'));
        return;
      }
      try {
        resolve(await readBackupFile(file));
      } catch (err) {
        reject(err);
      }
    });

    input.addEventListener('cancel', () => {
      cleanup();
      reject(new DOMException('File picker cancelled', 'AbortError'));
    });

    document.body.appendChild(input);
    input.click();
  });
}

export async function loadBackupFromFile(): Promise<PersistedStateV2> {
  if (typeof window.showOpenFilePicker === 'function') {
    try {
      return await loadViaFilePicker();
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err;
      throw err;
    }
  }
  return loadViaFileInput();
}