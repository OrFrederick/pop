import { describe, it, expect } from 'vitest';
import { weightedPowerupType, POWERUP_HUES } from '../src/game/Powerup';
import { MAX_LIVES } from '../src/game/constants';

describe('weightedPowerupType', () => {
  it('returns a valid type', () => {
    const valid = ['shield', 'slow', 'magnet', 'frenzy', 'ghost', 'heart'];
    expect(valid).toContain(weightedPowerupType(0.5, 3));
  });
  it('heart appears when lives < MAX_LIVES', () => {
    let count = 0;
    for (let i = 0; i < 1000; i++) if (weightedPowerupType(Math.random(), MAX_LIVES - 1) === 'heart') count++;
    expect(count).toBeGreaterThan(0);
  });
  it('heart never appears when lives = MAX_LIVES', () => {
    for (let i = 0; i < 500; i++) {
      expect(weightedPowerupType(Math.random(), MAX_LIVES)).not.toBe('heart');
    }
  });
  it('all 5 non-heart types appear at MAX_LIVES', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 2000; i++) seen.add(weightedPowerupType(Math.random(), MAX_LIVES));
    for (const t of ['shield', 'slow', 'magnet', 'frenzy', 'ghost']) {
      expect(seen.has(t)).toBe(true);
    }
  });
});

describe('POWERUP_HUES', () => {
  it('each type has a numeric hue', () => {
    for (const t of ['shield', 'slow', 'magnet', 'frenzy', 'ghost', 'heart'] as const) {
      expect(typeof POWERUP_HUES[t]).toBe('number');
    }
  });
});
