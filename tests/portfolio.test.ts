import { describe, it, expect } from 'vitest';
import { site, isMissing } from '../src/data/portfolio';
import { FRAGMENTS } from '../src/game/quest';

describe('portfolio link fallback', () => {
  it('treats empty, null, TODO, bracket and # links as missing', () => {
    for (const v of [null, undefined, '', '  ', 'TODO: add link', 'todo', '[Your GitHub]', '#']) {
      expect(isMissing(v as string | null)).toBe(true);
    }
    expect(isMissing('https://github.com/DaQ-Ng')).toBe(false);
  });

  it('every game project link is either a real https URL or explicitly missing', () => {
    for (const p of site.gameProjects) {
      for (const link of [p.repo, p.demo]) {
        if (isMissing(link)) continue;
        expect(link).toMatch(/^https:\/\//);
      }
    }
  });

  it('has exactly one project per memory fragment', () => {
    expect(site.gameProjects.map((p) => p.fragment).sort()).toEqual([...FRAGMENTS].sort());
  });

  it('contact links are real URLs, not placeholders', () => {
    expect(site.contact.email).toMatch(/^[^@\s]+@[^@\s]+\.[a-z]+$/i);
    expect(isMissing(site.contact.github) || /^https:\/\//.test(site.contact.github)).toBe(true);
    expect(isMissing(site.contact.linkedin) || /^https:\/\//.test(site.contact.linkedin)).toBe(true);
  });
});
