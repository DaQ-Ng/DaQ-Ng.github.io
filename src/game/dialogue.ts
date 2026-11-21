/**
 * Dialogue state machine: a queue of lines, typed out a few characters at a time.
 * advance() first finishes the current line, then moves to the next, then closes.
 * Pure functions; the UI just renders whatever state it's given.
 */

export type Speaker = 'robot' | 'system' | 'dat';

export interface Line {
  who: Speaker;
  text: string;
}

export interface DialogueState {
  lines: Line[];
  index: number;
  /** How many characters of the current line are visible. */
  shown: number;
  open: boolean;
}

export const closedDialogue = (): DialogueState => ({ lines: [], index: 0, shown: 0, open: false });

export function openDialogue(lines: Line[], instant = false): DialogueState {
  if (!lines.length) return closedDialogue();
  return { lines, index: 0, shown: instant ? lines[0].text.length : 0, open: true };
}

export const currentLine = (s: DialogueState): Line | null => (s.open ? s.lines[s.index] ?? null : null);
export const lineComplete = (s: DialogueState) => !s.open || s.shown >= (currentLine(s)?.text.length ?? 0);
export const isLastLine = (s: DialogueState) => s.index >= s.lines.length - 1;

/** Reveal `chars` more characters of the current line. */
export function typeChars(s: DialogueState, chars: number): DialogueState {
  const line = currentLine(s);
  if (!line || lineComplete(s)) return s;
  return { ...s, shown: Math.min(line.text.length, s.shown + chars) };
}

/** E / Space / tap: finish the line, or go to the next one, or close. */
export function advance(s: DialogueState, instant = false): DialogueState {
  if (!s.open) return s;
  if (!lineComplete(s)) return { ...s, shown: currentLine(s)!.text.length };
  if (isLastLine(s)) return closedDialogue();
  const index = s.index + 1;
  return { ...s, index, shown: instant ? s.lines[index].text.length : 0 };
}

/** Esc: close immediately. */
export const closeDialogue = (): DialogueState => closedDialogue();
