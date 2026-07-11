export type PersistedLayout = {
  leftWidth?: number;
  rightWidth?: number;
  leftOpen?: boolean;
  rightOpen?: boolean;
};

const STORAGE_PREFIX = 'sf:layout:';

export function readPersistedLayout(id: string): PersistedLayout | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + id);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedLayout;
  } catch {
    return null;
  }
}

export function writePersistedLayout(id: string, data: PersistedLayout) {
  try {
    localStorage.setItem(STORAGE_PREFIX + id, JSON.stringify(data));
  } catch {
    /* ignore quota / private mode */
  }
}
