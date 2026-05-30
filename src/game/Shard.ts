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
