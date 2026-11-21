import { describe, it, expect } from 'vitest';
import { buildWorld, blocked, usePoint, SPAWN, TILE, MAP_W, MAP_H, ROOMS } from '../src/game/map';

/** Flood-fill walkable 4-px cells from the spawn point using the same hitbox as the player. */
function reachable(open: boolean) {
  const w = buildWorld();
  const C = 4;
  const cols = (MAP_W * TILE) / C, rows = (MAP_H * TILE) / C;
  const seen = new Uint8Array(cols * rows);
  const free = (cx: number, cy: number) => !blocked(w, { x: cx * C + C / 2 - 4, y: cy * C + C / 2 - 4, w: 8, h: 4 }, open);
  const start = [Math.floor(SPAWN.x / C), Math.floor(SPAWN.y / C)];
  const q = [start];
  seen[start[1] * cols + start[0]] = 1;
  while (q.length) {
    const [x, y] = q.pop()!;
    for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || seen[ny * cols + nx]) continue;
      if (!free(nx, ny)) continue;
      seen[ny * cols + nx] = 1;
      q.push([nx, ny]);
    }
  }
  const canReach = (px: number, py: number) => {
    // Any reachable cell within 6 px of the point counts (the use range is 15 px).
    for (let dy = -6; dy <= 6; dy += 2) for (let dx = -6; dx <= 6; dx += 2) {
      const cx = Math.floor((px + dx) / C), cy = Math.floor((py + dy) / C);
      if (cx >= 0 && cy >= 0 && cx < cols && cy < rows && seen[cy * cols + cx]) return true;
    }
    return false;
  };
  return { w, canReach };
}

describe('world map', () => {
  it('is the same on every build', () => {
    expect(buildWorld()).toEqual(buildWorld());
  });

  it('spawn is not inside anything solid', () => {
    const w = buildWorld();
    expect(blocked(w, { x: SPAWN.x - 4, y: SPAWN.y - 4, w: 8, h: 4 }, false)).toBe(false);
  });

  it('every interactable can be reached once the chamber is open', () => {
    const { w, canReach } = reachable(true);
    const unreachable = w.objects.filter((o) => o.action && !canReach(usePoint(o).x, usePoint(o).y)).map((o) => o.id);
    expect(unreachable).toEqual([]);
  });

  it('everything except the restore core is reachable before the chamber opens', () => {
    const { w, canReach } = reachable(false);
    const unreachable = w.objects.filter((o) => o.action && !canReach(usePoint(o).x, usePoint(o).y)).map((o) => o.id);
    expect(unreachable).toEqual(['core']);
  });

  it('has a sealed door on the restore chamber only', () => {
    expect(ROOMS.filter((r) => r.sealed).map((r) => r.id)).toEqual(['chamber']);
  });
});
