import { describe, it, expect } from 'vitest';
import {
  createActiveEffects,
  isSlowActive, isMagnetActive, isFrenzyActive, isGhostActive,
  effectiveMaxSpeed, effectiveFriction, effectiveComboTimeout,
  effectiveTrailLength, effectivePowerupInterval, effectiveSpikeInterval,
  effectiveComboMultiplier,
} from '../src/game/ActiveEffects';
import {
  PLAYER_MAX_SPEED, PLAYER_FRICTION, PLAYER_TRAIL_LENGTH, COMBO_TIMEOUT,
  POWERUP_SPAWN_INTERVAL, UPGRADE_LUCKY_DROP_INTERVAL, UPGRADE_BLITZ_RATE_MULT,
  SPIKE_SPAWN_INTERVAL_MIN,
  UPGRADE_SPEED_DEMON_MAXSPEED, UPGRADE_SPEED_DEMON_FRICTION,
  UPGRADE_COMBO_MASTER_TIMEOUT, UPGRADE_WIDE_TRAIL_LENGTH,
} from '../src/game/constants';

describe('createActiveEffects', () => {
  it('returns zeroed-out defaults', () => {
    const e = createActiveEffects();
    expect(e.shield).toBe(false);
    expect(e.slowUntil).toBe(0);
    expect(e.pickedUpgrades.size).toBe(0);
  });
});

describe('powerup timers', () => {
  it('isSlowActive when frame < slowUntil', () => {
    const e = createActiveEffects();
    e.slowUntil = 100;
    expect(isSlowActive(e, 50)).toBe(true);
    expect(isSlowActive(e, 100)).toBe(false);
  });
  it('isMagnetActive', () => {
    const e = createActiveEffects();
    e.magnetUntil = 200;
    expect(isMagnetActive(e, 199)).toBe(true);
    expect(isMagnetActive(e, 200)).toBe(false);
  });
  it('isFrenzyActive', () => {
    const e = createActiveEffects();
    e.frenzyUntil = 50;
    expect(isFrenzyActive(e, 49)).toBe(true);
    expect(isFrenzyActive(e, 50)).toBe(false);
  });
  it('isGhostActive', () => {
    const e = createActiveEffects();
    e.ghostUntil = 10;
    expect(isGhostActive(e, 9)).toBe(true);
    expect(isGhostActive(e, 10)).toBe(false);
  });
});

describe('effective values — defaults', () => {
  it('effectiveMaxSpeed returns base', () => expect(effectiveMaxSpeed(createActiveEffects())).toBe(PLAYER_MAX_SPEED));
  it('effectiveFriction returns base', () => expect(effectiveFriction(createActiveEffects())).toBe(PLAYER_FRICTION));
  it('effectiveComboTimeout returns base', () => expect(effectiveComboTimeout(createActiveEffects())).toBe(COMBO_TIMEOUT));
  it('effectiveTrailLength returns base', () => expect(effectiveTrailLength(createActiveEffects())).toBe(PLAYER_TRAIL_LENGTH));
  it('effectivePowerupInterval returns base without luckyDrop', () => {
    expect(effectivePowerupInterval(createActiveEffects())).toBe(POWERUP_SPAWN_INTERVAL);
  });
  it('effectivePowerupInterval returns lucky interval with luckyDrop', () => {
    const e = createActiveEffects();
    e.luckyDrop = true;
    expect(effectivePowerupInterval(e)).toBe(UPGRADE_LUCKY_DROP_INTERVAL);
  });
  it('effectiveSpikeInterval unchanged without blitz', () => {
    expect(effectiveSpikeInterval(60, createActiveEffects())).toBe(60);
  });
  it('effectiveSpikeInterval applies blitz and respects min', () => {
    const e = createActiveEffects();
    e.blitz = true;
    expect(effectiveSpikeInterval(60, e)).toBe(Math.max(SPIKE_SPAWN_INTERVAL_MIN, 60 * UPGRADE_BLITZ_RATE_MULT));
  });
  it('effectiveComboMultiplier is 1 without frenzy', () => {
    expect(effectiveComboMultiplier(createActiveEffects(), 0)).toBe(1);
  });
  it('effectiveComboMultiplier is 2 during frenzy', () => {
    const e = createActiveEffects();
    e.frenzyUntil = 100;
    expect(effectiveComboMultiplier(e, 50)).toBe(2);
  });
});

describe('effective values — with upgrades', () => {
  it('effectiveMaxSpeed adds bonus', () => {
    const e = createActiveEffects();
    e.maxSpeedBonus = UPGRADE_SPEED_DEMON_MAXSPEED - PLAYER_MAX_SPEED;
    expect(effectiveMaxSpeed(e)).toBe(UPGRADE_SPEED_DEMON_MAXSPEED);
  });
  it('effectiveFriction uses frictionOverride', () => {
    const e = createActiveEffects();
    e.frictionOverride = UPGRADE_SPEED_DEMON_FRICTION;
    expect(effectiveFriction(e)).toBe(UPGRADE_SPEED_DEMON_FRICTION);
  });
  it('effectiveComboTimeout adds bonus', () => {
    const e = createActiveEffects();
    e.comboTimeoutBonus = UPGRADE_COMBO_MASTER_TIMEOUT - COMBO_TIMEOUT;
    expect(effectiveComboTimeout(e)).toBe(UPGRADE_COMBO_MASTER_TIMEOUT);
  });
  it('effectiveTrailLength adds bonus', () => {
    const e = createActiveEffects();
    e.trailLengthBonus = UPGRADE_WIDE_TRAIL_LENGTH - PLAYER_TRAIL_LENGTH;
    expect(effectiveTrailLength(e)).toBe(UPGRADE_WIDE_TRAIL_LENGTH);
  });
});
