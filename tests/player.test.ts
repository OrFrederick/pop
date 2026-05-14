import { describe, it, expect } from 'vitest';
import { Player } from '../src/game/Player';
import { PLAYER_ACCEL, PLAYER_MOUSE_DEAD_ZONE } from '../src/game/constants';

const W = 800;
const H = 600;

describe('Player.update with target', () => {
  it('accelerates toward a target point', () => {
    const p = new Player(100, 100);
    p.update(new Set<string>(), W, H, { x: 400, y: 100 });
    // Target is to the right; vx should be positive and vy ~ 0
    expect(p.vx).toBeGreaterThan(0);
    expect(Math.abs(p.vy)).toBeLessThan(1e-6);
  });

  it('accelerates toward a diagonal target', () => {
    const p = new Player(100, 100);
    p.update(new Set<string>(), W, H, { x: 200, y: 200 });
    expect(p.vx).toBeGreaterThan(0);
    expect(p.vy).toBeGreaterThan(0);
  });

  it('clamps acceleration magnitude to PLAYER_ACCEL', () => {
    const p = new Player(100, 100);
    // Far target: pre-friction velocity magnitude should equal PLAYER_ACCEL
    p.update(new Set<string>(), W, H, { x: 700, y: 100 });
    // After one frame: v = (PLAYER_ACCEL) * friction
    const speed = Math.hypot(p.vx, p.vy);
    expect(speed).toBeLessThanOrEqual(PLAYER_ACCEL + 1e-6);
  });

  it('does not accelerate when within dead zone', () => {
    const p = new Player(100, 100);
    const offset = PLAYER_MOUSE_DEAD_ZONE - 1;
    p.update(new Set<string>(), W, H, { x: 100 + offset, y: 100 });
    expect(p.vx).toBe(0);
    expect(p.vy).toBe(0);
  });

  it('does not accelerate when target equals player position', () => {
    const p = new Player(100, 100);
    p.update(new Set<string>(), W, H, { x: 100, y: 100 });
    expect(p.vx).toBe(0);
    expect(p.vy).toBe(0);
  });

  it('ignores keys when target provided', () => {
    const p = new Player(100, 100);
    const keys = new Set<string>(['a']); // would push left
    p.update(keys, W, H, { x: 400, y: 100 });
    // Should be moving right (toward target), not left
    expect(p.vx).toBeGreaterThan(0);
  });

  it('uses keys when no target provided', () => {
    const p = new Player(100, 100);
    const keys = new Set<string>(['d']);
    p.update(keys, W, H);
    expect(p.vx).toBeGreaterThan(0);
  });
});
