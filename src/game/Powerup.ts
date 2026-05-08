import type { PowerupType } from './ActiveEffects';
import {
  POWERUP_RADIUS, POWERUP_LIFETIME, POWERUP_BLINK_THRESHOLD, POWERUP_BLINK_INTERVAL,
  POWERUP_HEART_WEIGHT, POWERUP_OTHER_WEIGHT, HEART_MAX_SPEED, MAX_LIVES,
} from './constants';
import { rand } from '../util/math';

export const POWERUP_HUES: Record<PowerupType, number> = {
  shield: 210, slow: 55, magnet: 150, frenzy: 30, ghost: 270, heart: 340,
};

const POWERUP_NAMES: Record<PowerupType, string> = {
  shield: 'Shield', slow: 'Slow', magnet: 'Magnet', frenzy: 'Frenzy', ghost: 'Ghost', heart: 'Heart',
};

const OTHER_TYPES: PowerupType[] = ['shield', 'slow', 'magnet', 'frenzy', 'ghost'];

export function weightedPowerupType(random = Math.random(), lives: number): PowerupType {
  const canHeart = lives < MAX_LIVES;
  const total = canHeart
    ? POWERUP_HEART_WEIGHT + OTHER_TYPES.length * POWERUP_OTHER_WEIGHT
    : OTHER_TYPES.length * POWERUP_OTHER_WEIGHT;
  const r = random * total;
  if (canHeart && r < POWERUP_HEART_WEIGHT) return 'heart';
  const offset = canHeart ? POWERUP_HEART_WEIGHT : 0;
  const idx = Math.floor((r - offset) / POWERUP_OTHER_WEIGHT);
  return OTHER_TYPES[Math.min(idx, OTHER_TYPES.length - 1)];
}

export class Powerup {
  x: number;
  y: number;
  vx: number;
  vy: number;
  readonly r = POWERUP_RADIUS;
  readonly type: PowerupType;
  readonly hue: number;
  readonly name: string;
  private life = POWERUP_LIFETIME;
  private pulse = 0;
  private spawned = 0;

  constructor(type: PowerupType, w: number, h: number) {
    this.type = type;
    this.hue = POWERUP_HUES[type];
    this.name = POWERUP_NAMES[type];
    const margin = this.r + 30;
    this.x = rand(margin, w - margin);
    this.y = rand(margin, h - margin);
    this.vx = (Math.random() - 0.5) * HEART_MAX_SPEED;
    this.vy = (Math.random() - 0.5) * HEART_MAX_SPEED;
  }

  update(w: number, h: number): void {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < this.r || this.x > w - this.r) this.vx *= -1;
    if (this.y < this.r || this.y > h - this.r) this.vy *= -1;
    this.pulse += 0.12;
    this.spawned = Math.min(1, this.spawned + 0.04);
    this.life--;
  }

  expired(): boolean { return this.life <= 0; }
  get lifeRemaining(): number { return this.life; }
  get lifeTotal(): number { return POWERUP_LIFETIME; }

  draw(ctx: CanvasRenderingContext2D): void {
    const blink =
      this.life < POWERUP_BLINK_THRESHOLD &&
      Math.floor(this.life / POWERUP_BLINK_INTERVAL) % 2 === 0;
    if (blink) return;

    const scale = (1 + Math.sin(this.pulse) * 0.1) * this.spawned;
    const { x, y, r, hue } = this;

    const grd = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
    grd.addColorStop(0, `hsla(${hue}, 90%, 70%, 0.5)`);
    grd.addColorStop(1, `hsla(${hue}, 90%, 50%, 0)`);
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, r * 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.shadowColor = `hsl(${hue}, 90%, 60%)`;
    ctx.shadowBlur = 20;
    ctx.fillStyle = `hsl(${hue}, 80%, 55%)`;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    this.drawSymbol(ctx, r);
    ctx.restore();
  }

  private drawSymbol(ctx: CanvasRenderingContext2D, r: number): void {
    const s = r * 0.5;
    switch (this.type) {
      case 'shield': {
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
          ctx[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(a) * s, Math.sin(a) * s);
        }
        ctx.closePath();
        ctx.stroke();
        break;
      }
      case 'slow':
        ctx.beginPath();
        ctx.moveTo(-s, -s); ctx.lineTo(s, -s); ctx.lineTo(0, 0); ctx.closePath(); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-s, s); ctx.lineTo(s, s); ctx.lineTo(0, 0); ctx.closePath(); ctx.stroke();
        break;
      case 'magnet':
        ctx.beginPath();
        ctx.arc(0, -s * 0.3, s * 0.7, Math.PI, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-s * 0.7, -s * 0.3); ctx.lineTo(-s * 0.7, s);
        ctx.moveTo(s * 0.7, -s * 0.3); ctx.lineTo(s * 0.7, s);
        ctx.stroke();
        break;
      case 'frenzy':
        ctx.beginPath();
        ctx.moveTo(s * 0.3, -s);
        ctx.lineTo(-s * 0.1, 0); ctx.lineTo(s * 0.3, 0); ctx.lineTo(-s * 0.3, s);
        ctx.stroke();
        break;
      case 'ghost':
        ctx.beginPath();
        ctx.arc(0, -s * 0.2, s * 0.6, Math.PI, 0);
        ctx.lineTo(s * 0.6, s * 0.4);
        ctx.quadraticCurveTo(s * 0.3, s * 0.8, 0, s * 0.4);
        ctx.quadraticCurveTo(-s * 0.3, s * 0.8, -s * 0.6, s * 0.4);
        ctx.closePath();
        ctx.stroke();
        break;
      case 'heart':
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        ctx.moveTo(0, s * 0.4);
        ctx.bezierCurveTo(0, s * 0.1, -s * 0.5, -s * 0.3, -s, -s * 0.1);
        ctx.bezierCurveTo(-s * 1.4, s * 0.3, -s * 0.5, s * 0.9, 0, s * 1.1);
        ctx.bezierCurveTo(s * 0.5, s * 0.9, s * 1.4, s * 0.3, s, -s * 0.1);
        ctx.bezierCurveTo(s * 0.5, -s * 0.3, 0, s * 0.1, 0, s * 0.4);
        ctx.fill();
        break;
    }
  }
}
