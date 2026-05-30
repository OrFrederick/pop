# Diep.io-Style Progression Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add XP/level progression, an 8-stat upgrade tree (1–8 keys to invest), 3-tier tank evolutions, and wave-scaled bullet-hell density to POP.

**Architecture:** All new state lives in pure modules (`XP.ts`, `StatTree.ts`, `Evolution.ts`) consumed by `Game.ts`. Existing per-boss perk upgrade screen stays. Player shard fire is delegated to an `Evolution.fire()` resolver. Boss patterns read wave-scaled counts from helper. Each module is unit-testable in Vitest without DOM.

**Tech Stack:** TypeScript strict, Canvas 2D, Vitest, Vite, no engines.

**Spec:** `docs/superpowers/specs/2026-05-30-diep-progression-design.md`

---

## File Structure

**New (pure logic):**
- `src/game/XP.ts` — XP state, `xpForNextLevel(level)`, `addXP(state, amount)`, level-up detection
- `src/game/StatTree.ts` — 8 stat ids, `createStatTree()`, `invest(tree, id)`, derived getters
- `src/game/Evolution.ts` — class tree, `fireShards(player, evolution, statTree)` returns Shard[], evolution branching
- `src/game/Sweep.ts` — ambient hazard, `Sweep` class with bullets along edge

**New (UI):**
- `src/ui/StatHUD.ts` — bottom-left vertical 8-row stat panel (DOM)
- `src/ui/XPBar.ts` — XP bar + level display (DOM)
- `src/ui/EvolutionScreen.ts` — class choice overlay (DOM, mirrors UpgradeScreen)

**Modified:**
- `src/game/constants.ts` — add tuning constants
- `src/game/Shard.ts` — add `damage` and `pierce` fields
- `src/game/Player.ts` — accept stat-derived max speed / friction; fire delegated to Evolution
- `src/game/PulseBoss.ts` — accept wave for pattern scaling
- `src/game/Game.ts` — wire XP, stats, evolution, sweep, scaled boss interval
- `src/ui/HUD.ts` — leave score/lives/wave; XP/level moved to dedicated `XPBar`
- `index.html` — add `#xp-bar`, `#stat-hud` containers
- `src/styles.css` — styles for new HUD widgets

---

## Phase A: XP + Level System

### Task A1: Create XP module with pure state and level-up math

**Files:**
- Create: `src/game/XP.ts`
- Test: `tests/xp.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/xp.test.ts
import { describe, it, expect } from 'vitest';
import { createXP, addXP, xpForNextLevel, XP_LEVEL_CAP } from '../src/game/XP';

describe('XP', () => {
  it('starts at level 1, 0 xp, 0 points', () => {
    const s = createXP();
    expect(s.level).toBe(1);
    expect(s.xp).toBe(0);
    expect(s.points).toBe(0);
  });

  it('xpForNextLevel grows: L1=100, L2=125, L3=150', () => {
    expect(xpForNextLevel(1)).toBe(100);
    expect(xpForNextLevel(2)).toBe(125);
    expect(xpForNextLevel(3)).toBe(150);
  });

  it('addXP under threshold accumulates', () => {
    const s = createXP();
    const r = addXP(s, 50);
    expect(r.xp).toBe(50);
    expect(r.level).toBe(1);
    expect(r.points).toBe(0);
    expect(r.leveledUp).toBe(false);
  });

  it('addXP crossing threshold levels up and grants point', () => {
    const s = createXP();
    const r = addXP(s, 100);
    expect(r.level).toBe(2);
    expect(r.xp).toBe(0);
    expect(r.points).toBe(1);
    expect(r.leveledUp).toBe(true);
  });

  it('addXP handles multi-level in one call', () => {
    const s = createXP();
    const r = addXP(s, 500);
    expect(r.level).toBeGreaterThanOrEqual(3);
    expect(r.points).toBeGreaterThanOrEqual(2);
  });

  it('caps at XP_LEVEL_CAP', () => {
    const s = createXP();
    s.level = XP_LEVEL_CAP;
    s.xp = 0;
    const r = addXP(s, 9999);
    expect(r.level).toBe(XP_LEVEL_CAP);
    expect(r.xp).toBe(0);
    expect(r.leveledUp).toBe(false);
  });
});
```

- [ ] **Step 2: Verify failing**

Run: `bun run test -- tests/xp.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement XP.ts**

```ts
// src/game/XP.ts
export const XP_LEVEL_CAP = 45;
export const XP_BASE = 100;
export const XP_PER_LEVEL_GROWTH = 25;

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
  let { level, xp, points } = state;
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
```

- [ ] **Step 4: Verify passing**

Run: `bun run test -- tests/xp.test.ts`
Expected: PASS all.

- [ ] **Step 5: Commit**

```bash
git add src/game/XP.ts tests/xp.test.ts
git commit -m "feat(progression): XP module with level-up math"
```

---

### Task A2: Add XP gain helpers + combo bonus

**Files:**
- Modify: `src/game/XP.ts`
- Test: `tests/xp.test.ts`

- [ ] **Step 1: Append failing tests**

```ts
// add to tests/xp.test.ts
import { xpFromCombo, XP_ORB, XP_GOLD, XP_SHARD_KILL, XP_BOSS_HIT, XP_BOSS_KILL } from '../src/game/XP';

describe('XP gain helpers', () => {
  it('exports flat values', () => {
    expect(XP_ORB).toBe(3);
    expect(XP_GOLD).toBe(9);
    expect(XP_SHARD_KILL).toBe(6);
    expect(XP_BOSS_HIT).toBe(15);
    expect(XP_BOSS_KILL).toBe(75);
  });
  it('xpFromCombo at combo 0 = base', () => {
    expect(xpFromCombo(10, 0)).toBe(10);
  });
  it('xpFromCombo scales 5% per combo, capped at 2x', () => {
    expect(xpFromCombo(10, 10)).toBe(15);
    expect(xpFromCombo(10, 100)).toBe(20);
  });
});
```

- [ ] **Step 2: Verify failing**

Run: `bun run test -- tests/xp.test.ts`
Expected: FAIL on new tests.

- [ ] **Step 3: Add exports**

Append to `src/game/XP.ts`:

```ts
export const XP_ORB = 3;
export const XP_GOLD = 9;
export const XP_SHARD_KILL = 6;
export const XP_BOSS_HIT = 15;
export const XP_BOSS_KILL = 75;

export function xpFromCombo(base: number, combo: number): number {
  const mult = Math.min(2, 1 + combo * 0.05);
  return Math.round(base * mult);
}
```

- [ ] **Step 4: Verify passing**

Run: `bun run test -- tests/xp.test.ts`
Expected: PASS all.

- [ ] **Step 5: Commit**

```bash
git add src/game/XP.ts tests/xp.test.ts
git commit -m "feat(progression): XP gain constants + combo bonus"
```

---

### Task A3: Build XPBar UI widget (DOM)

**Files:**
- Create: `src/ui/XPBar.ts`
- Modify: `index.html`, `src/styles.css`

- [ ] **Step 1: Edit `index.html` — add XP bar slot under wave badge**

Replace the `<div class="wave-badge" id="wave">Wave 1</div>` line with:

```html
  <div class="wave-badge" id="wave">Wave 1</div>
  <div class="xp-wrap" id="xp-wrap">
    <div class="xp-row"><span id="xp-level">Lv 1</span><span id="xp-text">0 / 100</span></div>
    <div class="xp-bar-bg"><div class="xp-bar-fill" id="xp-bar-fill"></div></div>
  </div>
