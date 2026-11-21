import { describe, it, expect } from 'vitest';
import {
  newCircuit, pickLeft, pickRight, circuitSolved,
  newDungeon, distances, activateRoom,
  newTuner, turnDial, tunerSolved, DIAL_STEPS,
} from '../src/game/puzzles';

describe('circuit puzzle', () => {
  it('never starts solved or in order', () => {
    for (let seed = 0; seed < 50; seed++) {
      const s = newCircuit(seed);
      expect(circuitSolved(s)).toBe(false);
      expect(s.right).not.toEqual(s.left);
    }
  });

  it('rejects a wrong match and accepts the right ones', () => {
    let s = newCircuit(3);
    const wrong = s.right.findIndex((sym) => sym !== s.left[0]);
    s = pickRight(pickLeft(s, 0), wrong);
    expect(s.miss).toBe(true);
    expect(Object.keys(s.links)).toHaveLength(0);
    for (let i = 0; i < 3; i++) s = pickRight(pickLeft(s, i), s.right.indexOf(s.left[i]));
    expect(circuitSolved(s)).toBe(true);
  });

  it('ignores a right pick with nothing selected', () => {
    const s = newCircuit(1);
    expect(pickRight(s, 0)).toBe(s);
  });
});

describe('dungeon map puzzle', () => {
  it('is deterministic for a seed', () => {
    expect(newDungeon(42)).toEqual(newDungeon(42));
  });

  it('always has a reachable exit that is the farthest room', () => {
    for (let seed = 1; seed < 60; seed++) {
      const d = newDungeon(seed);
      const dist = distances(d.open, d.w, d.h, d.start);
      expect(d.open[d.exit]).toBe(true);
      expect(dist[d.exit]).toBeGreaterThan(0);
      expect(Math.max(...dist)).toBe(dist[d.exit]);
    }
  });

  it('only the exit room activates', () => {
    const d = newDungeon(7);
    expect(activateRoom(d, d.start)).toBe(d);
    expect(activateRoom(d, d.exit).activated).toBe(true);
  });
});

describe('tuner puzzle', () => {
  it('starts with every dial off target', () => {
    for (let seed = 0; seed < 50; seed++) {
      const s = newTuner(seed);
      s.dials.forEach((v, i) => expect(v).not.toBe(s.target[i]));
    }
  });

  it('turning wraps around and can reach the target', () => {
    let s = newTuner(9);
    for (let i = 0; i < 3; i++) while (s.dials[i] !== s.target[i]) s = turnDial(s, i);
    expect(tunerSolved(s)).toBe(true);
    const wrapped = turnDial({ dials: [DIAL_STEPS - 1, 0, 0], target: [0, 0, 0] }, 0);
    expect(wrapped.dials[0]).toBe(0);
  });
});
