import {
  ORB_MIN_RADIUS,
  ORB_MAX_RADIUS,
  ORB_HUE_MIN,
  ORB_HUE_MAX,
  ORB_MIN_SPEED,
  ORB_MAX_SPEED,
  ORB_SAFE_DISTANCE,
  ORB_SPAWN_ATTEMPTS,
} from './constants';
import { rand } from '../util/math';

export class Orb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  readonly r: number;
  readonly hue: number;
  private pulse: number;
  private spawned = 0;

  constructor(w: number, h: number, playerX: number, playerY: number) {
    this.r = rand(ORB_MIN_RADIUS, ORB_MAX_RADIUS);
    const margin = this.r + 20;
    let attempts = 0;
    let x = 0, y = 0;
    do {
      x = rand(margin, w - margin);
      y = rand(margin, h - margin);
      attempts++;
    } while (Math.hypot(x - playerX, y - playerY) < ORB_SAFE_DISTANCE && attempts < ORB_SPAWN_ATTEMPTS);
    this.x = x;
    this.y = y;

    const speed = rand(ORB_MIN_SPEED, ORB_MAX_SPEED);
    const angle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.hue = rand(ORB_HUE_MIN, ORB_HUE_MAX);
    this.pulse = Math.random() * Math.PI * 2;
  }

  update(w: number, h: number): void {
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
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const r = (this.r + Math.sin(this.pulse) * 2) * this.spawned;
    const grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r * 3);
    grd.addColorStop(0, `hsla(${this.hue}, 95%, 75%, 0.95)`);
    grd.addColorStop(0.4, `hsla(${this.hue}, 90%, 60%, 0.5)`);
    grd.addColorStop(1, `hsla(${this.hue}, 90%, 50%, 0)`);
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `hsla(${this.hue}, 100%, 90%, 1)`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
  }
}
