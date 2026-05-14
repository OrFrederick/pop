import { describe, it, expect } from 'vitest';
import { PulseBoss } from '../src/game/PulseBoss';
import { BOSS_HP, BOSS_ESCAPE_FRAMES, BOSS_RING_COUNT, BOSS_RING_INTERVAL } from '../src/game/constants';

describe('PulseBoss', () => {
  it('starts at full HP', () => {
    expect(new PulseBoss(400, 300, 0).hp).toBe(BOSS_HP);
  });
  it('escaped() false before timeout', () => {
    expect(new PulseBoss(400, 300, 0).escaped(BOSS_ESCAPE_FRAMES - 1)).toBe(false);
  });
  it('escaped() true at timeout', () => {
    expect(new PulseBoss(400, 300, 0).escaped(BOSS_ESCAPE_FRAMES)).toBe(true);
  });
  it('hit() decrements hp', () => {
    const boss = new PulseBoss(400, 300, 0);
    boss.hit();
    expect(boss.hp).toBe(BOSS_HP - 1);
  });
  it('fires ring burst at BOSS_RING_INTERVAL frames', () => {
    const boss = new PulseBoss(400, 300, 0);
    let bullets: ReturnType<typeof boss.update> = [];
    for (let i = 0; i < BOSS_RING_INTERVAL - 1; i++) {
      bullets = boss.update(i, 1, 400, 300, 200, 200);
    }
    expect(bullets.length).toBe(0);
    bullets = boss.update(BOSS_RING_INTERVAL - 1, 1, 400, 300, 200, 200);
    expect(bullets.length).toBe(BOSS_RING_COUNT);
  });
  it('phase 1 (full HP) fires only rings', () => {
    const boss = new PulseBoss(400, 300, 0);
    let total = 0;
    for (let i = 0; i < BOSS_RING_INTERVAL - 1; i++) {
      total += boss.update(i, 1, 400, 300, 200, 200).length;
    }
    expect(total).toBe(0);
  });
  it('phase 2 (mid HP) adds spiral bullets', () => {
    const boss = new PulseBoss(400, 300, 0);
    for (let i = 0; i < Math.ceil(BOSS_HP / 3); i++) boss.hit();
    let total = 0;
    for (let i = 0; i < 60; i++) total += boss.update(i, 1, 400, 300, 200, 200).length;
    expect(total).toBeGreaterThan(0);
  });
  it('phase 3 (low HP) fires aimed bullets', () => {
    const boss = new PulseBoss(400, 300, 0);
    while (boss.hp > 1) boss.hit();
    let total = 0;
    for (let i = 0; i < 200; i++) total += boss.update(i, 1, 400, 300, 0, 0).length;
    expect(total).toBeGreaterThan(BOSS_RING_COUNT);
  });
});
