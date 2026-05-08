import {
  ORB_MIN_RADIUS, ORB_MAX_RADIUS, ORB_HUE_MIN, ORB_HUE_MAX,
  ORB_MIN_SPEED, ORB_MAX_SPEED, ORB_SAFE_DISTANCE, ORB_SPAWN_ATTEMPTS,
  ORB_GOLD_HUE, ORB_GOLD_RADIUS_BONUS, ORB_BOMB_HUE, ORB_BOMB_BLINK_INTERVAL,
  ORB_STANDARD_WEIGHT, ORB_GOLD_WEIGHT, ORB_BOMB_WEIGHT,
} from './constants';
import { rand } from '../util/math';

export type OrbType = 'standard' | 'gold' | 'bomb';

export function weightedOrbType(random = Math.random()): OrbType {
  const total = ORB_STANDARD_WEIGHT + ORB_GOLD_WEIGHT + ORB_BOMB_WEIGHT;
  const r = random * total;
  if (r < ORB_STANDARD_WEIGHT) return 'standard';
  if (r < ORB_STANDARD_WEIGHT + ORB_GOLD_WEIGHT) return 'gold';
  return 'bomb';
}

export class Orb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  readonly r: number;
  readonly hue: number;
  readonly type: OrbType;
  private pulse: number;
  private spawned = 0;
  private age = 0;

  constructor(
    type: OrbType,
    w: number, h: number,
    playerX: number, playerY: number,
    spawnAt?: { x: number; y: number },
  ) {
    this.type = type;
    if (type === 'gold') {
      this.r = rand(ORB_MIN_RADIUS, ORB_MAX_RADIUS) + ORB_GOLD_RADIUS_BONUS;
      this.hue = ORB_GOLD_HUE;
    } else if (type === 'bomb') {
      this.r = rand(ORB_MIN_RADIUS, ORB_MAX_RADIUS);
      this.hue = ORB_BOMB_HUE;
    } else {
      this.r = rand(ORB_MIN_RADIUS, ORB_MAX_RADIUS);
      this.hue = rand(ORB_HUE_MIN, ORB_HUE_MAX);
    }

    if (spawnAt) {
      this.x = spawnAt.x;
      this.y = spawnAt.y;
    } else {
      const margin = this.r + 20;
      let attempts = 0, x = 0, y = 0;
      do {
        x = rand(margin, w - margin);
        y = rand(margin, h - margin);
        attempts++;
      } while (
        Math.hypot(x - playerX, y - playerY) < ORB_SAFE_DISTANCE &&
        attempts < ORB_SPAWN_ATTEMPTS
      );
      this.x = x;
      this.y = y;
    }

    const speed = rand(ORB_MIN_SPEED, ORB_MAX_SPEED);
    const angle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.pulse = Math.random() * Math.PI * 2;
  }

  update(w: number, h: number, attractX?: number, attractY?: number): void {
    if (attractX !== undefined && attractY !== undefined) {
      const dx = attractX - this.x;
      const dy = attractY - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 1) {
        this.vx += (dx / dist) * 0.15;
        this.vy += (dy / dist) * 0.15;
      }
    }
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < this.r || this.x > w - this.r) {
      this.vx *= -1;
      this.x = Math.max(this.r, Math.min(w - this.r, this.x));
    }
    if (this.y < this.r || this.y > h - this.r) {
      this.vy *= -1;
      this.y = Math.max(this.r, Math.min(h - this.r, this.y));
    }
    this.pulse += 0.06;
    this.spawned = Math.min(1, this.spawned + 0.06);
    this.age++;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.type === 'bomb' && Math.floor(this.age / ORB_BOMB_BLINK_INTERVAL) % 2 === 0) return;

    const r = (this.r + Math.sin(this.pulse) * 2) * this.spawned;
    const { x, y, hue } = this;
    const glowMult = this.type === 'gold' ? 4 : 3;

    const grd = ctx.createRadialGradient(x, y, 0, x, y, r * glowMult);
    grd.addColorStop(0, `hsla(${hue}, 95%, 75%, 0.95)`);
    grd.addColorStop(0.4, `hsla(${hue}, 90%, 60%, 0.5)`);
    grd.addColorStop(1, `hsla(${hue}, 90%, 50%, 0)`);
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, r * glowMult, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `hsla(${hue}, 100%, 90%, 1)`;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
    ctx.fill();

    if (this.type === 'bomb') {
      ctx.strokeStyle = 'rgba(255,60,60,0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, r * 0.7, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}
