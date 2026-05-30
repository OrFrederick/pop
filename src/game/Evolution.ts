import { Shard } from './Shard';
import {
  type StatTree, bulletDamageBonus, piercingBonus,
  reloadMult, bulletSpeedMult,
} from './StatTree';
import { SHARD_COOLDOWN } from './constants';

export type Tier1Id = 'twin' | 'machine_gun' | 'sniper';
export type Tier2Id =
  | 'triplet' | 'triple_shot'
  | 'gunner' | 'destroyer'
  | 'assassin' | 'ranger';
export type Tier3Id =
  | 'octo_tank' | 'spreadshot'
  | 'quad_tank' | 'penta_shot'
  | 'annihilator' | 'hybrid'
  | 'streamliner' | 'fighter'
  | 'predator' | 'rocketeer'
  | 'stalker';

export type EvolutionId = Tier1Id | Tier2Id | Tier3Id;

export interface EvolutionDef {
  id: EvolutionId;
  name: string;
  description: string;
}

export interface EvolutionState {
  tier1: Tier1Id | null;
  tier2: Tier2Id | null;
  tier3: Tier3Id | null;
  cooldownFrames(stats: StatTree): number;
}

export const EVOLUTION_TIERS = {
  tier1: [
    { id: 'twin' as Tier1Id, name: 'Twin', description: '2 parallel shards · +20% cooldown' },
    { id: 'machine_gun' as Tier1Id, name: 'Machine Gun', description: 'Cooldown ×0.55 · slight spread' },
    { id: 'sniper' as Tier1Id, name: 'Sniper', description: '×2 dmg · ×1.5 speed · +50% cooldown' },
  ] as EvolutionDef[],
  tier2: [
    { id: 'triplet' as Tier2Id, name: 'Triplet', description: '3 shards in fan' },
    { id: 'triple_shot' as Tier2Id, name: 'Triple Shot', description: '3 shards forward' },
    { id: 'gunner' as Tier2Id, name: 'Gunner', description: '4 small fast shards' },
    { id: 'destroyer' as Tier2Id, name: 'Destroyer', description: '1 huge slow shard ×4 dmg' },
    { id: 'assassin' as Tier2Id, name: 'Assassin', description: '×3 speed · ×3 dmg' },
    { id: 'ranger' as Tier2Id, name: 'Ranger', description: '+50% cooldown · long range' },
  ] as EvolutionDef[],
  tier3: [
    { id: 'octo_tank' as Tier3Id, name: 'Octo Tank', description: '8 directions auto-fire' },
    { id: 'spreadshot' as Tier3Id, name: 'Spreadshot', description: '5 shards in 30° fan' },
    { id: 'quad_tank' as Tier3Id, name: 'Quad Tank', description: '4 cardinal directions' },
    { id: 'penta_shot' as Tier3Id, name: 'Penta Shot', description: '5 shards forward' },
    { id: 'annihilator' as Tier3Id, name: 'Annihilator', description: '1 huge shard ×8 dmg' },
    { id: 'hybrid' as Tier3Id, name: 'Hybrid', description: 'Front + 2 back shards' },
    { id: 'streamliner' as Tier3Id, name: 'Streamliner', description: '×0.6 cooldown rapid fire' },
    { id: 'fighter' as Tier3Id, name: 'Fighter', description: 'Front + 2 side shards' },
    { id: 'predator' as Tier3Id, name: 'Predator', description: '3 stacked forward ×2 dmg' },
    { id: 'rocketeer' as Tier3Id, name: 'Rocketeer', description: '1 huge + 2 back ×3 dmg' },
    { id: 'stalker' as Tier3Id, name: 'Stalker', description: '×4 dmg · ×2 speed · slow reload' },
  ] as EvolutionDef[],
};

const TIER2_BRANCHES: Record<Tier1Id, Tier2Id[]> = {
  twin: ['triplet', 'triple_shot'],
  machine_gun: ['gunner', 'destroyer'],
  sniper: ['assassin', 'ranger'],
};

