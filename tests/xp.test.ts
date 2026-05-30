import { describe, it, expect } from 'vitest';
import {
  createXP, addXP, xpForNextLevel, xpFromCombo, XP_LEVEL_CAP,
  XP_ORB, XP_GOLD, XP_SHARD_KILL, XP_BOSS_HIT, XP_BOSS_KILL,
} from '../src/game/XP';

describe('XP', () => {
  it('starts at level 1, 0 xp, 0 points', () => {
    const s = createXP();
    expect(s.level).toBe(1);
    expect(s.xp).toBe(0);
    expect(s.points).toBe(0);
  });

  it('xpForNextLevel grows: L1=100, L2=125, L3=150', () => {
    expect(xpForNextLevel(1)).toBe(100);
    expect(xpForNextLevel(2)).toBe(125);
    expect(xpForNextLevel(3)).toBe(150);
  });

  it('addXP under threshold accumulates', () => {
    const s = createXP();
    const r = addXP(s, 50);
    expect(r.xp).toBe(50);
    expect(r.level).toBe(1);
    expect(r.points).toBe(0);
    expect(r.leveledUp).toBe(false);
  });

  it('addXP crossing threshold levels up and grants point', () => {
    const s = createXP();
    const r = addXP(s, 100);
    expect(r.level).toBe(2);
    expect(r.xp).toBe(0);
    expect(r.points).toBe(1);
    expect(r.leveledUp).toBe(true);
  });

  it('addXP handles multi-level in one call', () => {
    const s = createXP();
    const r = addXP(s, 500);
    expect(r.level).toBeGreaterThanOrEqual(3);
    expect(r.points).toBeGreaterThanOrEqual(2);
  });

  it('caps at XP_LEVEL_CAP', () => {
    const s = createXP();
    s.level = XP_LEVEL_CAP;
    s.xp = 0;
    const r = addXP(s, 9999);
    expect(r.level).toBe(XP_LEVEL_CAP);
    expect(r.xp).toBe(0);
    expect(r.leveledUp).toBe(false);
  });
});

describe('XP gain helpers', () => {
  it('exports flat values', () => {
    expect(XP_ORB).toBe(3);
    expect(XP_GOLD).toBe(9);
    expect(XP_SHARD_KILL).toBe(6);
    expect(XP_BOSS_HIT).toBe(15);
    expect(XP_BOSS_KILL).toBe(75);
  });
  it('xpFromCombo at combo 0 = base', () => {
    expect(xpFromCombo(10, 0)).toBe(10);
  });
  it('xpFromCombo scales 5% per combo, capped at 2x', () => {
    expect(xpFromCombo(10, 10)).toBe(15);
    expect(xpFromCombo(10, 100)).toBe(20);
  });
});
