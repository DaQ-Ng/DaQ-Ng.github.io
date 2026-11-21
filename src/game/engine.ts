/**
 * The canvas side of DAT.EXE: world rendering at 320×180, movement + collision, camera,
 * robot companion, interaction prompts, and ambient animation.
 * It knows nothing about the DOM overlays; it reports events through callbacks.
 */
import * as art from './art';
import { tileGrid, wallGrid } from './tiles';
import {
  TILE, MAP_W, MAP_H, buildWorld, blocked, tileAt, spriteRect, usePoint, areaAt, SPAWN,
  type Obj, type World, type Kind,
} from './map';
import type { QuestState, FragmentId } from './quest';
import { chamberOpen, hasFragment } from './quest';

export const VIEW_W = 320;
export const VIEW_H = 180;
const SPEED = 66; // px per second
const USE_RANGE = 15;

type Dir = 'up' | 'down' | 'left' | 'right';
export type Target = { kind: 'object'; obj: Obj } | { kind: 'robot' };

export interface EngineEvents {
  interact(t: Target): void;
  nearby(t: Target | null): void;
  area(name: string): void;
}

/* ───────────── Sprite cache ───────────── */

function makeSprite(grid: readonly string[], flip = false): HTMLCanvasElement {
  const w = Math.max(...grid.map((r) => r.length));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = grid.length;
  const g = c.getContext('2d')!;
  grid.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const col = art.PALETTE[row[x]];
      if (!col) continue;
      g.fillStyle = col;
      g.fillRect(flip ? w - 1 - x : x, y, 1, 1);
    }
  });
  return c;
}

const KIND_ART: Partial<Record<Kind, readonly string[]>> = {
  terminal: art.terminal, mapTerminal: art.terminal, rack: art.rack, shelf: art.shelf, bench: art.bench,
  machine: art.machine, beacon: art.beacon, sign: art.sign, desk: art.desk, plant: art.plant, bed: art.bed,
  crate: art.crate, barrel: art.barrel, tree: art.tree, pine: art.pine, bush: art.bush,
};

/** Which fragment each puzzle object holds (for the floating crystal and screens). */
const FRAGMENT_OF: Record<string, FragmentId> = { circuit: 'api', dungeon: 'dungeon', tuner: 'notes' };

