/**
 * The world: one 48×30 tile map with five connected areas.
 *
 *   Archive (education)      Personal room (about)      Restore chamber (sealed until 3 fragments)
 *                 ── corrupted forest: pond, ruins, map terminal, signal beacon ──
 *   Terminal room (start, circuit terminal)                  Workshop (skills bench, notes machine)
 *
 * Everything here is plain data built by a seeded generator, so it's the same on every visit.
 */
import { rng } from './rng';
import type { FragmentId, DiscoveryId } from './quest';

export const TILE = 16;
export const MAP_W = 48;
export const MAP_H = 30;

export type Tile = 'grass' | 'flowers' | 'path' | 'floor' | 'wall' | 'water' | 'glitch' | 'void' | 'door' | 'sealed';
const SOLID: ReadonlySet<Tile> = new Set<Tile>(['wall', 'water', 'void', 'sealed']);

export type Action =
  | { type: 'puzzle'; puzzle: 'circuit' | 'dungeon' | 'tuner'; fragment: FragmentId }
  | { type: 'panel'; panel: DiscoveryId }
  | { type: 'talk'; lines: string[] }
  | { type: 'restore' };

export type Kind =
  | 'terminal' | 'mapTerminal' | 'rack' | 'shelf' | 'bench' | 'machine' | 'beacon' | 'sign'
  | 'desk' | 'plant' | 'bed' | 'crate' | 'barrel' | 'tree' | 'pine' | 'bush' | 'core';

export interface Obj {
  id: string;
  kind: Kind;
  /** Tile the object stands on (its bottom row), and its left edge in tiles. */
  tx: number;
  ty: number;
  /** Solid box in world px, if any. */
  solid?: { x: number; y: number; w: number; h: number };
  action?: Action;
  /** Short label for the prompt and screen readers, e.g. "Examine terminal". */
  label?: string;
}

export interface Room {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  door: { x: number; y: number };
  sealed?: boolean;
}

export const ROOMS: Room[] = [
  { id: 'archive', x: 1, y: 1, w: 14, h: 8, door: { x: 7, y: 8 } },
  { id: 'personal', x: 17, y: 1, w: 9, h: 7, door: { x: 21, y: 7 } },
  { id: 'chamber', x: 31, y: 1, w: 16, h: 10, door: { x: 38, y: 10 }, sealed: true },
  { id: 'terminal', x: 1, y: 19, w: 14, h: 10, door: { x: 7, y: 19 } },
  { id: 'workshop', x: 31, y: 18, w: 16, h: 11, door: { x: 38, y: 18 } },
];

export const SPAWN = { x: 7 * TILE + 8, y: 24 * TILE + 12 };

export const AREA_NAMES: { id: string; x: number; y: number; w: number; h: number; name: string }[] = [
  { id: 'archive', x: 1, y: 1, w: 14, h: 8, name: 'Archive' },
  { id: 'personal', x: 17, y: 1, w: 9, h: 7, name: 'Personal Room' },
  { id: 'chamber', x: 31, y: 1, w: 16, h: 10, name: 'Restore Chamber' },
  { id: 'terminal', x: 1, y: 19, w: 14, h: 10, name: 'Terminal Room' },
  { id: 'workshop', x: 31, y: 18, w: 16, h: 11, name: 'Workshop' },
];

/** Sprite sizes in px, used for placement and solid boxes. */
export const SIZE: Record<Kind, { w: number; h: number }> = {
  terminal: { w: 16, h: 16 }, mapTerminal: { w: 16, h: 16 }, rack: { w: 16, h: 24 }, shelf: { w: 16, h: 24 },
  bench: { w: 32, h: 16 }, machine: { w: 16, h: 16 }, beacon: { w: 16, h: 32 }, sign: { w: 16, h: 16 },
  desk: { w: 16, h: 16 }, plant: { w: 16, h: 12 }, bed: { w: 16, h: 12 }, crate: { w: 14, h: 14 },
  barrel: { w: 12, h: 12 }, tree: { w: 16, h: 18 }, pine: { w: 16, h: 17 }, bush: { w: 16, h: 7 }, core: { w: 32, h: 32 },
};

export interface World {
  tiles: Tile[];
  objects: Obj[];
}

export const idx = (x: number, y: number) => y * MAP_W + x;
export const inBounds = (x: number, y: number) => x >= 0 && y >= 0 && x < MAP_W && y < MAP_H;

