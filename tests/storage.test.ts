import { describe, it, expect } from 'vitest';
import { safeStore, readJSON, writeJSON, parseSettings } from '../src/game/storage';
import { parseQuest, initialQuest } from '../src/game/quest';

function fakeStorage(opts: { throwOnSet?: boolean } = {}): Storage {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    clear: () => m.clear(),
    key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => {
      if (opts.throwOnSet && k !== '__datexe_probe__') throw new Error('QuotaExceeded');
      m.set(k, v);
    },
    removeItem: (k) => void m.delete(k),
  };
}

describe('safe storage', () => {
  it('uses real storage when it works', () => {
    const kv = safeStore(() => fakeStorage());
    writeJSON(kv, 'a', { x: 1 });
    expect(kv.get('a')).toBe('{"x":1}');
    expect(kv.persistent).toBe(true);
  });

  it('falls back to memory when storage is unavailable', () => {
    const kv = safeStore(() => {
      throw new Error('SecurityError');
    });
    kv.set('a', '1');
    expect(kv.get('a')).toBe('1');
    expect(kv.persistent).toBe(false);
  });

  it('falls back to memory when storage is missing', () => {
    const kv = safeStore(() => undefined);
    kv.set('a', '1');
    expect(kv.get('a')).toBe('1');
    expect(kv.persistent).toBe(false);
  });

  it('keeps working (in memory) if writes start failing', () => {
    const kv = safeStore(() => fakeStorage({ throwOnSet: true }));
    kv.set('save', '{"recovered":true}');
    expect(kv.persistent).toBe(false);
    expect(kv.get('save')).toBe('{"recovered":true}');
  });

  it('reads corrupted JSON as a fresh save', () => {
    const kv = safeStore(() => fakeStorage());
    kv.set('save', '{not json');
    expect(readJSON(kv, 'save', parseQuest)).toEqual(initialQuest());
    kv.remove('save');
    expect(readJSON(kv, 'save', parseQuest)).toEqual(initialQuest());
  });

  it('settings default to the OS reduced-motion preference', () => {
    expect(parseSettings(null, true)).toEqual({ muted: false, reducedMotion: true });
    expect(parseSettings({ muted: true, reducedMotion: false }, true)).toEqual({ muted: true, reducedMotion: false });
  });
});
