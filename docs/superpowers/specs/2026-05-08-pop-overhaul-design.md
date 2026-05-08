# POP — Big Overhaul Design Spec
_2026-05-08_

## Overview

Transform POP from a survival arcade game into a roguelite run with boss waves, in-run upgrades, powerup variety, and enemy type diversity. Single run, no meta-progression — everything resets on death. Each run is standalone and different.

---

## 1. Run Structure

```
idle → playing → [wave loop] → gameover
                     ↓
              every 1800 frames (~30s):
              PulseBoss spawns → kill it → upgrade screen → resume
```

- Waves are numbered (Wave 1, 2, 3…). Wave number shown top-right during run.
- After upgrade pick, game resumes immediately.
- Difficulty escalates per wave (see §6).

---

## 2. PulseBoss

### Spawn
- Appears at screen center every 1800 frames.
- Screen dims (overlay rgba 0,0,0,0.3) during boss fight.
- Existing spike spawning pauses during boss fight; orb/powerup spawning continues.

### HP
- 8 HP. Each HP = collect one **gold orb** spawned near the boss.
- Gold orbs spawn at random positions within 150px of boss, one at a time as previous is collected.
- Boss HP bar renders top-center (hidden when no boss active).

### Bullet Patterns (unlocked by wave)
| Wave | Pattern | Description |
|------|---------|-------------|
| 1+ | **Ring burst** | 12 bullets radially outward every 120 frames |
| 2+ | **Spiral** | 2-arm rotating stream, 1 bullet per arm per 8 frames |
| 3+ | **Aimed triple** | 3 shots aimed at player with 15° spread, every 90 frames |

Boss fires patterns simultaneously once unlocked (wave 2 fires ring + spiral, etc).

### Boss Bullets
- Small red circles, r=5.
- Speed: 2.5px/frame.
- Lethal on player contact (same as spikes, triggers invuln + life loss).
- Do NOT bounce — removed when offscreen.

### Boss Movement
- Slow drift toward screen center if displaced; gentle random wobble ±0.3px/frame.
- Does not chase player.

### Boss Death
- Explode: 60 particles, hue 40 (gold), big=true.
- Screen shake 30.
- sfxBossDeath sound.
- Transition to upgrade screen after 30 frames.

### Boss Escape
- If player fails to kill boss within 2400 frames (~40s) of spawn, boss retreats off-screen (no upgrade granted, normal play resumes).

---

## 3. Powerup System

Replaces and extends current Heart pickup. One powerup on screen at a time. Spawns every **900 frames** at random position (existing Heart logic replaced).

### Powerup Pool

| ID | Name | Color (hue) | Effect | Duration |
|----|------|-------------|--------|----------|
| `shield` | Shield | 210 (blue) | Next spike hit absorbed, no life lost | Until hit or 8s |
| `slow` | Slow | 55 (yellow) | All spike/bullet speeds × 0.5 | 5s |
| `magnet` | Magnet | 150 (cyan-green) | Orbs within canvas drift toward player | 6s |
| `frenzy` | Frenzy | 30 (orange) | Combo multiplier ×2 | 8s |
| `ghost` | Ghost | 270 (pale violet) | Player passes through spikes (no collision) | 4s |
| `heart` | Heart | 340 (pink) | +1 life, instant | — |

- Spawn weights: heart 20%, others 16% each.
- Heart only spawns if lives < MAX_LIVES (existing constraint).
- If no valid heart spawn (lives = max), reroll to another type.

### Active Powerup UI
- Bottom-right: icon (filled circle in powerup hue) + powerup name + arc timer (shrinks over duration).
- No stacking — new pickup replaces current effect.

### Powerup Rendering
- Same base shape as Heart but different color + symbol drawn inside:
  - Shield: pentagon outline
  - Slow: hourglass (two triangles)
  - Magnet: horseshoe arc
  - Frenzy: lightning bolt (zigzag lines)
  - Ghost: simple ghost silhouette (circle + wavy bottom)
  - Heart: existing heart bezier

---

## 4. In-Run Upgrades

On boss kill: game pauses, dark overlay, 3 randomly-selected upgrade cards presented. Player picks with mouse click or keys 1/2/3. Dismissed after pick, game resumes.

### Upgrade Pool (10 total, 3 shown per boss)

| ID | Name | Effect |
|----|------|--------|
| `speed_demon` | Speed Demon | PLAYER_MAX_SPEED 8→10, FRICTION 0.88→0.85 |
| `iron_grip` | Iron Grip | FRICTION 0.88→0.93, tighter but slower |
| `combo_master` | Combo Master | COMBO_TIMEOUT 90→150 frames |
| `orb_pull` | Orb Pull | Orbs within 120px drift toward player passively |
| `lucky_drop` | Lucky Drop | Powerup interval 900→600 frames |
| `berserker` | Berserker | Score multiplier ×3 when lives = 1 |
| `extra_life` | Extra Life | +1 life immediately (capped at MAX_LIVES) |
| `blitz` | Blitz | Spike spawn interval ×0.8 (20% faster), +5 pts per spike dodged off-screen |
| `collector` | Collector | Orb cap +4 always |
| `wide_trail` | Wide Trail | PLAYER_TRAIL_LENGTH 12→22 |

- Same upgrade can't appear twice in the same run.
- If fewer than 3 upgrades remain in pool, show all remaining.
- Active upgrades listed in a small stack bottom-left during run.

### Upgrade Card UI
- Dark blurred overlay (backdrop-filter blur 12px).
- 3 cards side by side, centered.
- Each card: upgrade name (large), short description (small), icon.
- Hover: card lifts (translateY -4px).
- Keys 1, 2, 3 or mouse click to select.
- sfxUpgrade sound on pick.

