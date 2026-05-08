import { describe, it, expect } from 'vitest';
import { calcPoints } from '../src/game/scoring';
import { POINTS_PER_ORB } from '../src/game/constants';

describe('calcPoints', () => {
  it('awards base points when combo is 0', () => {
    expect(calcPoints(0)).toBe(POINTS_PER_ORB);
  });

  it('awards base points when combo is 1', () => {
    expect(calcPoints(1)).toBe(POINTS_PER_ORB);
  });

  it('multiplies by combo when combo > 1', () => {
    expect(calcPoints(2)).toBe(POINTS_PER_ORB * 2);
    expect(calcPoints(5)).toBe(POINTS_PER_ORB * 5);
    expect(calcPoints(10)).toBe(POINTS_PER_ORB * 10);
  });

  it('scales linearly with combo', () => {
    for (let c = 1; c <= 20; c++) {
      expect(calcPoints(c)).toBe(POINTS_PER_ORB * c);
    }
  });
});
