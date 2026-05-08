import { describe, it, expect } from 'vitest';
import { UPGRADE_POOL, pickUpgradeOptions } from '../src/game/UpgradeScreen';
import type { UpgradeId } from '../src/game/ActiveEffects';

const ALL_IDS = ['speed_demon','iron_grip','combo_master','orb_pull','lucky_drop',
  'berserker','extra_life','blitz','collector','wide_trail'] as UpgradeId[];

describe('UPGRADE_POOL', () => {
  it('has 10 entries', () => expect(UPGRADE_POOL.length).toBe(10));
  it('all ids are unique', () => {
    const ids = UPGRADE_POOL.map(u => u.id);
    expect(new Set(ids).size).toBe(10);
  });
  it('each entry has id, name, description strings', () => {
    for (const u of UPGRADE_POOL) {
      expect(typeof u.id).toBe('string');
      expect(typeof u.name).toBe('string');
      expect(typeof u.description).toBe('string');
    }
  });
});

describe('pickUpgradeOptions', () => {
  it('returns 3 from full pool', () => {
    expect(pickUpgradeOptions(new Set(), ALL_IDS).length).toBe(3);
  });
  it('excludes already picked upgrades', () => {
    const picked = new Set<UpgradeId>(ALL_IDS.slice(0, 8));
    const result = pickUpgradeOptions(picked, ALL_IDS);
    expect(result.length).toBe(2);
    for (const r of result) expect(picked.has(r)).toBe(false);
  });
  it('returns all remaining when fewer than 3 left', () => {
    const picked = new Set<UpgradeId>(ALL_IDS.slice(0, 9));
    const result = pickUpgradeOptions(picked, ALL_IDS);
    expect(result.length).toBe(1);
  });
  it('returns empty when pool exhausted', () => {
    expect(pickUpgradeOptions(new Set(ALL_IDS), ALL_IDS).length).toBe(0);
  });
  it('no duplicates in a single pick', () => {
    const result = pickUpgradeOptions(new Set(), ALL_IDS);
    expect(new Set(result).size).toBe(result.length);
  });
});
