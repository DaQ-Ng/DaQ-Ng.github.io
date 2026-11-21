/**
 * 16×16 ground tiles, generated as pixel grids (same k/d/l/w keys as art.ts).
 * Variants are seeded so grass doesn't repeat visibly; water has two frames.
 */
import { rng } from './rng';
import type { Tile } from './map';

type Grid = string[][];
const blank = (c: string): Grid => Array.from({ length: 16 }, () => Array<string>(16).fill(c));
const toRows = (g: Grid) => g.map((r) => r.join(''));
const put = (g: Grid, x: number, y: number, c: string) => {
  if (x >= 0 && y >= 0 && x < 16 && y < 16) g[y][x] = c;
};

function grass(seed: number): Grid {
  const g = blank('w');
  const r = rng(seed);
  for (let i = 0; i < 3; i++) {
    const x = 1 + Math.floor(r() * 13), y = 2 + Math.floor(r() * 12);
    put(g, x, y, 'l'), put(g, x + 2, y, 'l'), put(g, x + 1, y + 1, 'l');
  }
  if (r() < 0.5) put(g, Math.floor(r() * 16), Math.floor(r() * 16), 'l');
  return g;
}

function flowers(seed: number): Grid {
  const g = grass(seed);
  const r = rng(seed + 7);
  for (let i = 0; i < 2; i++) {
    const x = 2 + Math.floor(r() * 11), y = 2 + Math.floor(r() * 11);
    put(g, x, y - 1, 'k'), put(g, x - 1, y, 'k'), put(g, x + 1, y, 'k'), put(g, x, y + 1, 'k'), put(g, x, y, 'w');
    put(g, x, y + 2, 'd');
  }
  return g;
}

function path(seed: number): Grid {
  const g = blank('l');
  const r = rng(seed);
  // Four cobbles with a light top edge and dark bottom edge.
  for (const [ox, oy] of [[1, 1], [9, 0], [0, 9], [8, 8]]) {
    const w = 6 + Math.floor(r() * 2), h = 5 + Math.floor(r() * 2);
    for (let x = ox + 1; x < ox + w; x++) put(g, x, oy + 1, 'w'), put(g, x, oy + h, 'd');
    for (let y = oy + 2; y < oy + h; y++) put(g, ox, y, 'w'), put(g, ox + w, y, 'd');
  }
  return g;
}

function floor(): Grid {
  const g = blank('l');
  for (let i = 0; i < 16; i++) put(g, i, 0, 'd'), put(g, 0, i, 'd'), put(g, i, 8, 'w');
  put(g, 2, 2, 'w'), put(g, 13, 2, 'w'), put(g, 2, 13, 'w'), put(g, 13, 13, 'w');
  return g;
}

function wall(): Grid {
  const g = blank('d');
  // Cap
  for (let x = 0; x < 16; x++) put(g, x, 0, 'k'), put(g, x, 1, 'w'), put(g, x, 2, 'w'), put(g, x, 3, 'k');
  // Bricks: rows of 4 px, staggered.
  for (let row = 0; row < 3; row++) {
    const y0 = 4 + row * 4;
    for (let x = 0; x < 16; x++) put(g, x, y0 + 3, 'k');
    const off = row % 2 ? 4 : 0;
    for (let x = off; x < 16; x += 8) for (let y = y0; y < y0 + 3; y++) put(g, x, y, 'k');
    for (let x = 0; x < 16; x++) if (g[y0][x] !== 'k') put(g, x, y0, 'l');
  }
  return g;
}

function water(frame: number): Grid {
  const g = blank('d');
  for (const [row, shift] of [[3, 0], [9, 5], [14, 2]]) {
    for (let x = 0; x < 16; x++) {
      const p = (x + shift + frame * 3) % 8;
      if (p < 3) put(g, x, row, 'w');
      else if (p === 3) put(g, x, row + 1, 'l');
    }
  }
  return g;
}

function voidTile(seed: number): Grid {
  const g = blank('k');
  const r = rng(seed);
  for (let i = 0; i < 3; i++) put(g, Math.floor(r() * 16), Math.floor(r() * 16), r() < 0.5 ? 'd' : 'w');
  return g;
}