const TIER3_BRANCHES: Record<Tier2Id, Tier3Id[]> = {
  triplet: ['octo_tank', 'spreadshot'],
  triple_shot: ['quad_tank', 'penta_shot'],
  gunner: ['octo_tank', 'streamliner'],
  destroyer: ['annihilator', 'hybrid'],
  assassin: ['stalker', 'predator'],
  ranger: ['fighter', 'rocketeer'],
};

export function createEvolution(): EvolutionState {
  return {
    tier1: null, tier2: null, tier3: null,
    cooldownFrames(stats: StatTree): number {
      let base = SHARD_COOLDOWN;
      if (this.tier1 === 'twin') base = Math.round(SHARD_COOLDOWN * 1.2);
      else if (this.tier1 === 'machine_gun') base = Math.round(SHARD_COOLDOWN * 0.55);
      else if (this.tier1 === 'sniper') base = Math.round(SHARD_COOLDOWN * 1.5);
      if (this.tier2 === 'assassin') base = Math.round(base * 0.85);
      if (this.tier2 === 'ranger') base = Math.round(base * 1.5);
      if (this.tier2 === 'destroyer') base = Math.round(base * 1.4);
      if (this.tier3 === 'streamliner') base = Math.round(base * 0.6);
      if (this.tier3 === 'stalker') base = Math.round(base * 1.4);
      return Math.max(2, Math.round(base * reloadMult(stats.reload)));
    },
  };
}

export function applyEvolution(state: EvolutionState, id: EvolutionId): void {
  if (EVOLUTION_TIERS.tier1.some(d => d.id === id)) {
    state.tier1 = id as Tier1Id;
  } else if (EVOLUTION_TIERS.tier2.some(d => d.id === id)) {
    state.tier2 = id as Tier2Id;
  } else if (EVOLUTION_TIERS.tier3.some(d => d.id === id)) {
    state.tier3 = id as Tier3Id;
  }
}

export function evolutionChoicesForLevel(level: number, state: EvolutionState): EvolutionDef[] {
  if (level === 15 && !state.tier1) return EVOLUTION_TIERS.tier1;
  if (level === 30 && state.tier1 && !state.tier2) {
    const branchIds = TIER2_BRANCHES[state.tier1];
    return EVOLUTION_TIERS.tier2.filter(d => branchIds.includes(d.id as Tier2Id));
  }
  if (level === 45 && state.tier2 && !state.tier3) {
    const branchIds = TIER3_BRANCHES[state.tier2];
    return EVOLUTION_TIERS.tier3.filter(d => branchIds.includes(d.id as Tier3Id));
  }
  return [];
}

function buildShard(
  x: number, y: number, dx: number, dy: number,
  stats: StatTree, dmgMult = 1, speedMult = 1,
): Shard {
  const baseDmg = 1 + bulletDamageBonus(stats.bulletDamage);
  return new Shard(x, y, dx, dy, {
    damage: Math.round(baseDmg * dmgMult),
    pierce: piercingBonus(stats.piercing),
    speedMult: bulletSpeedMult(stats.bulletSpeed) * speedMult,
  });
}

function rotate(dx: number, dy: number, angle: number): [number, number] {
  const c = Math.cos(angle), s = Math.sin(angle);
  return [dx * c - dy * s, dx * s + dy * c];
}

function fireTier1(x: number, y: number, dx: number, dy: number, id: Tier1Id, st: StatTree): Shard[] {
  if (id === 'twin') {
    const px = -dy * 8, py = dx * 8;
    return [buildShard(x + px, y + py, dx, dy, st), buildShard(x - px, y - py, dx, dy, st)];
  }
  if (id === 'machine_gun') {
    const a = (Math.random() - 0.5) * 0.2;
    const [rx, ry] = rotate(dx, dy, a);
    return [buildShard(x, y, rx, ry, st)];
  }
  if (id === 'sniper') {
    return [buildShard(x, y, dx, dy, st, 2, 1.5)];
  }
  return [buildShard(x, y, dx, dy, st)];
}