export function createEngine(canvas: HTMLCanvasElement, events: EngineEvents, getQuest: () => QuestState) {
  canvas.width = VIEW_W;
  canvas.height = VIEW_H;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  const world: World = buildWorld();
  const K = art.PALETTE;

  // Sprites
  const sprites = new Map<Kind, HTMLCanvasElement>();
  for (const [k, g] of Object.entries(KIND_ART)) sprites.set(k as Kind, makeSprite(g!));
  const playerFrames = {
    down: art.player.down.map((g) => makeSprite(g)),
    up: art.player.up.map((g) => makeSprite(g)),
    right: art.player.side.map((g) => makeSprite(g)),
    left: art.player.side.map((g) => makeSprite(g, true)),
  };
  const robotFrames = art.robot.map((g) => makeSprite(g));
  const crystal = makeSprite(art.crystal);
  const promptE = makeSprite(art.promptE);
  const tileCache = new Map<string, HTMLCanvasElement>();
  const tileSprite = (t: Parameters<typeof tileGrid>[0], v: number, f = 0) => {
    const key = `${t}:${v}:${f}`;
    let c = tileCache.get(key);
    if (!c) tileCache.set(key, (c = makeSprite(tileGrid(t, v, f))));
    return c;
  };
  const variantAt = (x: number, y: number) => ((x * 73856093) ^ (y * 19349663)) & 7;

  // Static ground, drawn once. Animated tiles (water, glitch, sealed door) are drawn live on top.
  const ground = document.createElement('canvas');
  ground.width = MAP_W * TILE;
  ground.height = MAP_H * TILE;
  const gctx = ground.getContext('2d')!;
  // Walls are autotiled: where the wall continues downward (a room's left/right sides and
  // its corners) we see the top of the wall; otherwise we see its brick face.
  const isWall = (x: number, y: number) => {
    const t = tileAt(world, x, y);
    return t === 'wall' || t === 'sealed';
  };
  const wallCache = new Map<string, HTMLCanvasElement>();
  const wallSprite = (x: number, y: number) => {
    const kind = isWall(x, y + 1) ? 'top' : 'face';
    const e = { left: !isWall(x - 1, y), right: !isWall(x + 1, y), top: kind === 'top' && !isWall(x, y - 1) };
    const key = `${kind}${+e.left}${+e.right}${+e.top}`;
    let c = wallCache.get(key);
    if (!c) wallCache.set(key, (c = makeSprite(wallGrid(kind, e))));
    return c;
  };
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
    const t = tileAt(world, x, y);
    if (t === 'wall') {
      gctx.drawImage(wallSprite(x, y), x * TILE, y * TILE);
      continue;
    }
    gctx.drawImage(tileSprite(t === 'water' || t === 'sealed' ? 'grass' : t, variantAt(x, y)), x * TILE, y * TILE);
  }

  /* ───────────── State ───────────── */
  const pos = { ...SPAWN };
  let dir: Dir = 'down';
  let walkT = 0;
  const robot = { x: SPAWN.x + 14, y: SPAWN.y - 4 };
  const held = new Set<Dir>();
  let target: { x: number; y: number } | null = null;
  let pending: Target | null = null;
  let stuckT = 0;
  let nearby: Target | null = null;
  let area = '';
  let paused = true;
  let reduced = false;
  let time = 0;
  let raf = 0;
  let last = 0;
  let visible = true;

  // Data motes drift upward through the world around the camera.
  const motes = Array.from({ length: 28 }, (_, i) => ({ x: 0, y: 0, v: 6 + (i % 5) * 3, p: i * 0.7, set: false }));

  const hitbox = (x: number, y: number) => ({ x: x - 4, y: y - 4, w: 8, h: 4 });
  const isBlocked = (x: number, y: number) => blocked(world, hitbox(x, y), chamberOpen(getQuest()));

  /* ───────────── Interaction ───────────── */
  function findNearby(): Target | null {
    let best: Target | null = null;
    let bestD = USE_RANGE;
    for (const o of world.objects) {
      if (!o.action) continue;
      const u = usePoint(o);
      const d = Math.hypot(pos.x - u.x, pos.y - u.y);
      if (d < bestD) (bestD = d), (best = { kind: 'object', obj: o });
    }
    const rd = Math.hypot(pos.x - robot.x, pos.y - robot.y);
    if (rd < 14 && rd < bestD) best = { kind: 'robot' };
    return best;
  }
  const sameTarget = (a: Target | null, b: Target | null) =>
    a === b || (!!a && !!b && a.kind === b.kind && (a.kind === 'robot' || (b.kind === 'object' && a.obj === b.obj)));

  function interact() {
    if (paused) return;
    if (nearby) events.interact(nearby);
  }

  /* ───────────── Update ───────────── */
  function update(dt: number) {
    time += dt;
    let vx = 0, vy = 0;
    if (held.size) {
      target = null;
      pending = null;
      vx = (held.has('right') ? 1 : 0) - (held.has('left') ? 1 : 0);
      vy = (held.has('down') ? 1 : 0) - (held.has('up') ? 1 : 0);
    } else if (target) {
      const dx = target.x - pos.x, dy = target.y - pos.y;
      const d = Math.hypot(dx, dy);
      if (d < 2) arrive();
      else (vx = dx / d), (vy = dy / d);
    }

    if (vx || vy) {
      const len = Math.hypot(vx, vy);
      const step = SPEED * dt;
      const mx = (vx / len) * step, my = (vy / len) * step;
      const before = { ...pos };
      if (!isBlocked(pos.x + mx, pos.y)) pos.x += mx;
      if (!isBlocked(pos.x, pos.y + my)) pos.y += my;
      dir = Math.abs(vx) > Math.abs(vy) ? (vx < 0 ? 'left' : 'right') : vy < 0 ? 'up' : 'down';
      walkT += dt;
      if (target) {
        const moved = Math.hypot(pos.x - before.x, pos.y - before.y);
        stuckT = moved < step * 0.25 ? stuckT + dt : 0;
        if (stuckT > 0.3) arrive();
      }
    } else walkT = 0;

    // Robot floats behind the player.
    const back = { up: [0, 12], down: [0, -12], left: [12, -2], right: [-12, -2] }[dir];
    const tx = pos.x + back[0], ty = pos.y + back[1];
    const k = Math.min(1, dt * 4);
    robot.x += (tx - robot.x) * k;
    robot.y += (ty - robot.y) * k;

    const n = findNearby();
    if (!sameTarget(n, nearby)) {
      nearby = n;
      events.nearby(n);
    }
    const a = areaAt(pos.x, pos.y);
    if (a !== area) {
      area = a;
      events.area(a);
    }
  }

  function arrive() {
    target = null;
    stuckT = 0;
    if (pending) {
      const p = pending;
      pending = null;
      nearby = findNearby();
      if (sameTarget(nearby, p) || (p.kind === 'object' && nearby?.kind === 'object' && nearby.obj === p.obj)) events.interact(p);
    }
  }

  /* ───────────── Render ───────────── */
  function camera() {
    return {
      x: Math.round(Math.max(0, Math.min(MAP_W * TILE - VIEW_W, pos.x - VIEW_W / 2))),
      y: Math.round(Math.max(0, Math.min(MAP_H * TILE - VIEW_H, pos.y - VIEW_H / 2))),
    };
  }

  function px(x: number, y: number, c: string) {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, 1, 1);
  }

  function render() {
    const cam = camera();
    const q = getQuest();
    ctx.drawImage(ground, cam.x, cam.y, VIEW_W, VIEW_H, 0, 0, VIEW_W, VIEW_H);

    // Animated tiles in view.
    const tx0 = Math.floor(cam.x / TILE), ty0 = Math.floor(cam.y / TILE);
    const waterFrame = reduced ? 0 : Math.floor(time * 2) % 2;
    for (let y = ty0; y <= ty0 + Math.ceil(VIEW_H / TILE); y++) for (let x = tx0; x <= tx0 + Math.ceil(VIEW_W / TILE); x++) {
      const t = tileAt(world, x, y);
      const sx = x * TILE - cam.x, sy = y * TILE - cam.y;
      if (t === 'water') ctx.drawImage(tileSprite('water', 0, waterFrame), sx, sy);
      else if (t === 'sealed') ctx.drawImage(tileSprite(chamberOpen(q) ? 'door' : 'sealed', 0), sx, sy);
      else if (t === 'glitch') drawGlitch(sx, sy, x, y);
      else if (t === 'void' && !reduced && ((x * 7 + y * 3 + Math.floor(time * 3)) % 23 === 0)) px(sx + ((x * 5) % 16), sy + ((y * 11) % 16), K.w);
    }

    // Y-sorted sprites.
    type D = { y: number; draw: () => void };
    const list: D[] = [];
    for (const o of world.objects) {
      const r = spriteRect(o);
      if (r.x + r.w < cam.x - 8 || r.x > cam.x + VIEW_W + 8 || r.y + r.h < cam.y - 8 || r.y > cam.y + VIEW_H + 8) continue;
      list.push({ y: r.y + r.h, draw: () => drawObject(o, r.x - cam.x, r.y - cam.y, q) });
    }
    const frames = playerFrames[dir];
    const f = walkT > 0 ? 1 + (Math.floor(walkT * 8) % 3) : 0;
    list.push({ y: pos.y, draw: () => ctx.drawImage(frames[f], Math.round(pos.x - 6 - cam.x), Math.round(pos.y - 16 - cam.y)) });
    const bob = reduced ? 0 : Math.round(Math.sin(time * 3) * 1.5);
    list.push({
      y: robot.y + 1,
      draw: () => {
        const rx = Math.round(robot.x - 6 - cam.x), ry = Math.round(robot.y - 20 - cam.y);
        ctx.fillStyle = 'rgba(23,22,20,0.25)';
        ctx.fillRect(rx + 3, Math.round(robot.y - cam.y) - 1, 6, 2);
        const blink = !reduced && time % 3.2 < 0.12 ? 1 : 0;
        ctx.drawImage(robotFrames[blink], rx, ry + bob);
      },
    });
    list.sort((a, b) => a.y - b.y).forEach((d) => d.draw());

    if (!reduced) drawMotes(cam);

    // Prompt bubble over whatever you can use.
    if (nearby && !paused) {
      const p = nearby.kind === 'robot' ? { x: robot.x, y: robot.y - 22 } : (() => {
        const r = spriteRect(nearby.obj);
        return { x: r.x + r.w / 2, y: r.y - 2 };
      })();
      const lift = reduced ? 0 : Math.floor(time * 3) % 2;
      ctx.drawImage(promptE, Math.round(p.x - 4 - cam.x), Math.round(p.y - 10 - cam.y - lift));
    }
  }

  function drawGlitch(sx: number, sy: number, x: number, y: number) {
    if (reduced) {
      ctx.fillStyle = K.l;
      ctx.fillRect(sx + 3, sy + 7, 6, 1);
      return;
    }
    const tick = Math.floor(time * 6);
    let h = (x * 374761393 + y * 668265263 + tick * 2654435761) >>> 0;
    const next = () => ((h = (h ^ (h << 13)) >>> 0), (h = (h ^ (h >>> 17)) >>> 0), (h = (h ^ (h << 5)) >>> 0), h / 4294967296);
    if (next() < 0.55) return;
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = [K.k, K.d, K.l][Math.floor(next() * 3)];
      ctx.fillRect(sx + Math.floor(next() * 12), sy + Math.floor(next() * 14), 2 + Math.floor(next() * 6), 1 + Math.floor(next() * 2));
    }
  }

  function drawMotes(cam: { x: number; y: number }) {
    for (const m of motes) {
      if (!m.set || m.y < cam.y - 4 || m.x < cam.x - 4 || m.x > cam.x + VIEW_W + 4) {
        m.x = cam.x + Math.random() * VIEW_W;
        m.y = cam.y + VIEW_H + Math.random() * VIEW_H;
        m.set = true;
      }
      m.y -= m.v * (1 / 60);
      m.x += Math.sin(time * 1.3 + m.p) * 0.15;
      const on = Math.sin(time * 4 + m.p * 3) > -0.3;
      if (on) px(Math.round(m.x - cam.x), Math.round(m.y - cam.y), m.p % 2 > 1 ? K.w : K.l);
    }
  }

  function drawObject(o: Obj, x: number, y: number, q: QuestState) {
    if (o.kind === 'core') return drawCore(x, y, q);
    const s = sprites.get(o.kind);
    if (s) ctx.drawImage(s, x, y);
    const frag = FRAGMENT_OF[o.id];
    const done = frag ? hasFragment(q, frag) : false;

    if (o.kind === 'terminal' || o.kind === 'mapTerminal') {
      const sc = art.TERMINAL_SCREEN;
      ctx.fillStyle = K.k;
      ctx.fillRect(x + sc.x, y + sc.y, sc.w, sc.h);
      if (!done) {
        // Static: broken screen.
        const tick = reduced ? 0 : Math.floor(time * 10);
        for (let i = 0; i < 10; i++) {
          const n = (i * 31 + tick * 17 + o.tx) % (sc.w * sc.h);
          px(x + sc.x + (n % sc.w), y + sc.y + Math.floor(n / sc.w), i % 3 ? K.d : K.l);
        }
      } else if (o.kind === 'terminal') {
        ctx.fillStyle = K.w;
        ctx.fillRect(x + sc.x + 1, y + sc.y + 1, 1, 1);
        ctx.fillRect(x + sc.x + 2, y + sc.y + 2, 1, 1);
        ctx.fillRect(x + sc.x + 1, y + sc.y + 3, 1, 1);
        if (reduced || Math.floor(time * 2) % 2) ctx.fillRect(x + sc.x + 4, y + sc.y + 3, 3, 1);
      } else {
        // Tiny dungeon map.
        for (const [dx, dy] of [[1, 1], [2, 1], [3, 1], [3, 2], [5, 2], [4, 2], [5, 3], [6, 3]]) px(x + sc.x + dx, y + sc.y + dy, K.w);
      }
    }
    if (o.kind === 'rack' && !reduced) {
      art.RACK_LEDS.forEach((p, i) => {
        if (Math.sin(time * (2 + (i % 3)) + i * 1.7 + o.tx) > 0.2) px(x + p.x, y + p.y, K.w);
      });
    }
    if (o.kind === 'machine') {
      const on = done && !reduced ? Math.floor(time * 6) % 2 : 0;
      for (const cx of [5, 10]) {
        px(x + cx + (on ? 1 : 0), y + 4, K.k);
        px(x + cx, y + 5 - (on ? 1 : 0), K.w);
      }
      px(x + 12, y + 10, done ? K.w : K.d);
    }
    if (o.kind === 'beacon') {
      const lit = reduced ? true : Math.floor(time * 1.5) % 2 === 0;
      ctx.fillStyle = lit ? K.w : K.d;
      ctx.fillRect(x + 7, y + 1, 2, 2);
      if (lit && !reduced) {
        px(x + 4, y + 2, K.l), px(x + 11, y + 2, K.l), px(x + 3, y + 1, K.l), px(x + 12, y + 1, K.l);
      }
    }
    // Floating crystal = an unrecovered memory fragment is here.
    if (frag && !done) {
      const b = reduced ? 0 : Math.round(Math.sin(time * 2.5) * 2);
      ctx.drawImage(crystal, x + (spriteRect(o).w - 8) / 2, y - 13 + b);
    }
  }

  function drawCore(x: number, y: number, q: QuestState) {
    const open = chamberOpen(q);
    // Platform
    ctx.fillStyle = K.k;
    ctx.fillRect(x + 2, y + 22, 28, 9);
    ctx.fillStyle = K.l;
    ctx.fillRect(x + 3, y + 23, 26, 3);
    ctx.fillStyle = K.d;
    ctx.fillRect(x + 3, y + 26, 26, 4);
    ctx.fillStyle = K.w;
    ctx.fillRect(x + 5, y + 23, 22, 1);
    // Swirl: dots on rotating rings.
    const cx = x + 16, cy = y + 12;
    const spin = reduced ? 0 : time * (q.restored ? 0.6 : open ? 2.4 : 0.8);
    const rings = q.restored ? [4, 7, 10] : open ? [3, 6, 9] : [5, 9];
    rings.forEach((rad, ri) => {
      const count = 6 + ri * 4;
      for (let i = 0; i < count; i++) {
        const a = spin * (ri % 2 ? -1 : 1) + (i / count) * Math.PI * 2;
        px(Math.round(cx + Math.cos(a) * rad), Math.round(cy + Math.sin(a) * rad * 0.8), open ? (i % 2 ? K.w : K.l) : K.d);
      }
    });
    ctx.fillStyle = open ? K.w : K.d;
    ctx.fillRect(cx - 1, cy - 1, 3, 3);
  }

  /* ───────────── Loop ───────────── */
  function frame(now: number) {
    // rAF timestamps can be slightly behind performance.now(): never step backwards.
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
    last = now;
    if (!paused) update(dt);
    else time += dt;
    render();
    raf = requestAnimationFrame(frame);
  }

  function run() {
    if (raf || !visible) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function halt() {
    cancelAnimationFrame(raf);
    raf = 0;
    held.clear();
  }

  // Only animate while on screen and the tab is visible.
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting && !document.hidden;
    visible ? run() : halt();
  }).observe(canvas);
  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden;
    visible ? run() : halt();
  });

  render();

  return {
    start: run,
    setPaused(p: boolean) {
      paused = p;
      if (p) {
        held.clear();
        target = null;
        pending = null;
      }
      if (!p) {
        nearby = null; // re-announce the prompt
      }
    },
    isPaused: () => paused,
    setReduced(r: boolean) {
      reduced = r;
    },
    press(d: Dir, on: boolean) {
      if (on && !paused) held.add(d);
      else held.delete(d);
    },
    releaseAll: () => held.clear(),
    interact,
    /** Tap/click on the canvas: walk there, and use the object if one was tapped. */
    tap(cx: number, cy: number) {
      if (paused) return;
      const r = canvas.getBoundingClientRect();
      const cam = camera();
      const wx = ((cx - r.left) / r.width) * VIEW_W + cam.x;
      const wy = ((cy - r.top) / r.height) * VIEW_H + cam.y;
      // Tapped the robot?
      if (Math.abs(wx - robot.x) < 8 && wy > robot.y - 22 && wy < robot.y) {
        pending = { kind: 'robot' };
        target = { x: robot.x, y: robot.y + 8 };
        return;
      }
      const hit = world.objects.find((o) => {
        if (!o.action) return false;
        const s = spriteRect(o);
        return wx >= s.x && wx < s.x + s.w && wy >= s.y && wy < s.y + s.h + 4;
      });
      if (hit) {
        const u = usePoint(hit);
        if (Math.hypot(pos.x - u.x, pos.y - u.y) < USE_RANGE) return events.interact({ kind: 'object', obj: hit });
        pending = { kind: 'object', obj: hit };
        target = u;
      } else {
        pending = null;
        target = { x: wx, y: wy };
      }
      stuckT = 0;
    },
    /** Debug/testing hook: teleport (used by the e2e checks). */
    debugTeleport(x: number, y: number) {
      pos.x = x;
      pos.y = y;
      robot.x = x + 12;
      robot.y = y;
    },
    get position() {
      return { ...pos };
    },
    world,
  };
}

export type Engine = ReturnType<typeof createEngine>;
