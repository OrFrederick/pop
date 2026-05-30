import { describe, it, expect } from 'vitest';
import {
  createStatTree, invest, STAT_IDS, STAT_MAX,
  maxSpeedMult, reloadMult, bulletSpeedMult,
  bulletDamageBonus, piercingBonus, maxHealthBonus,
  regenIntervalFrames, bodyDamageEnabled,
} from '../src/game/StatTree';

describe('StatTree', () => {
  it('exports 8 stat ids', () => expect(STAT_IDS.length).toBe(8));
  it('STAT_MAX = 7', () => expect(STAT_MAX).toBe(7));
  it('creates with all 0', () => {
    const t = createStatTree();
    for (const id of STAT_IDS) expect(t[id]).toBe(0);
  });
  it('invest increments only if level < max', () => {
    const t = createStatTree();
    expect(invest(t, 'reload')).toBe(true);
    expect(t.reload).toBe(1);
    for (let i = 0; i < 6; i++) invest(t, 'reload');
    expect(t.reload).toBe(7);
    expect(invest(t, 'reload')).toBe(false);
    expect(t.reload).toBe(7);
  });
});

describe('Stat derived values', () => {
  it('maxSpeedMult: 1.0 at L0, monotonic', () => {
    expect(maxSpeedMult(0)).toBe(1);
    expect(maxSpeedMult(7)).toBeGreaterThan(1);
  });
  it('reloadMult: 1.0 at L0, 0.88 at L1', () => {
    expect(reloadMult(0)).toBe(1);
    expect(reloadMult(1)).toBeCloseTo(0.88);
  });
  it('bulletSpeedMult: 1.0 at L0, 1.1 at L1', () => {
    expect(bulletSpeedMult(0)).toBe(1);
    expect(bulletSpeedMult(1)).toBeCloseTo(1.1);
  });
  it('bulletDamageBonus = level', () => {
    expect(bulletDamageBonus(0)).toBe(0);
    expect(bulletDamageBonus(4)).toBe(4);
  });
  it('piercingBonus = level', () => {
    expect(piercingBonus(0)).toBe(0);
    expect(piercingBonus(3)).toBe(3);
  });
  it('maxHealthBonus = level', () => {
    expect(maxHealthBonus(2)).toBe(2);
  });
  it('regenIntervalFrames: 0 at L0 (disabled), shorter at higher L', () => {
    expect(regenIntervalFrames(0)).toBe(0);
    expect(regenIntervalFrames(1)).toBeGreaterThan(0);
    expect(regenIntervalFrames(7)).toBeLessThan(regenIntervalFrames(1));
  });
  it('bodyDamageEnabled at L>=1', () => {
    expect(bodyDamageEnabled(0)).toBe(false);
    expect(bodyDamageEnabled(1)).toBe(true);
  });
});
