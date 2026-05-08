import {
  PLAYER_MAX_SPEED, PLAYER_FRICTION, PLAYER_TRAIL_LENGTH, COMBO_TIMEOUT,
  POWERUP_SPAWN_INTERVAL, UPGRADE_LUCKY_DROP_INTERVAL,
  UPGRADE_BLITZ_RATE_MULT, SPIKE_SPAWN_INTERVAL_MIN,
} from './constants';

export type PowerupType = 'shield' | 'slow' | 'magnet' | 'frenzy' | 'ghost' | 'heart';

export type UpgradeId =
  | 'speed_demon' | 'iron_grip' | 'combo_master' | 'orb_pull'
  | 'lucky_drop' | 'berserker' | 'extra_life' | 'blitz'
  | 'collector' | 'wide_trail';

export interface ActiveEffects {
  shield: boolean;
  slowUntil: number;
  magnetUntil: number;
  frenzyUntil: number;
  ghostUntil: number;
  orbPull: boolean;
  berserker: boolean;
  blitz: boolean;
  collector: number;
  comboTimeoutBonus: number;
  maxSpeedBonus: number;
  frictionOverride: number | null;
  trailLengthBonus: number;
  luckyDrop: boolean;
  pickedUpgrades: Set<UpgradeId>;
}

export function createActiveEffects(): ActiveEffects {
  return {
    shield: false, slowUntil: 0, magnetUntil: 0, frenzyUntil: 0, ghostUntil: 0,
    orbPull: false, berserker: false, blitz: false, collector: 0,
    comboTimeoutBonus: 0, maxSpeedBonus: 0, frictionOverride: null,
    trailLengthBonus: 0, luckyDrop: false, pickedUpgrades: new Set(),
  };
}

export function isSlowActive(e: ActiveEffects, frame: number): boolean { return frame < e.slowUntil; }
export function isMagnetActive(e: ActiveEffects, frame: number): boolean { return frame < e.magnetUntil; }
export function isFrenzyActive(e: ActiveEffects, frame: number): boolean { return frame < e.frenzyUntil; }
export function isGhostActive(e: ActiveEffects, frame: number): boolean { return frame < e.ghostUntil; }
export function effectiveMaxSpeed(e: ActiveEffects): number { return PLAYER_MAX_SPEED + e.maxSpeedBonus; }
export function effectiveFriction(e: ActiveEffects): number { return e.frictionOverride ?? PLAYER_FRICTION; }
export function effectiveComboTimeout(e: ActiveEffects): number { return COMBO_TIMEOUT + e.comboTimeoutBonus; }
export function effectiveTrailLength(e: ActiveEffects): number { return PLAYER_TRAIL_LENGTH + e.trailLengthBonus; }
export function effectivePowerupInterval(e: ActiveEffects): number {
  return e.luckyDrop ? UPGRADE_LUCKY_DROP_INTERVAL : POWERUP_SPAWN_INTERVAL;
}
export function effectiveSpikeInterval(base: number, e: ActiveEffects): number {
  return e.blitz ? Math.max(SPIKE_SPAWN_INTERVAL_MIN, base * UPGRADE_BLITZ_RATE_MULT) : base;
}
export function effectiveComboMultiplier(e: ActiveEffects, frame: number): number {
  return isFrenzyActive(e, frame) ? 2 : 1;
}
