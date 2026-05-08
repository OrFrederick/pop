import {
  HEART_RADIUS,
  HEART_LIFETIME,
  HEART_BLINK_THRESHOLD,
  HEART_BLINK_INTERVAL,
  HEART_MAX_SPEED,
} from './constants';
import { rand } from '../util/math';

export class Heart {
  x: number;
  y: number;
  vx: number;
  vy: number;
  readonly r = HEART_RADIUS;
  private pulse = 0;
  private spawned = 0;
  private life = HEART_LIFETIME;

  constructor(w: number, h: number) {
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

  expired(): boolean {
    return this.life <= 0;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const blink = this.life < HEART_BLINK_THRESHOLD && Math.floor(this.life / HEART_BLINK_INTERVAL) % 2 === 0;
    if (blink) return;

    const scale = (1 + Math.sin(this.pulse) * 0.12) * this.spawned;
    const r = this.r;

    const grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r * 4);
    grd.addColorStop(0, 'rgba(255, 100, 140, 0.6)');
    grd.addColorStop(0.5, 'rgba(255, 60, 110, 0.25)');
    grd.addColorStop(1, 'rgba(255, 60, 110, 0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(scale, scale);
    ctx.shadowColor = '#ff5577';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ff4477';
    ctx.beginPath();
    ctx.moveTo(0, r * 0.4);
    ctx.bezierCurveTo(0, r * 0.1, -r * 0.5, -r * 0.3, -r, -r * 0.1);
    ctx.bezierCurveTo(-r * 1.4, r * 0.3, -r * 0.5, r * 0.9, 0, r * 1.1);
    ctx.bezierCurveTo(r * 0.5, r * 0.9, r * 1.4, r * 0.3, r, -r * 0.1);
    ctx.bezierCurveTo(r * 0.5, -r * 0.3, 0, r * 0.1, 0, r * 0.4);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 200, 220, 0.7)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.4, -r * 0.05, r * 0.18, r * 0.1, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
