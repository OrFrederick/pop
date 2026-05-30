# Diep.io-Style Progression & Bullet-Hell Scaling

**Date:** 2026-05-30
**Status:** Design approved → implementation

## Goal

Make POP rewarding to play longer. Add deep per-run character progression (stat tree + tank evolutions) inspired by diep.io, and ramp enemy projectile density so late-game runs become genuine bullet-hell challenges.

## Problem

Current state:

- Only 1 upgrade per boss kill (every ~30s real time = 1800 frames).
- Upgrade pool is 10 perks; once picked, that's it for the run.
- No continuous reward loop between bosses.
- Enemy projectile rate plateaus — late waves feel similar to mid waves.
- No build identity. Every player ends up roughly the same.

Player feedback: "Not a lot to upgrade the character each round; projectiles need to go mad mad at some point."

## Scope

Four cohesive systems, implemented in order:

1. **XP + Level system** — continuous reward
2. **Stat tree** — 8 stats with up to 7 levels each (diep.io core)
3. **Tank evolutions** — class branches at levels 15 / 30 / 45
4. **Bullet-hell scaling** — projectile density ramps per wave

The existing 10-perk upgrade screen stays as the boss-clear reward (orthogonal to stats). Existing powerup pickups (Shield/Slow/Magnet/Frenzy/Ghost/Heart) unchanged.

---

## 1. XP + Level System

### XP sources

| Action | XP |
|--------|----|
| Collect standard orb | 1 |
| Collect gold orb | 3 |
| Shard kills spike | 2 |
| Hit boss (per HP) | 5 |
| Kill boss | 25 |

XP scales with combo: `xp_gained = base * (1 + combo * 0.05)` (capped at 2x).

### Levels

- Level 1 start.
- XP per level: `100 + (level - 1) * 25` (quadratic-ish growth so leveling slows).
- On level up: +1 stat point, brief flash + text "LEVEL n", sfx.
- Level cap: 45 (final evolution tier).

### Display

- HUD: small XP bar under wave badge, current level number, XP toward next.

---

## 2. Stat Tree

8 stats, max 7 levels each (matches diep.io). Spend stat points freely between attempts.

| Stat | Effect per level | Notes |
|------|------------------|-------|
| Health Regen | +1 HP per 600 frames (10s) | Cannot exceed max |
| Max Health | +1 max life (cap raised) | Awards a heart on invest |
| Body Damage | Player touch removes spike + 1 dmg back | Currently 0 — new mechanic |
| Bullet Speed | Shard speed ×1.1 cumulative | Affects range too |
| Bullet Penetration | Shard pierces +1 spike per level | L0 = 1 spike (current) |
| Bullet Damage | Shards do +1 boss dmg per level | L0 = 1 dmg (current) |
| Reload | Shard cooldown × 0.88 cumulative | L7 ≈ 4 frames |
| Movement Speed | Max speed +0.7 per level | Stacks with Speed Demon perk |

### Stat menu UI

- Bottom-left, 8 vertical rows.
- Each row: stat name, current level (filled circles 0–7), `+` button.
- Always visible during play (compact). Numbers 1–8 invest a point in that stat.
- Available points shown above tree.

### Persistence

- Stats reset on death (per-run progression).
- Persistent records (high score, control mode) unchanged.

---

## 3. Tank Evolutions

Player class. Affects shard fire pattern. Three tiers.

### L15 — Tier 1 choice (overlay)

| Class | Effect |
|-------|--------|
| **Twin** | Fires 2 parallel shards, +30% cooldown |
| **Machine Gun** | Cooldown × 0.5, slight spread |
| **Sniper** | 1 shard, ×2 damage, ×1.5 speed, +50% cooldown |

### L30 — Tier 2 (branches from L15)

- Twin → **Triplet** (3 shards, 0/+15°/-15°) or **Triple Shot** (3 shards forward stacked)
- Machine Gun → **Gunner** (4 small shards) or **Destroyer** (1 big slow shard, ×4 dmg)
- Sniper → **Assassin** (×3 speed, ×3 dmg, ×2 cooldown) or **Ranger** (×1 cooldown, infinite shard lifetime)

### L45 — Tier 3 (final)