/** World-px rectangle a sprite of this kind covers when standing on (tx, ty). */
export function spriteRect(o: Pick<Obj, 'kind' | 'tx' | 'ty'>) {
  const s = SIZE[o.kind];
  return { x: o.tx * TILE + Math.round((Math.max(TILE, s.w) - s.w) / 2), y: (o.ty + 1) * TILE - s.h, w: s.w, h: s.h };
}

/** Default solid box: the bottom part of the sprite (trunks are thinner). */
function solidFor(kind: Kind, tx: number, ty: number) {
  const r = spriteRect({ kind, tx, ty });
  if (kind === 'tree' || kind === 'pine') return { x: r.x + 5, y: r.y + r.h - 5, w: 6, h: 5 };
  if (kind === 'bush') return { x: r.x + 1, y: r.y, w: r.w - 2, h: r.h };
  if (kind === 'core') return { x: r.x + 4, y: r.y + 12, w: 24, h: 20 };
  const h = Math.min(r.h, kind === 'rack' || kind === 'shelf' || kind === 'beacon' ? 10 : 9);
  return { x: r.x + 1, y: r.y + r.h - h, w: r.w - 2, h };
}

function place(objects: Obj[], kind: Kind, tx: number, ty: number, extra: Partial<Obj> = {}) {
  objects.push({ id: extra.id ?? `${kind}-${tx}-${ty}`, kind, tx, ty, solid: solidFor(kind, tx, ty), ...extra });
}

export function buildWorld(seed = 1035): World {
  const tiles = new Array<Tile>(MAP_W * MAP_H).fill('grass');
  const set = (x: number, y: number, t: Tile) => inBounds(x, y) && (tiles[idx(x, y)] = t);
  const get = (x: number, y: number): Tile => (inBounds(x, y) ? tiles[idx(x, y)] : 'void');
  const fill = (x: number, y: number, w: number, h: number, t: Tile, only?: Tile[]) => {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (!only || only.includes(get(i, j))) set(i, j, t);
  };

  // Corrupted edge of the world.
  for (let x = 0; x < MAP_W; x++) set(x, 0, 'void'), set(x, MAP_H - 1, 'void');
  for (let y = 0; y < MAP_H; y++) set(0, y, 'void'), set(MAP_W - 1, y, 'void');

  // Rooms: walls around, floor inside, a doorway.
  for (const r of ROOMS) {
    fill(r.x, r.y, r.w, r.h, 'wall');
    fill(r.x + 1, r.y + 1, r.w - 2, r.h - 2, 'floor');
    set(r.door.x, r.door.y, r.sealed ? 'sealed' : 'door');
  }

  // Paths linking every doorway.
  const out: Tile[] = ['grass'];
  fill(3, 13, 42, 2, 'path', out);
  fill(7, 9, 1, 4, 'path', out);
  fill(21, 8, 1, 5, 'path', out);
  fill(38, 11, 1, 2, 'path', out);
  fill(7, 15, 1, 4, 'path', out);
  fill(38, 15, 1, 3, 'path', out);
  // Ruin clearing with the map terminal, south of the pond.
  fill(26, 15, 1, 6, 'path', out);
  fill(24, 21, 5, 4, 'path', out);

  // Pond.
  fill(16, 17, 6, 4, 'water', out);
  set(16, 17, 'grass'), set(21, 17, 'grass'), set(16, 20, 'grass'), set(21, 20, 'grass');

  // Holes in reality.
  for (const [x, y] of [[29, 9], [30, 9], [30, 10], [12, 16], [13, 16], [13, 17], [28, 26], [29, 26], [29, 27], [3, 10], [44, 16]]) {
    if (get(x, y) === 'grass') set(x, y, 'void');
  }

  const r = rng(seed);
  const objects: Obj[] = [];

  // Fixed interactables and props.
  const T = (id: string, kind: Kind, tx: number, ty: number, action?: Action, label?: string) =>
    place(objects, kind, tx, ty, { id, action, label });

  // Terminal room (start).
  T('circuit', 'terminal', 4, 21, { type: 'puzzle', puzzle: 'circuit', fragment: 'api' }, 'Repair terminal');
  for (const x of [10, 11, 12, 13]) T(`rack-t${x}`, 'rack', x, 21);
  T('crate-t1', 'crate', 12, 26), T('crate-t2', 'crate', 13, 26), T('barrel-t', 'barrel', 2, 26);

  // Workshop.
  T('bench', 'bench', 33, 21, { type: 'panel', panel: 'skills' }, 'Inspect workbench');
  T('tuner', 'machine', 42, 21, { type: 'puzzle', puzzle: 'tuner', fragment: 'notes' }, 'Repair notes machine');
  T('rack-w1', 'rack', 44, 21), T('rack-w2', 'rack', 45, 21);
  T('crate-w1', 'crate', 32, 26), T('crate-w2', 'crate', 33, 26), T('barrel-w', 'barrel', 45, 27);

  // Archive.
  for (const x of [2, 3, 5, 6, 9, 10, 12, 13]) T(`shelf-${x}`, 'shelf', x, 3, { type: 'panel', panel: 'education' }, 'Read the archive');

  // Personal room.
  T('desk', 'desk', 19, 3, { type: 'panel', panel: 'about' }, 'Look at the desk');
  T('bed', 'bed', 23, 3), T('plant', 'plant', 18, 6);

  // Restore chamber.
  T('core', 'core', 38, 6, { type: 'restore' }, 'Restore save');
  for (const x of [33, 34, 44, 45]) T(`rack-c${x}`, 'rack', x, 3);

  // Outdoors.
  T('dungeon', 'mapTerminal', 26, 22, { type: 'puzzle', puzzle: 'dungeon', fragment: 'dungeon' }, 'Examine map terminal');
  T('beacon', 'beacon', 44, 12, { type: 'panel', panel: 'contact' }, 'Use signal beacon');
  T('sign', 'sign', 9, 12, {
    type: 'talk',
    lines: ['NORTH: Archive · Personal room · Restore chamber (sealed)', 'EAST: Signal beacon · Workshop', 'SOUTH: Ruins'],
  }, 'Read sign');

  // Keep space clear around paths, doors, water and interactables.
  const reserved = new Set<number>();
  const reserve = (x: number, y: number, pad = 1) => {
    for (let j = y - pad; j <= y + pad; j++) for (let i = x - pad; i <= x + pad; i++) if (inBounds(i, j)) reserved.add(idx(i, j));
  };
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
    const t = get(x, y);
    if (t === 'path' || t === 'door' || t === 'sealed' || t === 'water' || t === 'void') reserve(x, y);
  }
  for (const o of objects) reserve(o.tx, o.ty, 1);

  // Forest: seeded scatter of trees, pines and bushes; then flowers and glitch tiles on open grass.
  for (let y = 1; y < MAP_H - 1; y++) {
    for (let x = 1; x < MAP_W - 1; x++) {
      if (get(x, y) !== 'grass' || reserved.has(idx(x, y))) continue;
      const roll = r();
      if (roll < 0.16) {
        const kind: Kind = roll < 0.07 ? 'tree' : roll < 0.12 ? 'pine' : 'bush';
        place(objects, kind, x, y);
        reserve(x, y, 0);
      } else if (roll < 0.21) set(x, y, 'flowers');
      else if (roll < 0.26 && (x > 14 && x < 31)) set(x, y, 'glitch');
    }
  }

  return { tiles, objects };
}

