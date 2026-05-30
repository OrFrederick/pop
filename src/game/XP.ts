export const XP_LEVEL_CAP = 45;
export const XP_BASE = 100;
export const XP_PER_LEVEL_GROWTH = 25;

export const XP_ORB = 3;
export const XP_GOLD = 9;
export const XP_SHARD_KILL = 6;
export const XP_BOSS_HIT = 15;
export const XP_BOSS_KILL = 75;

export interface XPState {
  level: number;
  xp: number;
  points: number;
  leveledUp: boolean;
  newLevels: number[];
}

export function createXP(): XPState {
  return { level: 1, xp: 0, points: 0, leveledUp: false, newLevels: [] };
}

export function xpForNextLevel(level: number): number {
  return XP_BASE + (level - 1) * XP_PER_LEVEL_GROWTH;
}

export function addXP(state: XPState, amount: number): XPState {
  if (state.level >= XP_LEVEL_CAP) {
    return { ...state, leveledUp: false, newLevels: [] };
  }
  let level = state.level;
  let xp = state.xp;
  let points = state.points;
  const gained: number[] = [];
  xp += amount;
  while (level < XP_LEVEL_CAP && xp >= xpForNextLevel(level)) {
    xp -= xpForNextLevel(level);
    level++;
    points++;
    gained.push(level);
  }
  if (level >= XP_LEVEL_CAP) xp = 0;
  return { level, xp, points, leveledUp: gained.length > 0, newLevels: gained };
}

export function xpFromCombo(base: number, combo: number): number {
  const mult = Math.min(2, 1 + combo * 0.05);
  return Math.round(base * mult);
}
