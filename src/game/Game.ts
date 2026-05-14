import {
  INITIAL_LIVES, MAX_LIVES,
  ORB_SPAWN_INTERVAL, SPIKE_SPAWN_INTERVAL_START, SPIKE_SPAWN_INTERVAL_MIN,
  SHAKE_SPIKE_HIT, SHAKE_ORB_BASE, SHAKE_ORB_COMBO, SHAKE_HEART, SHAKE_DECAY,
  PLAYER_INVULN_FRAMES, MOTION_BLUR_ALPHA,
  BOSS_SPAWN_INTERVAL, BOSS_HP, BOSS_DEATH_DELAY, BOSS_GOLD_SPAWN_RADIUS,
  POWERUP_SHIELD_FRAMES, POWERUP_SLOW_FRAMES, POWERUP_MAGNET_FRAMES,
  POWERUP_FRENZY_FRAMES, POWERUP_GHOST_FRAMES, POWERUP_SLOW_FACTOR,
  UPGRADE_SPEED_DEMON_MAXSPEED, UPGRADE_SPEED_DEMON_FRICTION,
  UPGRADE_IRON_GRIP_FRICTION, UPGRADE_COMBO_MASTER_TIMEOUT,
  UPGRADE_COLLECTOR_EXTRA, UPGRADE_WIDE_TRAIL_LENGTH,
  ORB_GOLD_POINTS_MULT,
  PLAYER_MAX_SPEED, PLAYER_TRAIL_LENGTH,
  SHAKE_BOSS_DEATH,
} from './constants';
import { Player } from './Player';
import { Orb, weightedOrbType } from './Orb';
import { Spike, spikeTypeForWave } from './Spike';
import { Powerup, weightedPowerupType } from './Powerup';
import { Bullet } from './Bullet';
import { PulseBoss } from './PulseBoss';
import { Particle } from './Particle';
import { FloatText } from './FloatText';
import { circleCircle, circleCircleShrunk } from './collisions';
import { calcPoints } from './scoring';
import {
  sfxCollect, sfxHit, sfxHeart, sfxGameOver, resumeAudio,
  sfxBossSpawn, sfxBossHit, sfxBossDeath,
  sfxShieldAbsorb, sfxSlowActivate, sfxMagnetActivate,
  sfxFrenzyActivate, sfxGhostActivate, sfxUpgrade, sfxBombCollect,
} from '../audio/sfx';
import { HUD } from '../ui/HUD';
import { Overlays } from '../ui/overlays';
import { BossBar } from '../ui/BossBar';
import { PowerupHUD } from '../ui/PowerupHUD';
import { UpgradeScreen } from './UpgradeScreen';
import {
  createActiveEffects, isSlowActive, isMagnetActive, isGhostActive,
  effectiveComboTimeout, effectivePowerupInterval, effectiveSpikeInterval,
  effectiveComboMultiplier,
  type ActiveEffects, type UpgradeId,
} from './ActiveEffects';
import { loadHighScore, saveHighScore, loadControlMode, saveControlMode, type ControlMode } from '../util/storage';

type GameState = 'idle' | 'playing' | 'boss' | 'upgrading' | 'gameover';

export class Game {
  private readonly ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private state: GameState = 'idle';
  private score = 0;
  private lives = INITIAL_LIVES;
  private highScore: number;
  private time = 0;
  private combo = 0;
  private comboTimer = 0;
  private invuln = 0;
  private shake = 0;

  private readonly player: Player;
  private orbs: Orb[] = [];
  private spikes: Spike[] = [];
  private powerups: Powerup[] = [];
  private bullets: Bullet[] = [];
  private particles: Particle[] = [];
  private texts: FloatText[] = [];
  private boss: PulseBoss | null = null;
  private bossDeathTimer = 0;
  private bossGoldOrb: Orb | null = null;
  private effects: ActiveEffects = createActiveEffects();

  private readonly keys = new Set<string>();
  private controlMode: ControlMode;
  private mouseX = 0;
  private mouseY = 0;
  private toggleEl: HTMLElement | null = null;
  private lastOrbFrame = 0;
  private lastSpikeFrame = 0;
  private lastPowerupFrame = 0;

