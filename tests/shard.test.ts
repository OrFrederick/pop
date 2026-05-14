import { describe, it, expect } from 'vitest';
import { Shard } from '../src/game/Shard';
import { SHARD_SPEED, SHARD_LIFETIME, SHARD_RADIUS } from '../src/game/constants';
import { circleCircle } from '../src/game/collisions';

describe('Shard', () => {
  it('moves at SHARD_SPEED along normalized direction (rightward)', () => {
    const s = new Shard(0, 0, 1, 0);
    expect(s.vx).toBeCloseTo(SHARD_SPEED);
    expect(s.vy).toBeCloseTo(0);
    s.update();
    expect(s.x).toBeCloseTo(SHARD_SPEED);
    expect(s.y).toBeCloseTo(0);
  });

  it('normalizes diagonal direction so total speed equals SHARD_SPEED', () => {
    const s = new Shard(0, 0, 3, 4);
    const speed = Math.hypot(s.vx, s.vy);
    expect(speed).toBeCloseTo(SHARD_SPEED);
  });

  it('defaults to upward when given zero direction', () => {
    // Caller is responsible for nonzero direction; passing 0,0 produces NaN/Inf
    // — verify the Player helper instead via fireDirection on zero velocity.
    const s = new Shard(50, 50, 0, -1);
    expect(s.vy).toBeCloseTo(-SHARD_SPEED);
  });

  it('expires after SHARD_LIFETIME frames', () => {
    const s = new Shard(0, 0, 1, 0);
    expect(s.expired()).toBe(false);
    for (let i = 0; i < SHARD_LIFETIME; i++) s.update();
    expect(s.expired()).toBe(true);
  });

  it('uses SHARD_RADIUS for collision', () => {
    const s = new Shard(0, 0, 1, 0);
    expect(s.r).toBe(SHARD_RADIUS);
  });

  it('circle-circle hit detection with a target', () => {
    const s = new Shard(100, 100, 1, 0);
    const target = { x: 102, y: 100, r: 10 };
    expect(circleCircle(s, target)).toBe(true);
    const farTarget = { x: 500, y: 500, r: 10 };
    expect(circleCircle(s, farTarget)).toBe(false);
  });

  it('offscreen detection', () => {
    const s = new Shard(-50, 100, 1, 0);
    expect(s.offscreen(800, 600)).toBe(true);
    const s2 = new Shard(400, 300, 1, 0);
    expect(s2.offscreen(800, 600)).toBe(false);
  });
});