function fireTier2(x: number, y: number, dx: number, dy: number, id: Tier2Id, st: StatTree): Shard[] {
  if (id === 'triplet') {
    return [-0.26, 0, 0.26].map(a => {
      const [rx, ry] = rotate(dx, dy, a);
      return buildShard(x, y, rx, ry, st);
    });
  }
  if (id === 'triple_shot') {
    return [-12, 0, 12].map(off => {
      const px = -dy * off, py = dx * off;
      return buildShard(x + px, y + py, dx, dy, st);
    });
  }
  if (id === 'gunner') {
    return [-1, -0.33, 0.33, 1].map(off => {
      const px = -dy * off * 10, py = dx * off * 10;
      return buildShard(x + px, y + py, dx, dy, st, 0.6, 1.2);
    });
  }
  if (id === 'destroyer') return [buildShard(x, y, dx, dy, st, 4, 0.7)];
  if (id === 'assassin') return [buildShard(x, y, dx, dy, st, 3, 3)];
  if (id === 'ranger') return [buildShard(x, y, dx, dy, st, 1, 2)];
  return [buildShard(x, y, dx, dy, st)];
}

function fireTier3(x: number, y: number, dx: number, dy: number, id: Tier3Id, st: StatTree): Shard[] {
  if (id === 'octo_tank') {
    return Array.from({ length: 8 }, (_, i) => {
      const [rx, ry] = rotate(1, 0, (i / 8) * Math.PI * 2);
      return buildShard(x, y, rx, ry, st);
    });
  }
  if (id === 'spreadshot') {
    return [-0.52, -0.26, 0, 0.26, 0.52].map(a => {
      const [rx, ry] = rotate(dx, dy, a);
      return buildShard(x, y, rx, ry, st);
    });
  }
  if (id === 'quad_tank') {
    return [0, Math.PI / 2, Math.PI, -Math.PI / 2].map(a => {
      const [rx, ry] = rotate(1, 0, a);
      return buildShard(x, y, rx, ry, st);
    });
  }
  if (id === 'penta_shot') {
    return [-16, -8, 0, 8, 16].map(off => {
      const px = -dy * off, py = dx * off;
      return buildShard(x + px, y + py, dx, dy, st);
    });
  }
  if (id === 'annihilator') return [buildShard(x, y, dx, dy, st, 8, 0.6)];
  if (id === 'hybrid') {
    return [
      buildShard(x, y, dx, dy, st, 2),
      buildShard(x, y, -dx, -dy, st, 0.5),
      buildShard(x, y, -dx, -dy, st, 0.5),
    ];
  }
  if (id === 'streamliner') return [buildShard(x, y, dx, dy, st, 0.8)];
  if (id === 'fighter') {
    return [-Math.PI / 2, 0, Math.PI / 2].map(a => {
      const [rx, ry] = rotate(dx, dy, a);
      return buildShard(x, y, rx, ry, st);
    });
  }
  if (id === 'predator') {
    return [0, 8, -8].map(off => {
      const ox = dx * off, oy = dy * off;
      return buildShard(x + ox, y + oy, dx, dy, st, 2);
    });
  }
  if (id === 'rocketeer') {
    return [
      buildShard(x, y, dx, dy, st, 3, 0.7),
      buildShard(x, y, -dx, -dy, st, 0.5),
      buildShard(x, y, -dx, -dy, st, 0.5),
    ];
  }
  if (id === 'stalker') return [buildShard(x, y, dx, dy, st, 4, 2)];
  return [buildShard(x, y, dx, dy, st)];
}

export function fireShards(
  x: number, y: number, dx: number, dy: number,
  evo: EvolutionState, stats: StatTree,
): Shard[] {
  if (evo.tier3) return fireTier3(x, y, dx, dy, evo.tier3, stats);
  if (evo.tier2) return fireTier2(x, y, dx, dy, evo.tier2, stats);
  if (evo.tier1) return fireTier1(x, y, dx, dy, evo.tier1, stats);
  return [buildShard(x, y, dx, dy, stats)];
}
