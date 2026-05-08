import { describe, it, expect } from 'vitest';
import { circleCircle, circleCircleShrunk } from '../src/game/collisions';
describe('circleCircle', () => {
    it('detects overlapping circles', () => {
        expect(circleCircle({ x: 0, y: 0, r: 10 }, { x: 5, y: 0, r: 10 })).toBe(true);
    });
    it('rejects non-overlapping circles', () => {
        expect(circleCircle({ x: 0, y: 0, r: 5 }, { x: 20, y: 0, r: 5 })).toBe(false);
    });
    it('detects circles whose centres are closer than sum of radii', () => {
        expect(circleCircle({ x: 0, y: 0, r: 10 }, { x: 19, y: 0, r: 10 })).toBe(true);
    });
    it('rejects circles whose centres equal the sum of radii', () => {
        // distance === sum of radii → NOT less than → false
        expect(circleCircle({ x: 0, y: 0, r: 10 }, { x: 20, y: 0, r: 10 })).toBe(false);
    });
    it('works in both axes', () => {
        expect(circleCircle({ x: 0, y: 0, r: 10 }, { x: 0, y: 5, r: 10 })).toBe(true);
        expect(circleCircle({ x: 0, y: 0, r: 5 }, { x: 0, y: 20, r: 5 })).toBe(false);
    });
    it('same position always overlaps', () => {
        expect(circleCircle({ x: 100, y: 100, r: 1 }, { x: 100, y: 100, r: 1 })).toBe(true);
    });
});
describe('circleCircleShrunk', () => {
    it('shrinks effective collision radius', () => {
        // Without shrink: distance 18 < radii sum 20 → true
        expect(circleCircle({ x: 0, y: 0, r: 10 }, { x: 18, y: 0, r: 10 })).toBe(true);
        // With shrink 2: effective sum = 18, distance 18 → NOT less than → false
        expect(circleCircleShrunk({ x: 0, y: 0, r: 10 }, { x: 18, y: 0, r: 10 }, 2)).toBe(false);
    });
    it('shrink 0 behaves like circleCircle', () => {
        expect(circleCircleShrunk({ x: 0, y: 0, r: 10 }, { x: 5, y: 0, r: 10 }, 0)).toBe(true);
        expect(circleCircleShrunk({ x: 0, y: 0, r: 5 }, { x: 20, y: 0, r: 5 }, 0)).toBe(false);
    });
});
