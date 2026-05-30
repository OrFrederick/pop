import { describe, it, expect } from 'vitest';
import {
  createEvolution, fireShards, EVOLUTION_TIERS,
  evolutionChoicesForLevel, applyEvolution,
} from '../src/game/Evolution';
import { createStatTree } from '../src/game/StatTree';

describe('Evolution defaults', () => {
  it('starts as basic', () => {
    const e = createEvolution();
    expect(e.tier1).toBe(null);
    expect(e.tier2).toBe(null);
    expect(e.tier3).toBe(null);
  });

  it('basic fire returns 1 shard forward', () => {
    const e = createEvolution();
    const st = createStatTree();
    const shards = fireShards(100, 100, 1, 0, e, st);
    expect(shards.length).toBe(1);
    expect(shards[0].vx).toBeGreaterThan(0);
  });

  it('reload cooldown 12 at base', () => {
    const e = createEvolution();
    const st = createStatTree();
    expect(e.cooldownFrames(st)).toBe(12);
  });
});

describe('Tier choices', () => {
  it('level 15 returns 3 tier-1 options', () => {
    const opts = evolutionChoicesForLevel(15, createEvolution());
    expect(opts.length).toBe(3);
    expect(opts.map(o => o.id).sort()).toEqual(['machine_gun', 'sniper', 'twin']);
  });

  it('level 30 returns 2 options from tier-1 branch', () => {
    const e = createEvolution();
    applyEvolution(e, 'twin');
    const opts = evolutionChoicesForLevel(30, e);
    expect(opts.length).toBe(2);
    expect(opts.map(o => o.id).sort()).toEqual(['triple_shot', 'triplet']);
  });

  it('level 45 returns 2 options from tier-2 branch', () => {
    const e = createEvolution();
    applyEvolution(e, 'twin');
    applyEvolution(e, 'triplet');
    const opts = evolutionChoicesForLevel(45, e);
    expect(opts.length).toBe(2);
  });

  it('non-milestone level returns empty', () => {
    expect(evolutionChoicesForLevel(10, createEvolution()).length).toBe(0);
  });
});

describe('Tier fire patterns', () => {
  it('twin fires 2 shards', () => {
    const e = createEvolution();
    applyEvolution(e, 'twin');
    const shards = fireShards(0, 0, 1, 0, e, createStatTree());
    expect(shards.length).toBe(2);
  });

  it('sniper fires 1 shard with higher damage', () => {
    const e = createEvolution();
    applyEvolution(e, 'sniper');
    const shards = fireShards(0, 0, 1, 0, e, createStatTree());
    expect(shards.length).toBe(1);
    expect(shards[0].damage).toBeGreaterThan(1);
  });

  it('octo_tank fires 8 shards', () => {
    const e = createEvolution();
    applyEvolution(e, 'machine_gun');
    applyEvolution(e, 'gunner');
    applyEvolution(e, 'octo_tank');
    const shards = fireShards(0, 0, 1, 0, e, createStatTree());
    expect(shards.length).toBe(8);
  });

  it('gunner fires 4 shards', () => {
    const e = createEvolution();
    applyEvolution(e, 'machine_gun');
    applyEvolution(e, 'gunner');
    const shards = fireShards(0, 0, 1, 0, e, createStatTree());
    expect(shards.length).toBe(4);
  });

  it('spreadshot fires 5 shards', () => {
    const e = createEvolution();
    applyEvolution(e, 'twin');
    applyEvolution(e, 'triplet');
    applyEvolution(e, 'spreadshot');
    const shards = fireShards(0, 0, 1, 0, e, createStatTree());
    expect(shards.length).toBe(5);
  });
});

describe('EVOLUTION_TIERS structure', () => {
  it('has tier1 (3), tier2 (6), tier3 (11 ids)', () => {
    expect(EVOLUTION_TIERS.tier1.length).toBe(3);
    expect(EVOLUTION_TIERS.tier2.length).toBe(6);
    expect(EVOLUTION_TIERS.tier3.length).toBe(11);
  });
});