export const tileAt = (w: World, x: number, y: number): Tile => (inBounds(x, y) ? w.tiles[idx(x, y)] : 'void');

/** Is this world-px rectangle blocked by a solid tile or object? */
export function blocked(w: World, rect: { x: number; y: number; w: number; h: number }, openChamber: boolean): boolean {
  const x0 = Math.floor(rect.x / TILE), x1 = Math.floor((rect.x + rect.w - 1) / TILE);
  const y0 = Math.floor(rect.y / TILE), y1 = Math.floor((rect.y + rect.h - 1) / TILE);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const t = tileAt(w, x, y);
    if (t === 'sealed' && openChamber) continue;
    if (SOLID.has(t)) return true;
  }
  return w.objects.some(
    (o) => o.solid && rect.x < o.solid.x + o.solid.w && rect.x + rect.w > o.solid.x && rect.y < o.solid.y + o.solid.h && rect.y + rect.h > o.solid.y,
  );
}

/** Name of the area a world-px point is in (for the HUD), or the forest. */
export function areaAt(px: number, py: number): string {
  const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
  const a = AREA_NAMES.find((r) => tx >= r.x && tx < r.x + r.w && ty >= r.y && ty < r.y + r.h);
  return a?.name ?? 'Corrupted Forest';
}

/** Point to stand near to use an object: just below its sprite, centred. */
export function usePoint(o: Obj) {
  const r = spriteRect(o);
  return { x: r.x + r.w / 2, y: r.y + r.h + 6 };
}
