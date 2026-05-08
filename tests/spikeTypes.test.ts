import { describe, it, expect } from 'vitest';
import { spikeTypeForWave, spikeSpeedMult, spikeRadiusFor } from '../src/game/Spike';
import {
  SPIKE_FAST_SPEED_MULT, SPIKE_HEAVY_SPEED_MULT,
  SPIKE_FAST_RADIUS, SPIKE_HEAVY_RADIUS,
} from '../src/game/constants';

describe('spikeTypeForWave', () => {
  it('wave 1: only standard', () => {
    const types = Array.from({ length: 200 }, () => spikeTypeForWave(1, Math.random()));
    expect(types.every(t => t === 'standard')).toBe(true);
  });
  it('wave 2: fast spikes appear', () => {
    const types = Array.from({ length: 1000 }, () => spikeTypeForWave(2, Math.random()));
    expect(types.some(t => t === 'fast')).toBe(true);
    expect(types.every(t => t !== 'heavy')).toBe(true);
  });
  it('wave 3: heavy spikes appear', () => {
    const types = Array.from({ length: 1000 }, () => spikeTypeForWave(3, Math.random()));
    expect(types.some(t => t === 'heavy')).toBe(true);
    expect(types.every(t => t !== 'ghost')).toBe(true);
  });
  it('wave 4+: ghost spikes appear', () => {
    const types = Array.from({ length: 1000 }, () => spikeTypeForWave(4, Math.random()));
    expect(types.some(t => t === 'ghost')).toBe(true);
  });
});

describe('spikeSpeedMult', () => {
  it('standard = 1', () => expect(spikeSpeedMult('standard')).toBe(1));
  it('fast = SPIKE_FAST_SPEED_MULT', () => expect(spikeSpeedMult('fast')).toBe(SPIKE_FAST_SPEED_MULT));
  it('heavy = SPIKE_HEAVY_SPEED_MULT', () => expect(spikeSpeedMult('heavy')).toBe(SPIKE_HEAVY_SPEED_MULT));
  it('ghost = 1', () => expect(spikeSpeedMult('ghost')).toBe(1));
});

describe('spikeRadiusFor', () => {
  it('standard = 14', () => expect(spikeRadiusFor('standard')).toBe(14));
  it('fast = SPIKE_FAST_RADIUS', () => expect(spikeRadiusFor('fast')).toBe(SPIKE_FAST_RADIUS));
  it('heavy = SPIKE_HEAVY_RADIUS', () => expect(spikeRadiusFor('heavy')).toBe(SPIKE_HEAVY_RADIUS));
  it('ghost = 14', () => expect(spikeRadiusFor('ghost')).toBe(14));
});