```

- [ ] **Step 2: Append styles to `src/styles.css`**

```css
.xp-wrap {
  position: fixed;
  top: 110px;
  right: 16px;
  width: 200px;
  font: 600 12px -apple-system, system-ui, sans-serif;
  pointer-events: none;
}
.xp-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  color: rgba(255,255,255,0.75);
  letter-spacing: 1px;
}
.xp-bar-bg {
  width: 100%;
  height: 6px;
  background: rgba(255,255,255,0.08);
  border-radius: 999px;
  overflow: hidden;
}
.xp-bar-fill {
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, #6ee7ff, #a78bfa);
  transition: width 0.15s ease-out;
}
```

- [ ] **Step 3: Create XPBar.ts**

```ts
// src/ui/XPBar.ts
import { xpForNextLevel, XP_LEVEL_CAP, type XPState } from '../game/XP';

export class XPBar {
  private readonly levelEl: HTMLElement;
  private readonly textEl: HTMLElement;
  private readonly fillEl: HTMLElement;

  constructor() {
    this.levelEl = document.getElementById('xp-level')!;
    this.textEl = document.getElementById('xp-text')!;
    this.fillEl = document.getElementById('xp-bar-fill')!;
  }

  update(s: XPState): void {
    this.levelEl.textContent = `Lv ${s.level}`;
    if (s.level >= XP_LEVEL_CAP) {
      this.textEl.textContent = 'MAX';
      this.fillEl.style.width = '100%';
      return;
    }
    const need = xpForNextLevel(s.level);
    this.textEl.textContent = `${s.xp} / ${need}`;
    this.fillEl.style.width = `${(s.xp / need) * 100}%`;
  }
}
```

- [ ] **Step 4: Verify typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/XPBar.ts index.html src/styles.css
git commit -m "feat(progression): XPBar HUD widget"
```

---

## Phase B: Stat Tree

### Task B1: Define StatTree module (pure)

**Files:**
- Create: `src/game/StatTree.ts`
- Test: `tests/statTree.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/statTree.test.ts
import { describe, it, expect } from 'vitest';
import {
  createStatTree, invest, STAT_IDS, STAT_MAX,
  maxSpeedMult, reloadMult, bulletSpeedMult,
  bulletDamageBonus, piercingBonus, maxHealthBonus,
  regenIntervalFrames, bodyDamageEnabled,
} from '../src/game/StatTree';

describe('StatTree', () => {
  it('exports 8 stat ids', () => expect(STAT_IDS.length).toBe(8));
  it('STAT_MAX = 7', () => expect(STAT_MAX).toBe(7));
  it('creates with all 0', () => {
    const t = createStatTree();
    for (const id of STAT_IDS) expect(t[id]).toBe(0);
  });
  it('invest increments only if level < max', () => {
    const t = createStatTree();
    expect(invest(t, 'reload')).toBe(true);
    expect(t.reload).toBe(1);
    for (let i = 0; i < 6; i++) invest(t, 'reload');
    expect(t.reload).toBe(7);
    expect(invest(t, 'reload')).toBe(false);
    expect(t.reload).toBe(7);
  });
});

describe('Stat derived values', () => {
  it('maxSpeedMult: 1.0 at L0, monotonic', () => {
    expect(maxSpeedMult(0)).toBe(1);
    expect(maxSpeedMult(7)).toBeGreaterThan(1);
  });
  it('reloadMult: 1.0 at L0, 0.88 at L1', () => {
    expect(reloadMult(0)).toBe(1);
    expect(reloadMult(1)).toBeCloseTo(0.88);
  });
  it('bulletSpeedMult: 1.0 at L0, 1.1 at L1', () => {
    expect(bulletSpeedMult(0)).toBe(1);
    expect(bulletSpeedMult(1)).toBeCloseTo(1.1);
  });
  it('bulletDamageBonus = level', () => {
    expect(bulletDamageBonus(0)).toBe(0);
    expect(bulletDamageBonus(4)).toBe(4);
  });
  it('piercingBonus = level', () => {
    expect(piercingBonus(0)).toBe(0);
    expect(piercingBonus(3)).toBe(3);
  });
  it('maxHealthBonus = level', () => {
    expect(maxHealthBonus(2)).toBe(2);
  });
  it('regenIntervalFrames: 0 at L0 (disabled), shorter at higher L', () => {
    expect(regenIntervalFrames(0)).toBe(0);
    expect(regenIntervalFrames(1)).toBeGreaterThan(0);
    expect(regenIntervalFrames(7)).toBeLessThan(regenIntervalFrames(1));
  });
  it('bodyDamageEnabled at L>=1', () => {
    expect(bodyDamageEnabled(0)).toBe(false);
    expect(bodyDamageEnabled(1)).toBe(true);
  });
});
```

- [ ] **Step 2: Verify failing**

Run: `bun run test -- tests/statTree.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement StatTree.ts**

```ts
// src/game/StatTree.ts
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
```

- [ ] **Step 4: Verify passing**

Run: `bun run test -- tests/statTree.test.ts`
Expected: PASS all.

- [ ] **Step 5: Commit**

```bash
git add src/game/StatTree.ts tests/statTree.test.ts
git commit -m "feat(progression): StatTree module + derived getters"
```

---

### Task B2: Add Shard damage + pierce fields

**Files:**
- Modify: `src/game/Shard.ts`
- Test: `tests/shard.test.ts`

- [ ] **Step 1: Read current shard test**

Run: `cat tests/shard.test.ts` (via Read tool). Skim existing behavior — keep it passing.

- [ ] **Step 2: Append new failing tests**

```ts
// add to tests/shard.test.ts
import { describe, it, expect } from 'vitest';
import { Shard } from '../src/game/Shard';

describe('Shard damage/pierce', () => {
  it('defaults: damage 1, pierce 0', () => {
    const s = new Shard(0, 0, 1, 0);
    expect(s.damage).toBe(1);
    expect(s.pierce).toBe(0);
  });
  it('accepts damage and pierce in options', () => {
    const s = new Shard(0, 0, 1, 0, { damage: 3, pierce: 2 });
    expect(s.damage).toBe(3);
    expect(s.pierce).toBe(2);
  });
});
```

- [ ] **Step 3: Verify failing**

Run: `bun run test -- tests/shard.test.ts`
Expected: FAIL — `damage`/`pierce` not on Shard.

- [ ] **Step 4: Modify `src/game/Shard.ts`**

Replace the constructor block (lines 18–24) and add fields. Full updated class body:

```ts
import { SHARD_SPEED, SHARD_LIFETIME, SHARD_RADIUS } from './constants';

interface TrailPoint { x: number; y: number; life: number; }

export interface ShardOptions {
  damage?: number;
  pierce?: number;
  speedMult?: number;
}

