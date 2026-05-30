import { describe, it, expect } from 'vitest';
import {
  bossSpawnIntervalForWave, bossRingCountForWave,
  bossSpiralIntervalForWave, bossAimedIntervalForWave,
  bossAimedSpreadCountForWave,
} from '../src/game/PulseBoss';

describe('Boss wave scaling', () => {
  it('spawn interval shrinks per wave, floor 600', () => {
    expect(bossSpawnIntervalForWave(1)).toBe(1800);
    expect(bossSpawnIntervalForWave(3)).toBe(1400);
    expect(bossSpawnIntervalForWave(10)).toBe(600);
    expect(bossSpawnIntervalForWave(99)).toBe(600);
  });
  it('ring count grows, cap 24', () => {
    expect(bossRingCountForWave(1)).toBe(8);
    expect(bossRingCountForWave(5)).toBe(12);
    expect(bossRingCountForWave(100)).toBe(24);
  });
  it('spiral interval shrinks, floor 8', () => {
    expect(bossSpiralIntervalForWave(1)).toBe(21);
    expect(bossSpiralIntervalForWave(20)).toBe(8);
  });
  it('aimed interval shrinks, floor 60', () => {
    expect(bossAimedIntervalForWave(1)).toBe(132);
    expect(bossAimedIntervalForWave(20)).toBe(60);
  });
  it('aimed spread count: 3 by default, 5 at wave 10+', () => {
    expect(bossAimedSpreadCountForWave(1)).toBe(3);
    expect(bossAimedSpreadCountForWave(5)).toBe(3);
    expect(bossAimedSpreadCountForWave(10)).toBe(5);
  });
});
