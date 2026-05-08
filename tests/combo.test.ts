import { describe, it, expect } from 'vitest';
import { COMBO_TIMEOUT } from '../src/game/constants';

function tickCombo(combo: number, timer: number): { combo: number; timer: number } {
  if (timer > 0) return { combo, timer: timer - 1 };
  return { combo: 0, timer: 0 };
}

function collectOrb(combo: number): { combo: number; timer: number } {
  return { combo: combo + 1, timer: COMBO_TIMEOUT };
}

function spikeHit(): { combo: number; timer: number } {
  return { combo: 0, timer: 0 };
}

describe('combo timer', () => {
  it('COMBO_TIMEOUT is 90 frames (~1.5s at 60fps)', () => {
    expect(COMBO_TIMEOUT).toBe(90);
  });

  it('combo resets when timer reaches zero', () => {
    let state = { combo: 3, timer: 1 };
    state = tickCombo(state.combo, state.timer); // timer → 0
    state = tickCombo(state.combo, state.timer); // timer was 0 → reset
    expect(state.combo).toBe(0);
  });

  it('combo persists while timer > 0', () => {
    const state = tickCombo(3, 45);
    expect(state.combo).toBe(3);
    expect(state.timer).toBe(44);
  });

  it('collecting orb increments combo and resets timer', () => {
    const state = collectOrb(2);
    expect(state.combo).toBe(3);
    expect(state.timer).toBe(COMBO_TIMEOUT);
  });

  it('spike hit resets combo and timer to zero', () => {
    const state = spikeHit();
    expect(state.combo).toBe(0);
    expect(state.timer).toBe(0);
  });

  it('chain of orbs builds combo', () => {
    let state = { combo: 0, timer: 0 };
    for (let i = 0; i < 5; i++) {
      state = collectOrb(state.combo);
    }
    expect(state.combo).toBe(5);
    expect(state.timer).toBe(COMBO_TIMEOUT);
  });
});
