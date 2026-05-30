import { describe, it, expect } from 'vitest';
import { Sweep } from '../src/game/Sweep';

describe('Sweep', () => {
  it('telegraph delays bullet spawn', () => {
    const s = new Sweep('left', 800, 600);
    s.update();
    expect(s.bullets().length).toBe(0);
  });

  it('left-edge sweep bullets all move right after telegraph', () => {
    const s = new Sweep('left', 800, 600);
    for (let i = 0; i < 31; i++) s.update(1);
    const b = s.bullets();
    expect(b.length).toBeGreaterThan(0);
    for (const bb of b) expect(bb.vx).toBeGreaterThan(0);
  });

  it('right sweep bullets move left', () => {
    const s = new Sweep('right', 800, 600);
    for (let i = 0; i < 31; i++) s.update(1);
    for (const bb of s.bullets()) expect(bb.vx).toBeLessThan(0);
  });

  it('done when all bullets offscreen', () => {
    const s = new Sweep('left', 200, 200);
    for (let i = 0; i < 500; i++) s.update(1);
    expect(s.done(200, 200)).toBe(true);
  });
});
