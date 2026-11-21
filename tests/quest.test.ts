import { describe, it, expect } from 'vitest';
import {
  initialQuest, recover, collect, discover, restore, allFragments, chamberOpen, hint, parseQuest, hasFragment,
} from '../src/game/quest';

describe('quest progression', () => {
  it('starts empty and locked', () => {
    const s = initialQuest();
    expect(s.fragments).toEqual([]);
    expect(chamberOpen(s)).toBe(false);
    expect(restore(s).restored).toBe(false);
  });

  it('collects each fragment once, in a stable order', () => {
    let s = recover(initialQuest());
    s = collect(s, 'notes');
    s = collect(s, 'api');
    s = collect(s, 'api');
    expect(s.fragments).toEqual(['api', 'notes']);
    expect(hasFragment(s, 'dungeon')).toBe(false);
  });

  it('ignores unknown fragment ids', () => {
    const s = collect(initialQuest(), 'bogus' as never);
    expect(s.fragments).toEqual([]);
  });

  it('opens the chamber and allows restore only with all three fragments', () => {
    let s = collect(collect(initialQuest(), 'api'), 'dungeon');
    expect(chamberOpen(s)).toBe(false);
    expect(restore(s).restored).toBe(false);
    s = collect(s, 'notes');
    expect(allFragments(s)).toBe(true);
    expect(chamberOpen(s)).toBe(true);
    expect(restore(s).restored).toBe(true);
  });

  it('records optional discoveries without affecting the main quest', () => {
    const s = discover(discover(initialQuest(), 'contact'), 'skills');
    expect(s.found).toEqual(['skills', 'contact']);
    expect(chamberOpen(s)).toBe(false);
  });

  it('gives a hint that follows progress', () => {
    let s = initialQuest();
    expect(hint(s)).toMatch(/terminal/i);
    s = collect(s, 'api');
    expect(hint(s)).toMatch(/map terminal/i);
    s = collect(s, 'dungeon');
    expect(hint(s)).toMatch(/workshop/i);
    s = collect(s, 'notes');
    expect(hint(s)).toMatch(/chamber/i);
    expect(hint(restore(s))).toMatch(/restored/i);
  });
});

describe('save parsing', () => {
  it('falls back to a fresh state for garbage', () => {
    expect(parseQuest(null)).toEqual(initialQuest());
    expect(parseQuest('nope')).toEqual(initialQuest());
    expect(parseQuest({ fragments: 'api' })).toEqual(initialQuest());
  });

  it('keeps only known ids', () => {
    const s = parseQuest({ recovered: true, fragments: ['api', 'evil', 'notes'], found: ['about', 'x'] });
    expect(s).toEqual({ recovered: true, fragments: ['api', 'notes'], found: ['about'], restored: false });
  });

  it('does not trust a restored flag without all fragments', () => {
    expect(parseQuest({ restored: true, fragments: ['api'] }).restored).toBe(false);
    expect(parseQuest({ restored: true, fragments: ['api', 'dungeon', 'notes'] }).restored).toBe(true);
  });
});