  private readonly hud: HUD;
  private readonly overlays: Overlays;
  private readonly bossBar: BossBar;
  private readonly powerupHUD: PowerupHUD;
  private readonly upgradeScreen: UpgradeScreen;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    this.ctx = ctx;
    this.highScore = loadHighScore();
    this.controlMode = loadControlMode();
    this.player = new Player(0, 0);
    this.hud = new HUD();
    this.overlays = new Overlays(this.restart.bind(this));
    this.bossBar = new BossBar();
    this.powerupHUD = new PowerupHUD();
    this.upgradeScreen = new UpgradeScreen(this.applyUpgrade.bind(this));
    this.setupInput(canvas);
    this.setupControlToggle();
    this.resize(canvas);
    window.addEventListener('resize', () => this.resize(canvas));
    this.hud.update(0, this.highScore, INITIAL_LIVES, 1);
  }

  private setupControlToggle(): void {
    const el = document.getElementById('control-toggle');
    if (!el) return;
    this.toggleEl = el;
    this.renderToggle();
    el.addEventListener('click', () => {
      this.controlMode = this.controlMode === 'keyboard' ? 'mouse' : 'keyboard';
      saveControlMode(this.controlMode);
      this.renderToggle();
    });
  }

  private renderToggle(): void {
    if (!this.toggleEl) return;
    const label = this.controlMode === 'keyboard' ? 'KEYBOARD' : 'MOUSE';
    this.toggleEl.textContent = `Control: ${label}`;
  }

  private get wave(): number {
    return Math.floor(this.time / BOSS_SPAWN_INTERVAL) + 1;
  }

  private setupInput(canvas: HTMLCanvasElement): void {
    const prevent = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ']);
    canvas.addEventListener('keydown', () => { /* focus trap */ });
    window.addEventListener('keydown', (e) => {
      if (prevent.has(e.key)) e.preventDefault();
      this.keys.add(e.key.toLowerCase());
      resumeAudio();
      if (this.state === 'idle') this.begin();
    });
    window.addEventListener('keyup', (e) => { this.keys.delete(e.key.toLowerCase()); });
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
    });
    canvas.addEventListener('mousedown', () => {
      resumeAudio();
      if (this.state === 'idle') this.begin();
    });
  }

  private resize(canvas: HTMLCanvasElement): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    canvas.width = this.w * dpr;
    canvas.height = this.h * dpr;
    canvas.style.width = `${this.w}px`;
    canvas.style.height = `${this.h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.mouseX === 0 && this.mouseY === 0) {
      this.mouseX = this.w / 2;
      this.mouseY = this.h / 2;
    }
  }

  private begin(): void {
    this.state = 'playing';
    this.player.reset(this.w / 2, this.h / 2);
    this.overlays.hideStart();
  }

  private end(): void {
    this.state = 'gameover';
    if (this.score > this.highScore) {
      this.highScore = this.score;
      saveHighScore(this.highScore);
    }
    this.overlays.showGameOver(this.score, this.highScore);
    sfxGameOver();
  }

  private restart(): void {
    this.score = 0; this.lives = INITIAL_LIVES; this.time = 0;
    this.combo = 0; this.comboTimer = 0; this.invuln = 0; this.shake = 0;
    this.orbs = []; this.spikes = []; this.powerups = [];
    this.bullets = []; this.particles = []; this.texts = [];
    this.boss = null; this.bossDeathTimer = 0; this.bossGoldOrb = null;
    this.effects = createActiveEffects();
    this.lastOrbFrame = 0; this.lastSpikeFrame = 0; this.lastPowerupFrame = 0;
    this.state = 'playing';
    this.player.reset(this.w / 2, this.h / 2);
    this.overlays.hideGameOver();
    this.bossBar.hide();
    this.powerupHUD.clear();
    this.hud.update(0, this.highScore, INITIAL_LIVES, 1);
    this.hud.setActiveUpgrades([]);
  }

  private explode(x: number, y: number, hue: number, count: number, big = false): void {
    for (let i = 0; i < count; i++) this.particles.push(new Particle(x, y, hue, big));
  }

  private applyUpgrade(id: UpgradeId): void {
    this.effects.pickedUpgrades.add(id);
    switch (id) {
      case 'speed_demon':
        this.effects.maxSpeedBonus = UPGRADE_SPEED_DEMON_MAXSPEED - PLAYER_MAX_SPEED;
        this.effects.frictionOverride = UPGRADE_SPEED_DEMON_FRICTION;
        break;
      case 'iron_grip': this.effects.frictionOverride = UPGRADE_IRON_GRIP_FRICTION; break;
      case 'combo_master': this.effects.comboTimeoutBonus = UPGRADE_COMBO_MASTER_TIMEOUT - 90; break;
      case 'orb_pull': this.effects.orbPull = true; break;
      case 'lucky_drop': this.effects.luckyDrop = true; break;
      case 'berserker': this.effects.berserker = true; break;
      case 'extra_life':
        if (this.lives < MAX_LIVES) {
          this.lives++;
          this.texts.push(new FloatText(this.player.x, this.player.y - 20, '+1 ♥', '#ff88aa'));
        }
        break;
      case 'blitz': this.effects.blitz = true; break;
      case 'collector': this.effects.collector += UPGRADE_COLLECTOR_EXTRA; break;
      case 'wide_trail': this.effects.trailLengthBonus = UPGRADE_WIDE_TRAIL_LENGTH - PLAYER_TRAIL_LENGTH; break;
    }
    this.hud.setActiveUpgrades(
      [...this.effects.pickedUpgrades].map(u =>
        u.split('_').map((w: string) => w[0].toUpperCase() + w.slice(1)).join(' ')
      )
    );
    sfxUpgrade();
    this.state = 'playing';
  }

  private spawnBoss(): void {
    this.boss = new PulseBoss(this.w / 2, this.h / 2, this.time);
    this.bossGoldOrb = null;
    this.bossBar.show(BOSS_HP, BOSS_HP);
    this.state = 'boss';
    sfxBossSpawn();
    this.spawnBossGoldOrb();
  }

  private spawnBossGoldOrb(): void {
    if (!this.boss) return;
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * BOSS_GOLD_SPAWN_RADIUS;
    this.bossGoldOrb = new Orb(
      'gold', this.w, this.h, this.player.x, this.player.y,
      { x: this.boss.x + Math.cos(angle) * dist, y: this.boss.y + Math.sin(angle) * dist },
    );
  }

  private update(): void {
    this.time++;
    if (this.invuln > 0) this.invuln--;
    if (this.comboTimer > 0) this.comboTimer--; else this.combo = 0;

    const wave = this.wave;
    const orbCap = 4 + wave * 2 + this.effects.collector;

    if (this.time - this.lastOrbFrame > ORB_SPAWN_INTERVAL && this.orbs.length < orbCap) {
      this.orbs.push(new Orb(weightedOrbType(), this.w, this.h, this.player.x, this.player.y));
      this.lastOrbFrame = this.time;
    }

    if (this.state !== 'upgrading') {
      const spikeRate = effectiveSpikeInterval(
        Math.max(SPIKE_SPAWN_INTERVAL_MIN, SPIKE_SPAWN_INTERVAL_START - this.time * 0.04),
        this.effects,
      );
      if (this.time - this.lastSpikeFrame > spikeRate) {
        this.spikes.push(new Spike(spikeTypeForWave(wave), this.w, this.h, this.player.x, this.player.y, this.time));
        this.lastSpikeFrame = this.time;
      }
    }

    const powerupInterval = effectivePowerupInterval(this.effects);
    if (this.time - this.lastPowerupFrame > powerupInterval && this.powerups.length === 0) {
      this.powerups.push(new Powerup(weightedPowerupType(Math.random(), this.lives), this.w, this.h));
      this.lastPowerupFrame = this.time;
    }

    if (this.state === 'playing' && this.time > 0 && this.time % BOSS_SPAWN_INTERVAL === 0) {
      this.spawnBoss();
    }

    if (this.boss && this.state === 'boss') {
      if (this.boss.escaped(this.time)) {
        this.boss = null; this.bossGoldOrb = null; this.bossBar.hide(); this.state = 'playing';
        return;
      }
      const newBullets = this.boss.update(this.time, wave, this.w / 2, this.h / 2, this.player.x, this.player.y);
      this.bullets.push(...newBullets);

      if (this.boss.hp <= 0) {
        if (++this.bossDeathTimer >= BOSS_DEATH_DELAY) {
          this.explode(this.boss.x, this.boss.y, 40, 60, true);
          this.shake = SHAKE_BOSS_DEATH;
          sfxBossDeath();
          this.boss = null; this.bossGoldOrb = null; this.bossBar.hide(); this.bossDeathTimer = 0;
          this.bullets = [];
          this.state = 'upgrading';
          this.upgradeScreen.show(this.effects.pickedUpgrades);
          return;
        }
      }

      if (this.bossGoldOrb && this.boss && this.boss.hp > 0) {
        this.bossGoldOrb.update(this.w, this.h);
        if (circleCircle(this.bossGoldOrb, this.player)) {
          this.boss.hit();
          sfxBossHit();
          this.bossBar.show(this.boss.hp, BOSS_HP);
          if (this.boss.hp > 0) this.spawnBossGoldOrb(); else this.bossGoldOrb = null;
        }
      } else if (!this.bossGoldOrb && this.boss && this.boss.hp > 0) {
        this.spawnBossGoldOrb();
      }
    }

    const slowMult = isSlowActive(this.effects, this.time) ? POWERUP_SLOW_FACTOR : 1;
    const magnetActive = isMagnetActive(this.effects, this.time) || this.effects.orbPull;
    const ghostActive = isGhostActive(this.effects, this.time);

    const target = this.controlMode === 'mouse' ? { x: this.mouseX, y: this.mouseY } : undefined;
    this.player.update(this.keys, this.w, this.h, target);

    const ax = magnetActive ? this.player.x : undefined;
    const ay = magnetActive ? this.player.y : undefined;
    for (const orb of this.orbs) orb.update(this.w, this.h, ax, ay);

    this.spikes = this.spikes.filter(s => !s.offscreen(this.w, this.h));
    for (const s of this.spikes) s.update(slowMult);

    for (const p of this.powerups) p.update(this.w, this.h);

    this.bullets = this.bullets.filter(b => !b.offscreen(this.w, this.h));
    for (const b of this.bullets) b.update(slowMult);

    for (const p of this.particles) p.update();
    for (const t of this.texts) t.update();
    this.particles = this.particles.filter(p => p.life > 0);
    this.texts = this.texts.filter(t => t.life > 0);

    for (let i = this.orbs.length - 1; i >= 0; i--) {
      if (!circleCircle(this.orbs[i], this.player)) continue;
      const orb = this.orbs.splice(i, 1)[0];
      if (orb.type === 'bomb') {
        if (this.invuln === 0) {
          this.lives--;
          this.invuln = PLAYER_INVULN_FRAMES;
          this.shake = SHAKE_SPIKE_HIT;
          this.combo = 0; this.comboTimer = 0;
          this.explode(orb.x, orb.y, 0, 20, true);
          this.texts.push(new FloatText(orb.x, orb.y, 'BOMB!', '#ff4444'));
          sfxBombCollect();
          if (this.lives <= 0) { this.end(); return; }
        }
      } else {
        this.combo++;
        this.comboTimer = effectiveComboTimeout(this.effects);
        const frenzyMult = effectiveComboMultiplier(this.effects, this.time);
        const berserkerMult = this.effects.berserker && this.lives === 1 ? 3 : 1;
        const base = orb.type === 'gold' ? calcPoints(this.combo) * ORB_GOLD_POINTS_MULT : calcPoints(this.combo);
        const pts = base * frenzyMult * berserkerMult;
        this.score += pts;
        this.shake = Math.min(8, SHAKE_ORB_BASE + this.combo * SHAKE_ORB_COMBO);
        this.explode(orb.x, orb.y, orb.hue, 18);
        this.texts.push(new FloatText(orb.x, orb.y, `+${pts}`, `hsl(${orb.hue}, 90%, 75%)`));
        sfxCollect(this.combo);
      }
    }

    if (this.invuln === 0 && !ghostActive) {
      for (let i = this.spikes.length - 1; i >= 0; i--) {
        if (!circleCircleShrunk(this.spikes[i], this.player, 2)) continue;
        const spike = this.spikes.splice(i, 1)[0];
        if (this.effects.shield) {
          this.effects.shield = false;
          this.invuln = PLAYER_INVULN_FRAMES;
          sfxShieldAbsorb();
          this.texts.push(new FloatText(this.player.x, this.player.y - 20, 'SHIELD!', '#88aaff'));
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

      for (let i = this.bullets.length - 1; i >= 0; i--) {
        if (!circleCircle(this.bullets[i], this.player)) continue;
        this.bullets.splice(i, 1);
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

    for (let i = this.powerups.length - 1; i >= 0; i--) {
      if (this.powerups[i].expired()) { this.powerups.splice(i, 1); continue; }
      if (!circleCircle(this.powerups[i], this.player)) continue;
      const pu = this.powerups.splice(i, 1)[0];
      this.applyPowerup(pu.type, pu.hue, pu.name);
    }

    this.refreshPowerupHUD();
    this.shake *= SHAKE_DECAY;
    this.hud.update(this.score, this.highScore, this.lives, wave);
  }

  private applyPowerup(type: string, hue: number, name: string): void {
    switch (type) {
      case 'shield':
        this.effects.shield = true;
        this.powerupHUD.setActive(type, hue, name, POWERUP_SHIELD_FRAMES, POWERUP_SHIELD_FRAMES);
        break;
      case 'slow':
        this.effects.slowUntil = this.time + POWERUP_SLOW_FRAMES;
        this.powerupHUD.setActive(type, hue, name, POWERUP_SLOW_FRAMES, POWERUP_SLOW_FRAMES);
        sfxSlowActivate();
        break;
      case 'magnet':
        this.effects.magnetUntil = this.time + POWERUP_MAGNET_FRAMES;
        this.powerupHUD.setActive(type, hue, name, POWERUP_MAGNET_FRAMES, POWERUP_MAGNET_FRAMES);
        sfxMagnetActivate();
        break;
      case 'frenzy':
        this.effects.frenzyUntil = this.time + POWERUP_FRENZY_FRAMES;
        this.powerupHUD.setActive(type, hue, name, POWERUP_FRENZY_FRAMES, POWERUP_FRENZY_FRAMES);
        sfxFrenzyActivate();
        break;
      case 'ghost':
        this.effects.ghostUntil = this.time + POWERUP_GHOST_FRAMES;
        this.powerupHUD.setActive(type, hue, name, POWERUP_GHOST_FRAMES, POWERUP_GHOST_FRAMES);
        sfxGhostActivate();
        break;
      case 'heart':
        if (this.lives < MAX_LIVES) {
          this.lives++;
          this.texts.push(new FloatText(this.player.x, this.player.y - 20, '+1 ♥', '#ff88aa'));
          this.shake = SHAKE_HEART;
          sfxHeart();
        }
        break;
    }
  }

  private refreshPowerupHUD(): void {
    if (this.effects.slowUntil > this.time) {
      this.powerupHUD.setActive('slow', 55, 'Slow', this.effects.slowUntil - this.time, POWERUP_SLOW_FRAMES);
    } else if (this.effects.magnetUntil > this.time) {
      this.powerupHUD.setActive('magnet', 150, 'Magnet', this.effects.magnetUntil - this.time, POWERUP_MAGNET_FRAMES);
    } else if (this.effects.frenzyUntil > this.time) {
      this.powerupHUD.setActive('frenzy', 30, 'Frenzy', this.effects.frenzyUntil - this.time, POWERUP_FRENZY_FRAMES);
    } else if (this.effects.ghostUntil > this.time) {
      this.powerupHUD.setActive('ghost', 270, 'Ghost', this.effects.ghostUntil - this.time, POWERUP_GHOST_FRAMES);
    } else if (this.effects.shield) {
      this.powerupHUD.setActive('shield', 210, 'Shield', 1, 1);
    } else {
      this.powerupHUD.clear();
    }
  }

  private draw(): void {
    const ctx = this.ctx;
    ctx.fillStyle = `rgba(6, 6, 15, ${MOTION_BLUR_ALPHA})`;
    ctx.fillRect(0, 0, this.w, this.h);

    if (this.state === 'boss' && this.boss) {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(0, 0, this.w, this.h);
    }

    ctx.save();
    if (this.shake > 0.5) {
      ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    }

    for (const orb of this.orbs) orb.draw(ctx);
    for (const s of this.spikes) s.draw(ctx);
    for (const p of this.powerups) p.draw(ctx);
    for (const b of this.bullets) b.draw(ctx);
    if (this.bossGoldOrb) this.bossGoldOrb.draw(ctx);
    if (this.boss) this.boss.draw(ctx);
    for (const p of this.particles) p.draw(ctx);
    for (const t of this.texts) t.draw(ctx);
    this.player.draw(ctx, this.invuln);

    if (this.combo > 1) {
      const alpha = Math.min(1, this.comboTimer / 60);
      ctx.fillStyle = `hsla(${(this.combo * 30) % 360}, 90%, 70%, ${alpha})`;
      ctx.font = 'bold 64px -apple-system, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`x${this.combo}`, this.w / 2, this.h - 60);
      ctx.font = '14px -apple-system, system-ui, sans-serif';
      ctx.fillText('COMBO', this.w / 2, this.h - 36);
    }

    ctx.restore();
    this.powerupHUD.draw(ctx, this.w, this.h);
  }

  tick(): void {
    if (this.state === 'playing' || this.state === 'boss') this.update();
    this.draw();
  }
}