- Each tier-2 branches into 2 finals (12 total). Notable: **Octo Tank** (8 directions auto-fire), **Spreadshot** (5 shards 30° fan), **Annihilator** (1 huge shard, ×8 dmg).

Choosing class shows an upgrade-screen-style overlay that pauses gameplay.

---

## 4. Bullet-Hell Scaling

### Boss frequency

- L0 wave 1 spawn at 1800 (current).
- Per-wave reduction: `interval = max(600, 1800 - 200*(wave-1))`.
- By wave 7+: boss every 600 frames (10s). High-density mid-game.

### Boss pattern intensity

Inside `PulseBoss.update`:

- `BOSS_RING_COUNT`: `8 + (wave - 1)` (cap 24)
- `BOSS_SPIRAL_INTERVAL`: `max(8, 22 - wave)` 
- `BOSS_AIMED_INTERVAL`: `max(60, 140 - wave * 8)`
- Aimed pattern fires 3-shot spread at wave 5+, 5-shot at wave 10+.

### Ambient hazard

From wave 5+, every 240 frames a "bullet sweep":

- 12 bullets march in a line from one edge, perpendicular.
- Telegraph 30 frames (red dashes along edge).
- Adds danger between bosses.

Wave 10+: simultaneous opposing-edge sweeps.

### Difficulty floor

The shard system and stat tree are designed to keep up. By wave 10:
- A maxed-Reload + Bullet-Damage build clears boss in ~5s.
- A Penetration build cleans the spike field.
- Player must build to survive scaling — that's the loop.

---

## Architecture

### New files

- `src/game/XP.ts` — XP/level state, `addXP()`, `xpToNext()`
- `src/game/StatTree.ts` — stat definitions, levels, derived getters
- `src/game/Evolution.ts` — class tree, fire pattern resolver
- `src/ui/StatHUD.ts` — bottom-left stat panel
- `src/ui/XPBar.ts` — HUD XP bar
- `src/ui/EvolutionScreen.ts` — class choice overlay (mirrors UpgradeScreen)
- `src/game/Sweep.ts` — ambient hazard entity

### Modified files

- `src/game/Game.ts` — wire XP gains, stat resolution, sweep spawning, evolution gating
- `src/game/Player.ts` — multi-shard fire patterns (delegate to Evolution.fire())
- `src/game/PulseBoss.ts` — wave-scaled pattern counts
- `src/game/ActiveEffects.ts` — fold in stat derived values (max speed bonus, friction, cooldown mult)
- `src/game/constants.ts` — new tuning numbers
- `src/ui/HUD.ts` — XP bar slot, level display
- `src/game/Shard.ts` — penetration counter, damage field

### Data flow

```
Orb collect / spike kill / boss hit
   → addXP() → maybe levelUp() → +1 stat point
                                → if level in {15,30,45}: open EvolutionScreen
Stat invested:
   → StatTree mutated
   → Player.fireDirection() / Shard.damage / Player maxSpeed read from StatTree
Wave tick:
   → Sweep spawn check
   → Boss interval / pattern scaling from wave number
```

### Testing

- Unit: XP formula, level-up math, stat-derived getters, evolution branch resolution.
- Unit: bullet-sweep collision math (existing collision helpers).
- Manual: full run to wave 10+, verify build feels distinct, sweep readable, late game tense.

---

## Out of scope (this spec)

- Multiplayer / leaderboards.
- Persistent meta-progression across runs (e.g., unlock tanks).
- New orb/spike variants.
- Mobile/touch.
- Sound design for new events (will reuse / lightly extend existing sfx).

## Risks

- **Stat HUD clutter.** Mitigation: collapsible, compact rows, only shows on play state.
- **Evolution paralysis.** Mitigation: tier-1 only 3 options, descriptions concrete.
- **Late-wave performance.** Sweep + dense boss bullets could push particle count. Mitigation: cap particle array length to 400; reuse pooled arrays only if perf regressions show in dev.
- **Balance.** Initial values are estimates. Tuning pass after first playthrough — constants are centralized in `constants.ts` for fast iteration.

## Success criteria

- Average run length increases (more late-wave engagement).
- Two consecutive runs feel different based on stat/evolution choices.
- Wave 10+ projectile density visibly higher than wave 3.
- No frame drops on dev machine at wave 15.
