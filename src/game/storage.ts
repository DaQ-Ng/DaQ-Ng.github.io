/**
 * localStorage that never throws. Private windows, blocked cookies and full quotas all
 * fall back to an in-memory store, so the game keeps working (progress just won't persist).
 */

export interface KV {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
  /** False when we fell back to memory. */
  persistent: boolean;
}

export function memoryStore(): KV {
  const m = new Map<string, string>();
  return {
    get: (k) => m.get(k) ?? null,
    set: (k, v) => void m.set(k, v),
    remove: (k) => void m.delete(k),
    persistent: false,
  };
}

/** `getStorage` is injectable for tests. */
export function safeStore(getStorage: () => Storage | undefined = () => globalThis.localStorage): KV {
  let s: Storage | undefined;
  try {
    s = getStorage();
    if (!s) return memoryStore();
    const probe = '__datexe_probe__';
    s.setItem(probe, '1');
    s.removeItem(probe);
  } catch {
    return memoryStore();
  }
  const fallback = memoryStore();
  let broken = false;
  const store: Storage = s;
  return {
    get(k) {
      if (broken) return fallback.get(k);
      try {
        return store.getItem(k);
      } catch {
        broken = true;
        return fallback.get(k);
      }
    },
    set(k, v) {
      fallback.set(k, v);
      if (broken) return;
      try {
        store.setItem(k, v);
      } catch {
        broken = true;
      }
    },
    remove(k) {
      fallback.remove(k);
      try {
        store.removeItem(k);
      } catch {
        broken = true;
      }
    },
    get persistent() {
      return !broken;
    },
  };
}

export function readJSON<T>(kv: KV, key: string, parse: (raw: unknown) => T): T {
  const text = kv.get(key);
  let raw: unknown = null;
  if (text) {
    try {
      raw = JSON.parse(text);
    } catch {
      raw = null;
    }
  }
  return parse(raw);
}

export function writeJSON(kv: KV, key: string, value: unknown) {
  kv.set(key, JSON.stringify(value));
}

export const SAVE_KEY = 'datexe.save.v1';
export const SETTINGS_KEY = 'datexe.settings.v1';

export interface Settings {
  muted: boolean;
  reducedMotion: boolean;
}

export function parseSettings(raw: unknown, prefersReduced = false): Settings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    muted: r.muted === true,
    reducedMotion: typeof r.reducedMotion === 'boolean' ? r.reducedMotion : prefersReduced,
  };
}
