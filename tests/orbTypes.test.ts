import { describe, it, expect } from 'vitest';
import { weightedOrbType } from '../src/game/Orb';
import { ORB_STANDARD_WEIGHT, ORB_GOLD_WEIGHT, ORB_BOMB_WEIGHT } from '../src/game/constants';

describe('weightedOrbType', () => {
  it('returns a valid type', () => {
    expect(['standard', 'gold', 'bomb']).toContain(weightedOrbType(0.5));
  });
  it('returns standard at rand=0', () => {
    expect(weightedOrbType(0)).toBe('standard');
  });
  it('returns standard just below standard boundary', () => {
    const total = ORB_STANDARD_WEIGHT + ORB_GOLD_WEIGHT + ORB_BOMB_WEIGHT;
    expect(weightedOrbType((ORB_STANDARD_WEIGHT / total) - 0.001)).toBe('standard');
  });
  it('returns gold in gold band', () => {
    const total = ORB_STANDARD_WEIGHT + ORB_GOLD_WEIGHT + ORB_BOMB_WEIGHT;
    expect(weightedOrbType((ORB_STANDARD_WEIGHT / total) + 0.001)).toBe('gold');
  });
  it('returns bomb near rand=1', () => {
    expect(weightedOrbType(0.9999)).toBe('bomb');
  });
});