---

## 5. Enemy & Orb Varieties

### Orb Types

| Type | Hue | Spawn weight | Points | Notes |
|------|-----|-------------|--------|-------|
| Standard | 160–240 | 75% | 10 × combo | Existing |
| Gold | 45 (yellow) | 15% | 30 × combo | Larger (r+6), extra glow; also used as boss HP tokens |
| Bomb | 0 (dark red) | 10% | −1 life + invuln | Blinks warning (flicker every 6 frames); floattext "BOMB!"; triggers same invuln window as spike hit |

Bomb orbs: player must avoid them. They look like orbs but have a red tint + warning flicker. Existing orbs already float at similar speeds so player must distinguish.

### Spike Types

| Type | Color | r | Speed mult | Introduced | Notes |
|------|-------|---|-----------|-----------|-------|
| Standard | red gradient | 14 | 1× | Wave 1 | Existing |
| Fast | hot pink (#ff44cc) | 10 | 2× | Wave 2 | Smaller, harder to see |
| Heavy | near-black (#220011) | 24 | 0.6× | Wave 3 | Costs 2 lives on hit |
| Ghost | white, 0–40% opacity | 14 | 1× | Wave 4 | Flickers invisible every 20 frames |

Spike type distribution per wave:
- Wave 1: 100% standard
- Wave 2: 70% standard, 30% fast
- Wave 3: 50% standard, 30% fast, 20% heavy
- Wave 4+: 35% standard, 30% fast, 20% heavy, 15% ghost

---

## 6. Difficulty Curve

| Wave | Time | Boss Pattern | New Enemy | Spike Rate |
|------|------|-------------|-----------|-----------|
| 1 | 0–30s | Ring burst | — | 90→60 frames |
| 2 | 30–60s | + Spiral | Fast spike | 60→40 frames |
| 3 | 60–90s | + Aimed triple | Heavy spike | 40→30 frames |
| 4+ | 90s+ | All 3 + faster bullets | Ghost spike | 30→20 frames |

Orb cap: `4 + wave * 2` (grows faster than before).

---

## 7. Audio Additions

| Event | Sound |
|-------|-------|
| Boss spawn | Low drone swell (sine 60Hz, 0.8s rise) |
| Boss hit | Metallic ping (sine 880Hz, 0.05s) |
| Boss death | Chord explosion (sine 220+330+440Hz simultaneously, 0.4s) |
| Shield absorb | Thud + high ping (sawtooth 200Hz + sine 1200Hz) |
| Slow activate | Wobbly descend (freq sweep 600→200Hz, 0.3s) |
| Magnet activate | Rising hum (triangle 300→600Hz, 0.2s) |
| Frenzy activate | Staccato triple beep (sine 660Hz, 3× 0.05s) |
| Ghost activate | Airy whoosh (white noise envelope, 0.15s) |
| Upgrade pick | Ascending arpeggio (C-E-G, 0.08s each) |
| Bomb collect | Harsh buzz (sawtooth 80Hz, 0.4s) |

---

## 8. Architecture Changes

### New Files
- `src/game/PulseBoss.ts` — boss entity (bullets, HP, patterns, movement)
- `src/game/Bullet.ts` — boss bullet entity (small circle, lethal)
- `src/game/Powerup.ts` — unified powerup entity (replaces Heart.ts)
- `src/game/UpgradeScreen.ts` — pause overlay, card rendering, input handling
- `src/game/ActiveEffects.ts` — tracks timed powerup state, upgrade modifiers
- `src/ui/BossBar.ts` — boss HP bar DOM element
- `src/ui/PowerupHUD.ts` — active powerup icon + arc timer (canvas-drawn)

### Modified Files
- `src/game/constants.ts` — new constants for all above
- `src/game/Game.ts` — wire boss spawning, bullet collision, upgrade screen, powerup dispatch, spike type selection, orb type selection
- `src/game/Orb.ts` — add `type: 'standard' | 'gold' | 'bomb'`, adjusted draw
- `src/game/Spike.ts` — add `type: 'standard' | 'fast' | 'heavy' | 'ghost'`, adjusted draw + r
- `src/audio/sfx.ts` — add 10 new sound functions
- `src/ui/HUD.ts` — add wave badge
- `src/ui/overlays.ts` — no change (game-over reuses existing)

### Heart.ts
Retired. Powerup.ts handles all pickups including heart type.

### ActiveEffects
Single object holding:
```ts
{
  shield: boolean;
  slowUntil: number;      // frame number
  magnetUntil: number;
  frenzyUntil: number;
  ghostUntil: number;
  // upgrade flags:
  orbPull: boolean;
  berserker: boolean;
  blitz: boolean;
  collector: number;      // extra orb cap
  comboTimeoutBonus: number;
  maxSpeedBonus: number;
  frictionOverride: number | null;
  trailLengthBonus: number;
  luckyDrop: boolean;
  pickedUpgrades: Set<string>;
}
```

Game.ts reads ActiveEffects each frame to apply modifiers to physics, spawning, scoring.

---

## 9. Testing

Extend existing Vitest suite:
- `tests/powerup.test.ts` — spawn weights, effect application, expiry
- `tests/boss.test.ts` — HP tracking, bullet pattern generation (pure functions)
- `tests/upgrades.test.ts` — upgrade pool deduplication, modifier application
- `tests/orbTypes.test.ts` — weighted random selection

All game logic helpers remain pure functions outside classes.

---

## 10. Out of Scope (file as issues)

- Persistent unlocks / meta-progression
- Online leaderboard
- Mobile/touch support
- Multiplayer
- Achievement system