function door(): Grid {
  const g = blank('l');
  for (let y = 0; y < 16; y++) put(g, 0, y, 'k'), put(g, 1, y, 'd'), put(g, 14, y, 'd'), put(g, 15, y, 'k');
  for (let x = 2; x < 14; x++) put(g, x, 15, 'd');
  return g;
}

function sealed(): Grid {
  const g = wall();
  for (let y = 2; y < 16; y++) for (let x = 2; x < 14; x++) put(g, x, y, y % 3 === 0 ? 'k' : 'd');
  for (let y = 2; y < 16; y++) put(g, 2, y, 'k'), put(g, 13, y, 'k');
  // Lock
  for (const [x, y] of [[7, 6], [8, 6], [6, 7], [9, 7], [6, 8], [7, 8], [8, 8], [9, 8], [6, 9], [9, 9], [6, 10], [7, 10], [8, 10], [9, 10]]) put(g, x, y, 'w');
  put(g, 7, 9, 'k'), put(g, 8, 9, 'k');
  return g;
}

/** Which sides of a wall tile face open ground (so they get an outline). */
export interface WallEdges {
  left: boolean;
  right: boolean;
  top: boolean;
}

/**
 * Top of a wall seen from above: used for the vertical (left/right) walls of a room and the
 * corners, where the wall continues below. Light capstones with a dark outline on open sides.
 */
function wallTop(e: WallEdges): Grid {
  const g = blank('l');
  // Capstones: 8×4 blocks, staggered, with dark seams and a light top-left highlight.
  for (let row = 0; row < 4; row++) {
    const y0 = row * 4;
    for (let x = 0; x < 16; x++) put(g, x, y0 + 3, 'd');
    const off = row % 2 ? 4 : 0;
    for (let x = off; x < 16 + off; x += 8) {
      for (let y = y0; y < y0 + 3; y++) put(g, x % 16, y, 'd');
      put(g, (x + 1) % 16, y0, 'w'), put(g, (x + 2) % 16, y0, 'w');
    }
  }
  if (e.left) for (let y = 0; y < 16; y++) put(g, 0, y, 'k'), put(g, 1, y, 'w');
  if (e.right) for (let y = 0; y < 16; y++) put(g, 15, y, 'k'), put(g, 14, y, 'd');
  if (e.top) for (let x = 0; x < 16; x++) put(g, x, 0, 'k'), put(g, x, 1, 'w');
  if (e.left && e.top) put(g, 1, 1, 'k');
  if (e.right && e.top) put(g, 14, 1, 'k');
  return g;
}

/** Front-facing brick wall, outlined on any side that meets open ground. */
function wallFace(e: WallEdges): Grid {
  const g = wall();
  if (e.left) for (let y = 0; y < 16; y++) put(g, 0, y, 'k');
  if (e.right) for (let y = 0; y < 16; y++) put(g, 15, y, 'k');
  return g;
}

/**
 * Wall piece for a tile, chosen from its neighbours:
 * the wall continues below → seen from above (`top`); otherwise → the brick face (`face`).
 */
export function wallGrid(kind: 'top' | 'face', e: WallEdges): string[] {
  return toRows(kind === 'top' ? wallTop(e) : wallFace(e));
}

/** Pixel grid for a tile. `variant` picks a texture; water uses `frame`. Glitch tiles draw as grass (the flicker is live). */
export function tileGrid(t: Tile, variant = 0, frame = 0): string[] {
  switch (t) {
    case 'grass': return toRows(grass(variant));
    case 'flowers': return toRows(flowers(variant));
    case 'path': return toRows(path(variant));
    case 'floor': return toRows(floor());
    case 'wall': return toRows(wall());
    case 'water': return toRows(water(frame));
    case 'glitch': return toRows(grass(variant));
    case 'void': return toRows(voidTile(variant));
    case 'door': return toRows(door());
    case 'sealed': return toRows(sealed());
  }
}
