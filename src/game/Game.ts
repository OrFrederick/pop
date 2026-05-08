import {
  INITIAL_LIVES,
  MAX_LIVES,
  COMBO_TIMEOUT,
  ORB_SPAWN_INTERVAL,
  ORB_CAP_TIME,
  SPIKE_SPAWN_INTERVAL_START,
  SPIKE_SPAWN_INTERVAL_MIN,
  HEART_SPAWN_INTERVAL,
  SHAKE_SPIKE_HIT,
  SHAKE_ORB_BASE,
  SHAKE_ORB_COMBO,
  SHAKE_HEART,
  SHAKE_DECAY,
  PLAYER_INVULN_FRAMES,
  MOTION_BLUR_ALPHA,
} from './constants';
import { Player } from './Player';
import { Orb } from './Orb';
import { Spike } from './Spike';
import { Heart } from './Heart';
import { Particle } from './Particle';
import { FloatText } from './FloatText';
import { circleCircle, circleCircleShrunk } from './collisions';
import { calcPoints } from './scoring';
import { sfxCollect, sfxHit, sfxHeart, sfxGameOver, resumeAudio } from '../audio/sfx';
import { HUD } from '../ui/HUD';
import { Overlays } from '../ui/overlays';
import { loadHighScore, saveHighScore } from '../util/storage';

