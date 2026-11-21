/**
 * The three memory-fragment puzzles, as pure state. Each is meant to take under 30 seconds.
 *   1. Circuit: connect each node on the left to the matching node on the right.
 *   2. Dungeon map: a procedurally generated floor; find and activate the exit room.
 *   3. Tuner: turn three dials until the waveform matches the target.
 */
import { rng, shuffle } from './rng';

/* ───────────── 1. Circuit ───────────── */

export const SYMBOLS = ['■', '▲', '●'] as const;
export type Sym = (typeof SYMBOLS)[number];

export interface CircuitState {
  left: Sym[];
  right: Sym[];
  /** Left node waiting for a partner, by index. */
  selected: number | null;
  /** left index → right index, for correct connections. */
  links: Record<number, number>;
  /** Last attempt was wrong (for a "bzzt" message). */
  miss: boolean;
}

export function newCircuit(seed: number): CircuitState {
  const r = rng(seed);
  let right = shuffle(SYMBOLS, r);
  // Never already in order, so there's something to do.
  if (right.every((s, i) => s === SYMBOLS[i])) right = [right[1], right[2], right[0]];
  return { left: [...SYMBOLS], right, selected: null, links: {}, miss: false };
}

export function pickLeft(s: CircuitState, i: number): CircuitState {
  if (i in s.links) return s;
  return { ...s, selected: i, miss: false };
}

export function pickRight(s: CircuitState, j: number): CircuitState {
  if (s.selected === null || Object.values(s.links).includes(j)) return s;
  if (s.left[s.selected] !== s.right[j]) return { ...s, selected: null, miss: true };
  return { ...s, links: { ...s.links, [s.selected]: j }, selected: null, miss: false };
}

export const circuitSolved = (s: CircuitState) => Object.keys(s.links).length === s.left.length;

/* ───────────── 2. Dungeon map ───────────── */

export interface Dungeon {
  w: number;
  h: number;
  /** true = room/corridor. Row-major. */
  open: boolean[];
  start: number;
  exit: number;
  activated: boolean;
}

/** Random-walk dungeon; the exit is the open cell farthest (by steps) from the start. */
export function newDungeon(seed: number, w = 11, h = 7, steps = 40): Dungeon {
  const r = rng(seed);
  const open = new Array<boolean>(w * h).fill(false);
  let x = Math.floor(w / 2), y = Math.floor(h / 2);
  const start = y * w + x;
  open[start] = true;
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let i = 0; i < steps; i++) {
    const [dx, dy] = dirs[Math.floor(r() * 4)];
    x = Math.max(0, Math.min(w - 1, x + dx));
    y = Math.max(0, Math.min(h - 1, y + dy));
    open[y * w + x] = true;
  }
  const dist = distances(open, w, h, start);
  let exit = start;
  dist.forEach((d, i) => {
    if (d > (dist[exit] ?? 0)) exit = i;
  });
  return { w, h, open, start, exit, activated: false };
}

/** Breadth-first step counts from `from`; -1 = unreachable. */
export function distances(open: boolean[], w: number, h: number, from: number): number[] {
  const d = new Array<number>(open.length).fill(-1);
  d[from] = 0;
  const q = [from];
  while (q.length) {
    const c = q.shift()!;
    const cx = c % w, cy = Math.floor(c / w);
    for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]]) {
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const n = ny * w + nx;
      if (open[n] && d[n] < 0) {
        d[n] = d[c] + 1;
        q.push(n);
      }
    }
  }
  return d;
}

/** Clicking a room: only the exit activates. Returns the same object for a wrong room. */
export function activateRoom(d: Dungeon, cell: number): Dungeon {
  return cell === d.exit && !d.activated ? { ...d, activated: true } : d;
}

/* ───────────── 3. Tuner (audio / notes machine) ───────────── */

export const DIAL_STEPS = 4;

export interface TunerState {
  dials: number[];
  target: number[];
}

export function newTuner(seed: number): TunerState {
  const r = rng(seed);
  const target = [0, 1, 2].map(() => Math.floor(r() * DIAL_STEPS));
  // Start every dial one or more steps off so each needs a turn.
  const dials = target.map((t, i) => (t + 1 + ((i + Math.floor(r() * 2)) % (DIAL_STEPS - 1))) % DIAL_STEPS);
  return { dials, target };
}

export function turnDial(s: TunerState, i: number, by = 1): TunerState {
  if (i < 0 || i >= s.dials.length) return s;
  const dials = [...s.dials];
  dials[i] = (((dials[i] + by) % DIAL_STEPS) + DIAL_STEPS) % DIAL_STEPS;
  return { ...s, dials };
}

export const tunerSolved = (s: TunerState) => s.dials.every((v, i) => v === s.target[i]);
