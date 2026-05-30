export type StatId =
  | 'regen' | 'maxHealth' | 'bodyDamage'
  | 'bulletSpeed' | 'piercing' | 'bulletDamage'
  | 'reload' | 'moveSpeed';

export const STAT_IDS: StatId[] = [
  'regen', 'maxHealth', 'bodyDamage',
  'bulletSpeed', 'piercing', 'bulletDamage',
  'reload', 'moveSpeed',
];

export const STAT_MAX = 7;

export interface StatTree {
  regen: number;
  maxHealth: number;
  bodyDamage: number;
  bulletSpeed: number;
  piercing: number;
  bulletDamage: number;
  reload: number;
  moveSpeed: number;
}

export const STAT_NAMES: Record<StatId, string> = {
  regen: 'Health Regen',
  maxHealth: 'Max Health',
  bodyDamage: 'Body Damage',
  bulletSpeed: 'Bullet Speed',
  piercing: 'Bullet Penetration',
  bulletDamage: 'Bullet Damage',
  reload: 'Reload',
  moveSpeed: 'Movement Speed',
};

export function createStatTree(): StatTree {
  return {
    regen: 0, maxHealth: 0, bodyDamage: 0,
    bulletSpeed: 0, piercing: 0, bulletDamage: 0,
    reload: 0, moveSpeed: 0,
  };
}

export function invest(tree: StatTree, id: StatId): boolean {
  if (tree[id] >= STAT_MAX) return false;
  tree[id]++;
  return true;
}

export function maxSpeedMult(level: number): number {
  return 1 + level * 0.09;
}
export function reloadMult(level: number): number {
  return Math.pow(0.88, level);
}
export function bulletSpeedMult(level: number): number {
  return Math.pow(1.1, level);
}
export function bulletDamageBonus(level: number): number { return level; }
export function piercingBonus(level: number): number { return level; }
export function maxHealthBonus(level: number): number { return level; }
export function regenIntervalFrames(level: number): number {
  if (level === 0) return 0;
  return Math.round(600 / level);
}
export function bodyDamageEnabled(level: number): boolean { return level >= 1; }