type GameState = 'idle' | 'playing' | 'gameover';

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
  private hearts: Heart[] = [];
  private particles: Particle[] = [];
  private texts: FloatText[] = [];

  private readonly keys = new Set<string>();
  private lastOrbFrame = 0;
  private lastSpikeFrame = 0;
  private lastHeartFrame = 0;

  private readonly hud: HUD;
  private readonly overlays: Overlays;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    this.ctx = ctx;
    this.highScore = loadHighScore();
    this.player = new Player(0, 0);
    this.hud = new HUD();
    this.overlays = new Overlays(this.restart.bind(this));

    this.setupInput(canvas);
    this.resize(canvas);
    window.addEventListener('resize', () => this.resize(canvas));
    this.hud.update(0, this.highScore, INITIAL_LIVES);
  }

  private setupInput(canvas: HTMLCanvasElement): void {
    const preventKeys = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ']);
    canvas.addEventListener('keydown', () => { /* focus trap */ });
    window.addEventListener('keydown', (e) => {
      if (preventKeys.has(e.key)) e.preventDefault();
      this.keys.add(e.key.toLowerCase());
      resumeAudio();
      if (this.state === 'idle') this.begin();
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
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
    this.score = 0;
    this.lives = INITIAL_LIVES;
    this.time = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.invuln = 0;
    this.shake = 0;
    this.orbs = [];
    this.spikes = [];
    this.hearts = [];
    this.particles = [];
    this.texts = [];
    this.lastOrbFrame = 0;
    this.lastSpikeFrame = 0;
    this.lastHeartFrame = 0;
    this.state = 'playing';
    this.player.reset(this.w / 2, this.h / 2);
    this.overlays.hideGameOver();
    this.hud.update(this.score, this.highScore, this.lives);
  }

  private explode(x: number, y: number, hue: number, count: number, big = false): void {
    for (let i = 0; i < count; i++) this.particles.push(new Particle(x, y, hue, big));
  }

  private update(): void {
    this.time++;
    if (this.invuln > 0) this.invuln--;
    if (this.comboTimer > 0) {
      this.comboTimer--;
    } else {
      this.combo = 0;
    }

    // Spawn orbs
    if (this.time - this.lastOrbFrame > ORB_SPAWN_INTERVAL) {
      const cap = 4 + Math.floor(this.time / ORB_CAP_TIME);
      if (this.orbs.length < cap) {
        this.orbs.push(new Orb('standard', this.w, this.h, this.player.x, this.player.y));
      }
      this.lastOrbFrame = this.time;
    }

    // Spawn spikes (rate ramps up over time)
    const spikeRate = Math.max(
      SPIKE_SPAWN_INTERVAL_MIN,
      SPIKE_SPAWN_INTERVAL_START - this.time * 0.04
    );
    if (this.time - this.lastSpikeFrame > spikeRate) {
      this.spikes.push(new Spike('standard', this.w, this.h, this.player.x, this.player.y, this.time));
      this.lastSpikeFrame = this.time;
    }

    // Spawn heart (only when below max lives, none on screen)
    if (
      this.time - this.lastHeartFrame > HEART_SPAWN_INTERVAL &&
      this.lives < MAX_LIVES &&
      this.hearts.length === 0
    ) {
      this.hearts.push(new Heart(this.w, this.h));
      this.lastHeartFrame = this.time;
    }

    this.player.update(this.keys, this.w, this.h);

    // Update all entities
    for (const orb of this.orbs) orb.update(this.w, this.h);
    this.spikes = this.spikes.filter((s) => !s.offscreen(this.w, this.h));
    for (const spike of this.spikes) spike.update();
    for (const heart of this.hearts) heart.update(this.w, this.h);
    for (const p of this.particles) p.update();
    for (const t of this.texts) t.update();
    this.particles = this.particles.filter((p) => p.life > 0);
    this.texts = this.texts.filter((t) => t.life > 0);

    // Orb collision → score + combo
    for (let i = this.orbs.length - 1; i >= 0; i--) {
      if (circleCircle(this.orbs[i], this.player)) {
        const orb = this.orbs.splice(i, 1)[0];
        this.combo++;
        this.comboTimer = COMBO_TIMEOUT;
        const pts = calcPoints(this.combo);
        this.score += pts;
        this.shake = Math.min(8, SHAKE_ORB_BASE + this.combo * SHAKE_ORB_COMBO);
        this.explode(orb.x, orb.y, orb.hue, 18);
        this.texts.push(new FloatText(orb.x, orb.y, `+${pts}`, `hsl(${orb.hue}, 90%, 75%)`));
        sfxCollect(this.combo);
      }
    }

    // Spike collision → lose life
    if (this.invuln === 0) {
      for (let i = this.spikes.length - 1; i >= 0; i--) {
        if (circleCircleShrunk(this.spikes[i], this.player, 2)) {
          const spike = this.spikes.splice(i, 1)[0];
          this.lives--;
          this.shake = SHAKE_SPIKE_HIT;
          this.combo = 0;
          this.comboTimer = 0;
          this.invuln = PLAYER_INVULN_FRAMES;
          this.explode(spike.x, spike.y, 0, 30, true);
          this.texts.push(new FloatText(this.player.x, this.player.y - 20, '-1 ♥', '#ff5577'));
          sfxHit();
          if (this.lives <= 0) {
            this.end();
            return;
          }
        }
      }
    }

    // Heart collision → restore life
    for (let i = this.hearts.length - 1; i >= 0; i--) {
      if (this.hearts[i].expired()) {
        this.hearts.splice(i, 1);
      } else if (circleCircle(this.hearts[i], this.player)) {
        const heart = this.hearts.splice(i, 1)[0];
        if (this.lives < MAX_LIVES) this.lives++;
        this.shake = SHAKE_HEART;
        this.explode(heart.x, heart.y, 340, 40, true);
        this.texts.push(new FloatText(this.player.x, this.player.y - 20, '+1 ♥', '#ff88aa'));
        sfxHeart();
      }
    }

    this.shake *= SHAKE_DECAY;
    this.hud.update(this.score, this.highScore, this.lives);
  }

  private draw(): void {
    const ctx = this.ctx;

    ctx.fillStyle = `rgba(6, 6, 15, ${MOTION_BLUR_ALPHA})`;
    ctx.fillRect(0, 0, this.w, this.h);

    ctx.save();
    if (this.shake > 0.5) {
      ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    }

    for (const orb of this.orbs) orb.draw(ctx);
    for (const spike of this.spikes) spike.draw(ctx);
    for (const heart of this.hearts) heart.draw(ctx);
    for (const p of this.particles) p.draw(ctx);
    for (const t of this.texts) t.draw(ctx);
    this.player.draw(ctx, this.invuln);

    // Combo indicator
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
  }

  tick(): void {
    if (this.state === 'playing') this.update();
    this.draw();
  }
}
