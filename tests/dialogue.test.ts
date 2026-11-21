import { describe, it, expect } from 'vitest';
import { openDialogue, advance, typeChars, currentLine, lineComplete, closeDialogue } from '../src/game/dialogue';

const lines = [
  { who: 'robot' as const, text: 'Hello there.' },
  { who: 'robot' as const, text: 'Second.' },
];

describe('dialogue state machine', () => {
  it('opens on the first line with nothing typed yet', () => {
    const s = openDialogue(lines);
    expect(s.open).toBe(true);
    expect(currentLine(s)?.text).toBe('Hello there.');
    expect(s.shown).toBe(0);
  });

  it('types characters up to the end of the line', () => {
    let s = openDialogue(lines);
    s = typeChars(s, 5);
    expect(s.shown).toBe(5);
    s = typeChars(s, 100);
    expect(s.shown).toBe(12);
    expect(lineComplete(s)).toBe(true);
  });

  it('advance finishes the line first, then moves on, then closes', () => {
    let s = openDialogue(lines);
    s = advance(s);
    expect(lineComplete(s)).toBe(true);
    expect(s.index).toBe(0);
    s = advance(s);
    expect(s.index).toBe(1);
    expect(s.shown).toBe(0);
    s = advance(s); // finish line 2
    s = advance(s); // close
    expect(s.open).toBe(false);
    expect(currentLine(s)).toBeNull();
  });

  it('instant mode (reduced motion) shows whole lines', () => {
    let s = openDialogue(lines, true);
    expect(lineComplete(s)).toBe(true);
    s = advance(s, true);
    expect(s.index).toBe(1);
    expect(lineComplete(s)).toBe(true);
  });

  it('empty dialogue never opens; Esc closes', () => {
    expect(openDialogue([]).open).toBe(false);
    expect(closeDialogue().open).toBe(false);
    expect(advance(closeDialogue()).open).toBe(false);
  });
});