export class Shard {
  x: number;
  y: number;
  vx: number;
  vy: number;
  readonly r = SHARD_RADIUS;
  life: number = SHARD_LIFETIME;
  damage: number;
  pierce: number;
  private trail: TrailPoint[] = [];

  constructor(x: number, y: number, dirX: number, dirY: number, opts: ShardOptions = {}) {
    this.x = x;
    this.y = y;
    const mag = Math.hypot(dirX, dirY) || 1;
    const speed = SHARD_SPEED * (opts.speedMult ?? 1);
    this.vx = (dirX / mag) * speed;
    this.vy = (dirY / mag) * speed;
    this.damage = opts.damage ?? 1;
    this.pierce = opts.pierce ?? 0;
  }

  update(slowMult = 1): void {
    this.x += this.vx * slowMult;
    this.y += this.vy * slowMult;
    this.life--;
    this.trail.push({ x: this.x, y: this.y, life: 1 });
    if (this.trail.length > 6) this.trail.shift();
    for (const t of this.trail) t.life -= 0.18;
  }

  expired(): boolean { return this.life <= 0; }

  offscreen(w: number, h: number): boolean {
    return this.x < -20 || this.x > w + 20 || this.y < -20 || this.y > h + 20;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (const t of this.trail) {
      if (t.life <= 0) continue;
      ctx.fillStyle = `rgba(180, 240, 255, ${t.life * 0.5})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, this.r * t.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowColor = '#aaeeff';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
```

- [ ] **Step 5: Verify passing**

Run: `bun run test`
Expected: PASS all (including existing shard tests).

- [ ] **Step 6: Commit**

```bash
git add src/game/Shard.ts tests/shard.test.ts
git commit -m "feat(progression): Shard damage + pierce fields"
```

---

### Task B3: Define Evolution module + base fire pattern

**Files:**
- Create: `src/game/Evolution.ts`
- Test: `tests/evolution.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/evolution.test.ts
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

  it('sniper fires 1 shard with higher damage and speed', () => {
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
});

describe('EVOLUTION_TIERS structure', () => {
  it('has tier1 (3), tier2 (6), tier3 (12 ids)', () => {
    expect(EVOLUTION_TIERS.tier1.length).toBe(3);
    expect(EVOLUTION_TIERS.tier2.length).toBe(6);
    expect(EVOLUTION_TIERS.tier3.length).toBe(12);
  });
});
```

- [ ] **Step 2: Verify failing**

Run: `bun run test -- tests/evolution.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement Evolution.ts**

```ts
// src/game/Evolution.ts
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
  | 'overlord' | 'predator'
  | 'rocketeer' | 'stalker';

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
    { id: 'triplet' as Tier2Id, name: 'Triplet', description: '3 shards in fan (Twin)' },
    { id: 'triple_shot' as Tier2Id, name: 'Triple Shot', description: '3 shards forward (Twin)' },
    { id: 'gunner' as Tier2Id, name: 'Gunner', description: '4 small fast shards (MG)' },
    { id: 'destroyer' as Tier2Id, name: 'Destroyer', description: '1 huge slow shard ×4 dmg (MG)' },
    { id: 'assassin' as Tier2Id, name: 'Assassin', description: '×3 speed · ×3 dmg (Sniper)' },
    { id: 'ranger' as Tier2Id, name: 'Ranger', description: '+50% cooldown · long range (Sniper)' },
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
    { id: 'overlord' as Tier3Id, name: 'Overlord', description: '4 cardinal + 4 diagonal' },
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
  return new Shard(x, y, dx, dy, {
    damage: 1 + bulletDamageBonus(stats.bulletDamage) + (dmgMult - 1),
    pierce: piercingBonus(stats.piercing),
    speedMult: bulletSpeedMult(stats.bulletSpeed) * speedMult,
  });
}

export function fireShards(
  x: number, y: number, dx: number, dy: number,
  evo: EvolutionState, stats: StatTree,
): Shard[] {
  const dmgFromStats = bulletDamageBonus(stats.bulletDamage);
  const speed = bulletSpeedMult(stats.bulletSpeed);
  const pierce = piercingBonus(stats.piercing);

  // Tier 3 final patterns take priority
  if (evo.tier3) return fireTier3(x, y, dx, dy, evo.tier3, stats);
  if (evo.tier2) return fireTier2(x, y, dx, dy, evo.tier2, stats);
  if (evo.tier1) return fireTier1(x, y, dx, dy, evo.tier1, stats);
  return [new Shard(x, y, dx, dy, { damage: 1 + dmgFromStats, pierce, speedMult: speed })];
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
    return [-18, -6, 6, 18].map(off => {
      const px = -dy * off / 18 * 8, py = dx * off / 18 * 8;
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
  if (id === 'overlord') {
    return Array.from({ length: 8 }, (_, i) => {
      const [rx, ry] = rotate(1, 0, (i / 8) * Math.PI * 2);
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
```

- [ ] **Step 4: Verify passing**

Run: `bun run test -- tests/evolution.test.ts`
Expected: PASS all.

- [ ] **Step 5: Commit**

```bash
git add src/game/Evolution.ts tests/evolution.test.ts
git commit -m "feat(progression): Evolution tree + fire pattern resolver"
```

---

### Task B4: StatHUD DOM widget

**Files:**
- Create: `src/ui/StatHUD.ts`
- Modify: `index.html`, `src/styles.css`

- [ ] **Step 1: Edit `index.html` — add stat container before `</body>`**

Add right after `<div id="control-toggle" ...>...</div>`:

```html
  <div class="stat-hud" id="stat-hud">
    <div class="stat-hud-header">
      <span class="stat-hud-title">STATS</span>
      <span class="stat-hud-points" id="stat-points">0 pts</span>
    </div>
    <div class="stat-rows" id="stat-rows"></div>
    <div class="stat-hud-hint">Press 1–8 to invest</div>
  </div>
```

- [ ] **Step 2: Append styles to `src/styles.css`**

```css
.stat-hud {
  position: fixed;
  bottom: 16px;
  left: 16px;
  width: 240px;
  background: rgba(10, 10, 22, 0.78);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
  padding: 10px 12px;
  font-family: -apple-system, system-ui, sans-serif;
  color: rgba(255,255,255,0.85);
  pointer-events: none;
  z-index: 4;
}
.stat-hud-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  letter-spacing: 1px;
  margin-bottom: 8px;
}
.stat-hud-title { opacity: 0.6; }
.stat-hud-points {
  font-weight: 700;
  color: #ffd166;
  background: rgba(255, 209, 102, 0.12);
  padding: 2px 8px;
  border-radius: 999px;
}
.stat-rows { display: flex; flex-direction: column; gap: 4px; }
.stat-row {
  display: grid;
  grid-template-columns: 18px 1fr auto;
  align-items: center;
  font-size: 11px;
  letter-spacing: 0.5px;
  gap: 6px;
}
.stat-key {
  font-weight: 700;
  color: rgba(255,255,255,0.4);
  font-family: monospace;
}
.stat-name { color: rgba(255,255,255,0.7); }
.stat-pips { display: flex; gap: 2px; }
.stat-pip {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: rgba(255,255,255,0.12);
}
.stat-pip.filled { background: linear-gradient(135deg, #6ee7ff, #a78bfa); }
.stat-hud-hint {
  margin-top: 8px;
  font-size: 10px;
  opacity: 0.4;
  letter-spacing: 1px;
  text-align: center;
}
.upgrade-list { display: none !important; }
```

(The `display: none` on `.upgrade-list` is intentional — the perk badge list moves into the stat panel later if needed; for now we hide it to avoid overlap with stat HUD.)

- [ ] **Step 3: Create StatHUD.ts**

```ts
// src/ui/StatHUD.ts
import { STAT_IDS, STAT_NAMES, STAT_MAX, type StatTree, type StatId } from '../game/StatTree';

export class StatHUD {
  private readonly rowsEl: HTMLElement;
  private readonly pointsEl: HTMLElement;
  private readonly hudEl: HTMLElement;

  constructor() {
    this.hudEl = document.getElementById('stat-hud')!;
    this.rowsEl = document.getElementById('stat-rows')!;
    this.pointsEl = document.getElementById('stat-points')!;
    this.renderRows({} as StatTree);
  }

  show(): void { this.hudEl.style.display = 'block'; }
  hide(): void { this.hudEl.style.display = 'none'; }

  update(tree: StatTree, points: number): void {
    this.pointsEl.textContent = `${points} pts`;
    this.renderRows(tree);
  }

  private renderRows(tree: StatTree): void {
    const rows = STAT_IDS.map((id: StatId, idx: number) => {
      const level = (tree[id] as number) ?? 0;
      const row = document.createElement('div');
      row.className = 'stat-row';
      const key = document.createElement('span');
      key.className = 'stat-key';
      key.textContent = String(idx + 1);
      const name = document.createElement('span');
      name.className = 'stat-name';
      name.textContent = STAT_NAMES[id];
      const pips = document.createElement('span');
      pips.className = 'stat-pips';
      for (let i = 0; i < STAT_MAX; i++) {
        const pip = document.createElement('span');
        pip.className = 'stat-pip' + (i < level ? ' filled' : '');
        pips.appendChild(pip);
      }
      row.append(key, name, pips);
      return row;
    });
    this.rowsEl.replaceChildren(...rows);
  }
}
```

- [ ] **Step 4: Typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/StatHUD.ts index.html src/styles.css
git commit -m "feat(progression): StatHUD bottom-left widget"
```

---

### Task B5: EvolutionScreen overlay (mirrors UpgradeScreen)

**Files:**
- Create: `src/ui/EvolutionScreen.ts`

- [ ] **Step 1: Create file**

```ts
// src/ui/EvolutionScreen.ts
import type { EvolutionDef, EvolutionId } from '../game/Evolution';

export class EvolutionScreen {
  private options: EvolutionDef[] = [];
  private readonly el: HTMLDivElement;
  private readonly onPick: (id: EvolutionId) => void;
  private boundKey!: (e: KeyboardEvent) => void;

  constructor(onPick: (id: EvolutionId) => void) {
    this.onPick = onPick;
    this.el = document.createElement('div');
    this.el.id = 'evolution-screen';
    Object.assign(this.el.style, {
      display: 'none', position: 'fixed', inset: '0',
      background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(14px)',
      zIndex: '210', alignItems: 'center', justifyContent: 'center',
      gap: '24px', flexDirection: 'column',
    });
    document.body.appendChild(this.el);
  }

  show(options: EvolutionDef[]): void {
    this.options = options;
    this.renderCards();
    this.el.style.display = 'flex';
    this.boundKey = (e: KeyboardEvent) => {
      const idx = parseInt(e.key, 10) - 1;
      if (idx >= 0 && idx < this.options.length) this.pick(idx);
    };
    document.addEventListener('keydown', this.boundKey);
    this.el.addEventListener('click', (e) => {
      const card = (e.target as Element).closest('[data-idx]') as HTMLElement | null;
      if (card) this.pick(Number(card.dataset['idx']));
    }, { once: true });
  }

  hide(): void {
    this.el.style.display = 'none';
    document.removeEventListener('keydown', this.boundKey);
  }

  private pick(idx: number): void {
    if (!this.options[idx]) return;
    this.hide();
    this.onPick(this.options[idx].id);
  }

  private renderCards(): void {
    const title = document.createElement('div');
    Object.assign(title.style, {
      color: '#ffd166', font: 'bold 22px system-ui',
      letterSpacing: '3px', textAlign: 'center', marginBottom: '8px',
    });
    title.textContent = 'CHOOSE EVOLUTION';

    const row = document.createElement('div');
    Object.assign(row.style, { display: 'flex', gap: '20px', alignItems: 'stretch', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '900px' });

    this.options.forEach((u, i) => {
      const card = document.createElement('div');
      card.dataset['idx'] = String(i);
      Object.assign(card.style, {
        background: 'rgba(255,209,102,0.07)', border: '1px solid rgba(255,209,102,0.3)',
        borderRadius: '12px', padding: '24px 20px', width: '200px',
        cursor: 'pointer', textAlign: 'center', transition: 'transform 0.1s',
      });
      card.addEventListener('mouseenter', () => { card.style.transform = 'translateY(-4px)'; });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });

      const hint = document.createElement('div');
      Object.assign(hint.style, { color: 'rgba(255,255,255,0.4)', font: '13px system-ui', marginBottom: '6px' });
      hint.textContent = `[${i + 1}]`;

      const name = document.createElement('div');
      Object.assign(name.style, { color: '#fff', font: 'bold 18px system-ui', marginBottom: '8px' });
      name.textContent = u.name;

      const desc = document.createElement('div');
      Object.assign(desc.style, { color: 'rgba(255,255,255,0.65)', font: '13px system-ui', lineHeight: '1.4' });
      desc.textContent = u.description;

      card.append(hint, name, desc);
      row.appendChild(card);
    });

    this.el.replaceChildren(title, row);
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/ui/EvolutionScreen.ts
git commit -m "feat(progression): EvolutionScreen overlay"
```

---

## Phase C: Wire into Game

### Task C1: Add constants for new systems

**Files:**
- Modify: `src/game/constants.ts`

- [ ] **Step 1: Append constants**

Add at end of `src/game/constants.ts`:

```ts
// Progression
export const BOSS_SPAWN_INTERVAL_MIN = 600;
export const BOSS_SPAWN_INTERVAL_STEP = 200;

// Sweep hazard
export const SWEEP_INTERVAL = 240;
export const SWEEP_WAVE_THRESHOLD = 5;
export const SWEEP_DOUBLE_WAVE_THRESHOLD = 10;
export const SWEEP_BULLET_COUNT = 12;
export const SWEEP_TELEGRAPH_FRAMES = 30;
export const SWEEP_BULLET_SPEED = 2.5;
```

- [ ] **Step 2: Verify typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/game/constants.ts
git commit -m "feat(progression): new tuning constants"
```

---

### Task C2: Player reads stat tree for movement

**Files:**
- Modify: `src/game/Player.ts`

- [ ] **Step 1: Modify update signature to accept overrides**

Replace `update` method in `src/game/Player.ts`. Full method:

```ts
  update(
    keys: Set<string>, w: number, h: number,
    target?: { x: number; y: number },
    maxSpeed: number = PLAYER_MAX_SPEED,
    friction: number = PLAYER_FRICTION,
  ): void {
    let ax = 0, ay = 0;
    if (target) {
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > PLAYER_MOUSE_DEAD_ZONE) {
        ax = (dx / dist) * PLAYER_ACCEL;
        ay = (dy / dist) * PLAYER_ACCEL;
      }
    } else {
      if (keys.has('arrowup') || keys.has('w')) ay -= PLAYER_ACCEL;
      if (keys.has('arrowdown') || keys.has('s')) ay += PLAYER_ACCEL;
      if (keys.has('arrowleft') || keys.has('a')) ax -= PLAYER_ACCEL;
      if (keys.has('arrowright') || keys.has('d')) ax += PLAYER_ACCEL;
    }

    this.vx += ax;
    this.vy += ay;
    this.vx *= friction;
    this.vy *= friction;

    const sp = Math.hypot(this.vx, this.vy);
    if (sp > maxSpeed) {
      this.vx = (this.vx / sp) * maxSpeed;
      this.vy = (this.vy / sp) * maxSpeed;
    }

    this.x += this.vx;
    this.y += this.vy;

    if (this.x < this.r) { this.x = this.r; this.vx = 0; }
    if (this.x > w - this.r) { this.x = w - this.r; this.vx = 0; }
    if (this.y < this.r) { this.y = this.r; this.vy = 0; }
    if (this.y > h - this.r) { this.y = h - this.r; this.vy = 0; }

    this.trail.push({ x: this.x, y: this.y, life: 1 });
    if (this.trail.length > PLAYER_TRAIL_LENGTH) this.trail.shift();
    for (const t of this.trail) t.life -= TRAIL_FADE;
  }
```

- [ ] **Step 2: Verify typecheck + tests**

Run: `bun run typecheck && bun run test -- tests/player.test.ts`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/game/Player.ts
git commit -m "feat(progression): Player.update accepts maxSpeed + friction"
```

---

### Task C3: Wave-scaled boss interval helper

**Files:**
- Modify: `src/game/PulseBoss.ts`
- Create test: `tests/bossScaling.test.ts`

- [ ] **Step 1: Add scaling helper at bottom of `src/game/PulseBoss.ts`**

```ts
import {
  BOSS_SPAWN_INTERVAL, BOSS_SPAWN_INTERVAL_MIN, BOSS_SPAWN_INTERVAL_STEP,
  BOSS_RING_COUNT, BOSS_SPIRAL_INTERVAL, BOSS_AIMED_INTERVAL,
} from './constants';

export function bossSpawnIntervalForWave(wave: number): number {
  return Math.max(BOSS_SPAWN_INTERVAL_MIN, BOSS_SPAWN_INTERVAL - (wave - 1) * BOSS_SPAWN_INTERVAL_STEP);
}

export function bossRingCountForWave(wave: number): number {
  return Math.min(24, BOSS_RING_COUNT + (wave - 1));
}

export function bossSpiralIntervalForWave(wave: number): number {
  return Math.max(8, BOSS_SPIRAL_INTERVAL - wave);
}

export function bossAimedIntervalForWave(wave: number): number {
  return Math.max(60, BOSS_AIMED_INTERVAL - wave * 8);
}

export function bossAimedSpreadCountForWave(wave: number): number {
  if (wave >= 10) return 5;
  if (wave >= 5) return 3;
  return 3;
}
```

(Note: the existing top-of-file imports already cover what `update` needs; add the new constants to the existing import block at the top — or merge them.)

Update top imports to include `BOSS_SPAWN_INTERVAL`, `BOSS_SPAWN_INTERVAL_MIN`, `BOSS_SPAWN_INTERVAL_STEP` from `./constants`.

- [ ] **Step 2: Inside `PulseBoss.update`, use scaled values**

Replace:

```ts
      const count = enrage ? BOSS_RING_COUNT + 2 : BOSS_RING_COUNT;
```

with:

```ts
      const baseCount = bossRingCountForWave(wave);
      const count = enrage ? baseCount + 2 : baseCount;
```

Replace `BOSS_SPIRAL_INTERVAL` constant in spiral check with `bossSpiralIntervalForWave(wave)`:

```ts
    if (spiralUnlocked && ++this.spiralTimer >= bossSpiralIntervalForWave(wave)) {
```

Replace `BOSS_AIMED_INTERVAL` similarly:

```ts
    if (enrage && ++this.aimTimer >= bossAimedIntervalForWave(wave)) {
      this.aimTimer = 0;
      const base = Math.atan2(playerY - this.y, playerX - this.x);
      const count = bossAimedSpreadCountForWave(wave);
      const halfSpread = ((count - 1) / 2) * BOSS_AIMED_SPREAD;
      for (let i = 0; i < count; i++) {
        const off = -halfSpread + i * BOSS_AIMED_SPREAD;
        bullets.push(new Bullet(this.x, this.y, base + off, sm));
      }
    }
```

- [ ] **Step 3: Write tests for new helpers**

```ts
// tests/bossScaling.test.ts
import { describe, it, expect } from 'vitest';
import {
  bossSpawnIntervalForWave, bossRingCountForWave,
  bossSpiralIntervalForWave, bossAimedIntervalForWave,
  bossAimedSpreadCountForWave,
} from '../src/game/PulseBoss';

describe('Boss wave scaling', () => {
  it('spawn interval shrinks per wave, floor 600', () => {
    expect(bossSpawnIntervalForWave(1)).toBe(1800);
    expect(bossSpawnIntervalForWave(3)).toBe(1400);
    expect(bossSpawnIntervalForWave(10)).toBe(600);
    expect(bossSpawnIntervalForWave(99)).toBe(600);
  });
  it('ring count grows, cap 24', () => {
    expect(bossRingCountForWave(1)).toBe(8);
    expect(bossRingCountForWave(5)).toBe(12);
    expect(bossRingCountForWave(100)).toBe(24);
  });
  it('spiral interval shrinks, floor 8', () => {
    expect(bossSpiralIntervalForWave(1)).toBe(21);
    expect(bossSpiralIntervalForWave(20)).toBe(8);
  });
  it('aimed interval shrinks, floor 60', () => {
    expect(bossAimedIntervalForWave(1)).toBe(132);
    expect(bossAimedIntervalForWave(20)).toBe(60);
  });
  it('aimed spread count steps: 3, then 5 at wave 10', () => {
    expect(bossAimedSpreadCountForWave(1)).toBe(3);
    expect(bossAimedSpreadCountForWave(5)).toBe(3);
    expect(bossAimedSpreadCountForWave(10)).toBe(5);
  });
});
```

- [ ] **Step 4: Verify**

Run: `bun run test -- tests/bossScaling.test.ts && bun run test -- tests/boss.test.ts`
Expected: PASS all.

- [ ] **Step 5: Commit**

```bash
git add src/game/PulseBoss.ts tests/bossScaling.test.ts
git commit -m "feat(boss): wave-scaled boss patterns + spawn interval"
```

---

### Task C4: Sweep ambient hazard

**Files:**
- Create: `src/game/Sweep.ts`
- Test: `tests/sweep.test.ts`

- [ ] **Step 1: Write tests**

```ts
// tests/sweep.test.ts
import { describe, it, expect } from 'vitest';
import { Sweep } from '../src/game/Sweep';

describe('Sweep', () => {
  it('left-edge sweep bullets all start near x=0 and move right', () => {
    const s = new Sweep('left', 800, 600);
    // Advance past telegraph
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
```

- [ ] **Step 2: Verify failing**

Run: `bun run test -- tests/sweep.test.ts`
Expected: FAIL.

- [ ] **Step 3: Create `src/game/Sweep.ts`**

```ts
// src/game/Sweep.ts
import { Bullet } from './Bullet';
import {
  SWEEP_BULLET_COUNT, SWEEP_BULLET_SPEED, SWEEP_TELEGRAPH_FRAMES,
} from './constants';

export type SweepEdge = 'left' | 'right' | 'top' | 'bottom';

export class Sweep {
  private readonly _bullets: Bullet[] = [];
  private telegraph = SWEEP_TELEGRAPH_FRAMES;
  private spawned = false;

  constructor(
    private readonly edge: SweepEdge,
    private readonly w: number,
    private readonly h: number,
  ) {}

  update(slowMult = 1): void {
    if (this.telegraph > 0) {
      this.telegraph--;
      return;
    }
    if (!this.spawned) {
      this.spawnBullets();
      this.spawned = true;
    }
    for (const b of this._bullets) b.update(slowMult);
  }

  private spawnBullets(): void {
    const speed = SWEEP_BULLET_SPEED / 2; // Bullet ctor multiplies by base speed; speedMult applied differently
    // Use angle to set direction; Bullet ctor uses BOSS_BULLET_SPEED * speedMult
    const mult = SWEEP_BULLET_SPEED / 2; // tuned
    for (let i = 0; i < SWEEP_BULLET_COUNT; i++) {
      const t = i / (SWEEP_BULLET_COUNT - 1);
      let x = 0, y = 0, angle = 0;
      if (this.edge === 'left')   { x = 0;       y = t * this.h; angle = 0; }
      if (this.edge === 'right')  { x = this.w;  y = t * this.h; angle = Math.PI; }
      if (this.edge === 'top')    { x = t * this.w; y = 0;       angle = Math.PI / 2; }
      if (this.edge === 'bottom') { x = t * this.w; y = this.h;  angle = -Math.PI / 2; }
      this._bullets.push(new Bullet(x, y, angle, mult));
    }
    // suppress unused
    void speed;
  }

  bullets(): Bullet[] { return this._bullets; }

  telegraphAlpha(): number {
    return this.telegraph / SWEEP_TELEGRAPH_FRAMES;
  }

  edgeId(): SweepEdge { return this.edge; }

  done(w: number, h: number): boolean {
    if (!this.spawned) return false;
    return this._bullets.every(b => b.offscreen(w, h));
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.telegraph > 0) {
      const a = this.telegraphAlpha();
      ctx.save();
      ctx.strokeStyle = `rgba(255, 80, 80, ${0.7 * a})`;
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 8]);
      ctx.beginPath();
      if (this.edge === 'left')   { ctx.moveTo(0, 0);          ctx.lineTo(0, this.h); }
      if (this.edge === 'right')  { ctx.moveTo(this.w, 0);     ctx.lineTo(this.w, this.h); }
      if (this.edge === 'top')    { ctx.moveTo(0, 0);          ctx.lineTo(this.w, 0); }
      if (this.edge === 'bottom') { ctx.moveTo(0, this.h);     ctx.lineTo(this.w, this.h); }
      ctx.stroke();
      ctx.restore();
    }
    for (const b of this._bullets) b.draw(ctx);
  }
}
```

- [ ] **Step 4: Verify**

Run: `bun run test -- tests/sweep.test.ts`
Expected: PASS all 3.

- [ ] **Step 5: Commit**

```bash
git add src/game/Sweep.ts tests/sweep.test.ts
git commit -m "feat(hazard): Sweep ambient bullet hazard"
```

---

### Task C5: Wire XP/StatTree/Evolution into Game.ts

**Files:**
- Modify: `src/game/Game.ts`

This is the largest task. Do it in surgical Edit calls. Show full final file sections only where needed.

- [ ] **Step 1: Add imports to top of `src/game/Game.ts`**

Add to imports block:

```ts
import {
  createXP, addXP, xpFromCombo,
  XP_ORB, XP_GOLD, XP_SHARD_KILL, XP_BOSS_HIT, XP_BOSS_KILL,
  type XPState,
} from './XP';
import {
  createStatTree, invest, STAT_IDS, type StatTree, type StatId,
  maxSpeedMult, regenIntervalFrames, maxHealthBonus,
  bodyDamageEnabled,
} from './StatTree';
import {
  createEvolution, applyEvolution, fireShards, evolutionChoicesForLevel,
  type EvolutionState, type EvolutionId,
} from './Evolution';
import { Sweep } from './Sweep';
import { XPBar } from '../ui/XPBar';
import { StatHUD } from '../ui/StatHUD';
import { EvolutionScreen } from '../ui/EvolutionScreen';
import {
  bossSpawnIntervalForWave,
  // existing imports already there
} from './PulseBoss';
import { SWEEP_INTERVAL, SWEEP_WAVE_THRESHOLD, SWEEP_DOUBLE_WAVE_THRESHOLD } from './constants';
```

- [ ] **Step 2: Add private fields to `Game` class**

After existing private fields, add:

```ts
  private xp: XPState = createXP();
  private statTree: StatTree = createStatTree();
  private evolution: EvolutionState = createEvolution();
  private sweeps: Sweep[] = [];
  private lastSweepFrame = 0;
  private regenTimer = 0;
  private readonly xpBar: XPBar;
  private readonly statHud: StatHUD;
  private readonly evolutionScreen: EvolutionScreen;
  private pendingEvolutionLevel: number | null = null;
```

- [ ] **Step 3: Construct new UI in constructor**

Add to constructor after `this.upgradeScreen = new UpgradeScreen(...)`:

```ts
    this.xpBar = new XPBar();
    this.statHud = new StatHUD();
    this.evolutionScreen = new EvolutionScreen(this.applyEvolutionPick.bind(this));
    this.xpBar.update(this.xp);
    this.statHud.update(this.statTree, this.xp.points);
```

- [ ] **Step 4: Add applyEvolutionPick method**

Add new method on `Game` class:

```ts
  private applyEvolutionPick(id: EvolutionId): void {
    applyEvolution(this.evolution, id);
    this.texts.push(new FloatText(this.player.x, this.player.y - 30, id.replace(/_/g, ' ').toUpperCase(), '#ffd166'));
    sfxUpgrade();
    this.state = 'playing';
    this.pendingEvolutionLevel = null;
  }
```

- [ ] **Step 5: Add gainXP helper**

```ts
  private gainXP(base: number): void {
    const amount = xpFromCombo(base, this.combo);
    const before = this.xp.level;
    this.xp = addXP(this.xp, amount);
    if (this.xp.leveledUp) {
      for (const newLv of this.xp.newLevels) {
        this.texts.push(new FloatText(this.player.x, this.player.y - 40, `LEVEL ${newLv}`, '#a78bfa'));
      }
      // Check evolution milestones
      const milestones = [15, 30, 45];
      for (const m of milestones) {
        if (before < m && this.xp.level >= m) {
          this.pendingEvolutionLevel = m;
          break;
        }
      }
    }
    this.xpBar.update(this.xp);
    this.statHud.update(this.statTree, this.xp.points);
  }
```

- [ ] **Step 6: Handle 1–8 keys for stat investment**

In `setupInput`, replace the existing `window.addEventListener('keydown', ...)` block. Find:

```ts
    window.addEventListener('keydown', (e) => {
      if (prevent.has(e.key)) e.preventDefault();
      this.keys.add(e.key.toLowerCase());
      resumeAudio();
      if (this.state === 'idle') this.begin();
    });
```

Replace with:

```ts
    window.addEventListener('keydown', (e) => {
      if (prevent.has(e.key)) e.preventDefault();
      this.keys.add(e.key.toLowerCase());
      resumeAudio();
      if (this.state === 'idle') this.begin();
      const idx = parseInt(e.key, 10) - 1;
      if (idx >= 0 && idx < STAT_IDS.length && (this.state === 'playing' || this.state === 'boss')) {
        this.tryInvestStat(STAT_IDS[idx]);
      }
    });
```

- [ ] **Step 7: Add tryInvestStat method**

```ts
  private tryInvestStat(id: StatId): void {
    if (this.xp.points <= 0) return;
    if (!invest(this.statTree, id)) return;
    this.xp.points--;
    if (id === 'maxHealth') {
      // Bump current lives by 1 (don't exceed cap+bonus)
      const cap = MAX_LIVES + maxHealthBonus(this.statTree.maxHealth);
      if (this.lives < cap) this.lives++;
    }
    this.statHud.update(this.statTree, this.xp.points);
    this.texts.push(new FloatText(this.player.x, this.player.y - 20, `+${id.toUpperCase()}`, '#6ee7ff'));
    sfxUpgrade();
  }
```

- [ ] **Step 8: Use evolution.fireShards in tryFireShard**

Replace existing `tryFireShard`:

```ts
  private tryFireShard(): void {
    if (this.state !== 'playing' && this.state !== 'boss') return;
    if (this.shootCooldown > 0) return;
    const dir = this.player.fireDirection();
    const newShards = fireShards(this.player.x, this.player.y, dir.x, dir.y, this.evolution, this.statTree);
    this.shards.push(...newShards);
    this.shootCooldown = this.evolution.cooldownFrames(this.statTree);
    sfxShoot();
  }
```

- [ ] **Step 9: Pass scaled max speed + friction to Player.update**

In `update()`, find:

```ts
    const target = this.controlMode === 'mouse' ? { x: this.mouseX, y: this.mouseY } : undefined;
    this.player.update(this.keys, this.w, this.h, target);
```

Replace with:

```ts
    const target = this.controlMode === 'mouse' ? { x: this.mouseX, y: this.mouseY } : undefined;
    const baseSpeed = (PLAYER_MAX_SPEED + this.effects.maxSpeedBonus) * maxSpeedMult(this.statTree.moveSpeed);
    const friction = this.effects.frictionOverride ?? PLAYER_FRICTION;
    this.player.update(this.keys, this.w, this.h, target, baseSpeed, friction);
```

Add to imports at top if missing:

```ts
import { PLAYER_FRICTION } from './constants';
```

- [ ] **Step 10: Replace boss spawn check with wave-scaled interval**

Find:

```ts
    if (this.state === 'playing' && this.time > 0 && this.time % BOSS_SPAWN_INTERVAL === 0) {
      this.spawnBoss();
    }
```

Replace with:

```ts
    if (this.state === 'playing') {
      const interval = bossSpawnIntervalForWave(this.wave);
      if (this.time > 0 && this.time % interval === 0) this.spawnBoss();
    }
```

- [ ] **Step 11: Sweep spawn + update + draw**

Add inside `update()`, after powerup spawn block:

```ts
    // Sweep hazard
    if (this.state !== 'upgrading' && this.wave >= SWEEP_WAVE_THRESHOLD &&
        this.time - this.lastSweepFrame > SWEEP_INTERVAL) {
      const edges = ['left', 'right', 'top', 'bottom'] as const;
      const e1 = edges[Math.floor(Math.random() * 4)];
      this.sweeps.push(new Sweep(e1, this.w, this.h));
      if (this.wave >= SWEEP_DOUBLE_WAVE_THRESHOLD) {
        const opp: Record<typeof e1, typeof e1> = {
          left: 'right', right: 'left', top: 'bottom', bottom: 'top',
        };
        this.sweeps.push(new Sweep(opp[e1], this.w, this.h));
      }
      this.lastSweepFrame = this.time;
    }

    const slowMultEarly = isSlowActive(this.effects, this.time) ? POWERUP_SLOW_FACTOR : 1;
    for (const sw of this.sweeps) sw.update(slowMultEarly);
    this.sweeps = this.sweeps.filter(sw => !sw.done(this.w, this.h));
```

(Move/duplicate `slowMultEarly` variable creation — the existing `slowMult` lower down stays, this is just earlier for sweeps. Or factor: simpler — leave existing `slowMult` later and just pass `1` to sweep update for now if simpler. Let's keep it consistent: just call `update(1)` here, sweeps don't slow with powerup.)

Simplification — replace the sweep update line above with:

```ts
    for (const sw of this.sweeps) sw.update();
    this.sweeps = this.sweeps.filter(sw => !sw.done(this.w, this.h));
```

(Remove the `slowMultEarly` declaration entirely.)

- [ ] **Step 12: Sweep bullet collisions**

In the bullet collision block (around lines 449-464), add sweep bullets to the loop. Just below the boss bullet loop, add:

```ts
      // Sweep bullets
      for (const sw of this.sweeps) {
        const swBullets = sw.bullets();
        for (let i = swBullets.length - 1; i >= 0; i--) {
          if (!circleCircle(swBullets[i], this.player)) continue;
          swBullets.splice(i, 1);
          if (this.effects.shield) {
            this.effects.shield = false;
            this.invuln = PLAYER_INVULN_FRAMES;
            sfxShieldAbsorb();
          } else {
            this.lives--;
            this.shake = SHAKE_SPIKE_HIT;
            this.combo = 0; this.comboTimer = 0;
            this.invuln = PLAYER_INVULN_FRAMES;
            sfxHit();
            if (this.lives <= 0) { this.end(); return; }
          }
        }
      }
```

- [ ] **Step 13: Body damage + regen**

Inside the spike collision block, replace the existing iteration body to honor body damage. Find:

```ts
      for (let i = this.spikes.length - 1; i >= 0; i--) {
        if (!circleCircleShrunk(this.spikes[i], this.player, 2)) continue;
        const spike = this.spikes.splice(i, 1)[0];
        if (this.effects.shield) {
```

Update to: spike removed in either case, but if body damage active, no life lost (and add gainXP):

```ts
      for (let i = this.spikes.length - 1; i >= 0; i--) {
        if (!circleCircleShrunk(this.spikes[i], this.player, 2)) continue;
        const spike = this.spikes.splice(i, 1)[0];
        if (this.effects.shield) {
          this.effects.shield = false;
          this.invuln = PLAYER_INVULN_FRAMES;
          sfxShieldAbsorb();
          this.texts.push(new FloatText(this.player.x, this.player.y - 20, 'SHIELD!', '#88aaff'));
        } else if (bodyDamageEnabled(this.statTree.bodyDamage)) {
          this.explode(spike.x, spike.y, 340, 12);
          this.gainXP(XP_SHARD_KILL);
        } else {
          this.lives -= spike.damage;
          this.shake = SHAKE_SPIKE_HIT;
          this.combo = 0; this.comboTimer = 0;
          this.invuln = PLAYER_INVULN_FRAMES;
          this.explode(spike.x, spike.y, 0, 30, true);
          this.texts.push(new FloatText(this.player.x, this.player.y - 20, `-${spike.damage} ♥`, '#ff5577'));
          sfxHit();
          if (this.lives <= 0) { this.end(); return; }
        }
      }
```

- [ ] **Step 14: Regen tick**

At bottom of `update()`, just before `this.shake *= SHAKE_DECAY;`, add:

```ts
    const regenInterval = regenIntervalFrames(this.statTree.regen);
    if (regenInterval > 0) {
      if (++this.regenTimer >= regenInterval) {
        this.regenTimer = 0;
        const cap = MAX_LIVES + maxHealthBonus(this.statTree.maxHealth);
        if (this.lives < cap) {
          this.lives++;
          this.texts.push(new FloatText(this.player.x, this.player.y - 20, '+1 ♥', '#ff88aa'));
        }
      }
    }
```

- [ ] **Step 15: Award XP on orb/spike/boss events**

In the orb collection block, after `sfxCollect(this.combo);`, add:

```ts
        this.gainXP(orb.type === 'gold' ? XP_GOLD : XP_ORB);
```

In shard vs boss block, after `sfxBossHit(); ...`, in the `if (this.boss.hp <= 0)` arm, before `break;`, add:

```ts
          this.gainXP(XP_BOSS_KILL);
```

And in the body of the same `for` loop (per-hit), before checking hp:

```ts
        this.gainXP(XP_BOSS_HIT);
```

In shard vs spikes block, after `this.score += SHARD_SPIKE_POINTS;` add:

```ts
        this.gainXP(XP_SHARD_KILL);
```

In the bossGoldOrb hit (boss collision area, after `this.boss.hit();`), add:

```ts
          this.gainXP(XP_BOSS_HIT);
```

- [ ] **Step 16: Pending evolution gate**

At top of `update()`, just after `this.time++;`, add:

```ts
    if (this.pendingEvolutionLevel !== null && this.state !== 'upgrading') {
      const opts = evolutionChoicesForLevel(this.pendingEvolutionLevel, this.evolution);
      if (opts.length > 0) {
        this.state = 'upgrading';
        this.evolutionScreen.show(opts);
        return;
      }
      this.pendingEvolutionLevel = null;
    }
```

- [ ] **Step 17: Update restart to reset progression**

In `restart()`, add to the resets:

```ts
    this.xp = createXP();
    this.statTree = createStatTree();
    this.evolution = createEvolution();
    this.sweeps = [];
    this.lastSweepFrame = 0;
    this.regenTimer = 0;
    this.pendingEvolutionLevel = null;
    this.xpBar.update(this.xp);
    this.statHud.update(this.statTree, this.xp.points);
```

- [ ] **Step 18: Draw sweeps**

In `draw()`, after `for (const b of this.bullets) b.draw(ctx);`, add:

```ts
    for (const sw of this.sweeps) sw.draw(ctx);
```

- [ ] **Step 19: Typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 20: Tests**

Run: `bun run test`
Expected: PASS all.

- [ ] **Step 21: Manual dev test**

Run: `bun run dev &` then open `http://localhost:5173` in a browser. Verify:
- XP bar visible top-right under wave badge, fills as you collect orbs.
- Stat HUD bottom-left, levels shown as pips.
- Pressing `1`–`8` invests a point when you have any.
- Boss spawns roughly every 30s at wave 1, faster at later waves.
- After ~level 15: Evolution overlay appears with 3 options.
- After picking Twin: shards fire as 2 parallel.

Kill the dev server: `kill %1`.

- [ ] **Step 22: Commit**

```bash
git add src/game/Game.ts
git commit -m "feat(progression): wire XP/StatTree/Evolution/Sweep into game loop"
```

---

## Phase D: Cleanup & Polish

### Task D1: Hide redundant upgrade-list HUD and ensure stat HUD doesn't overlap

**Files:**
- Verify `src/styles.css` already has `.upgrade-list { display: none !important; }` from Task B4.
- No further action needed unless the upgrade screen (boss-clear) feels redundant. Skip if not.

- [ ] **Step 1: No-op verification**

Run `bun run dev`, confirm no visual overlap between StatHUD and existing upgrade-list. Already hidden from B4.

---

### Task D2: Final lint + full test pass + commit

- [ ] **Step 1: Run all checks**

```bash
bun run lint && bun run typecheck && bun run test
```

Expected: All pass. Fix any lint issues inline.

- [ ] **Step 2: Verify dev manually one more time**

Play 5+ minutes. Confirm:
- Wave 5+ shows red dashed telegraph then sweep bullets.
- Wave 10+ shows two opposing sweeps.
- Level-up text + XP bar.
- Stat investments visibly change behavior (Reload → faster fire, Bullet Damage → fewer hits to kill boss).
- Evolution overlay at level 15 / 30 / 45.

- [ ] **Step 3: Final commit (if any fixups)**

```bash
git add -A
git commit -m "chore(progression): final lint/test polish" --allow-empty
```

---

## Self-Review

**Spec coverage check:**

| Spec section | Task |
|--------------|------|
| XP sources + scaling | A1, A2, C5 step 15 |
| Level cap + per-level cost | A1 |
| HUD: XP bar + level | A3 |
| 8 stats + invest UI | B1, B4, C5 step 6/7 |
| Stat-derived getters wired to gameplay | C2, C5 step 8/9/13/14 |
| Tier 1/2/3 evolutions + branching | B3 |
| Evolution UI overlay | B5, C5 step 4/16 |
| Boss frequency scaling | C3, C5 step 10 |
| Boss pattern intensity | C3 |
| Ambient sweep | C4, C5 step 11/12 |
| Reset on death | C5 step 17 |

**Placeholder scan:** None.

**Type consistency:** `EvolutionId`, `StatId`, `XPState` consistent across files. `fireShards` signature unchanged across all references. `cooldownFrames` defined on `EvolutionState` and called in `tryFireShard` (Task C5 step 8).

**Out-of-scope confirmed dropped:** No multiplayer, no meta-progression, no new orb/spike types. Existing perk UpgradeScreen kept intact.

---

## Execution Handoff

Plan saved to `docs/superpowers/plans/2026-05-30-diep-progression.md`. Two execution options:

1. **Subagent-Driven (recommended)** — Fresh subagent per task, review between tasks.
2. **Inline Execution** — Execute tasks in this session with batch checkpoints.
