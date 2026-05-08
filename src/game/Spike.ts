import {
  SPIKE_BASE_SPEED,
  SPIKE_SPEED_VARIANCE,
  SPIKE_SPEED_MAX_BONUS,
  SPIKE_SPEED_TIME_FACTOR,
  SPIKE_SCATTER,
  SPIKE_OFFSCREEN_MARGIN,
  SPIKE_ROTATION_SPEED,
  SPIKE_POINTS,
} from './constants';

export class Spike {
  x: number;
  y: number;
  vx: number;
  vy: number;
  readonly r = 14;
  private rot = 0;
  private spawned = 0;

  constructor(w: number, h: number, playerX: number, playerY: number, time: number) {
    const side = Math.floor(Math.random() * 4);
    const m = 40;
    if (side === 0) { this.x = Math.random() * w; this.y = -m; }
    else if (side === 1) { this.x = w + m; this.y = Math.random() * h; }
    else if (side === 2) { this.x = Math.random() * w; this.y = h + m; }
    else { this.x = -m; this.y = Math.random() * h; }

    const tx = playerX + (Math.random() - 0.5) * SPIKE_SCATTER;
    const ty = playerY + (Math.random() - 0.5) * SPIKE_SCATTER;
    const angle = Math.atan2(ty - this.y, tx - this.x);
    const speed =
      SPIKE_BASE_SPEED +
      Math.random() * SPIKE_SPEED_VARIANCE +
      Math.min(SPIKE_SPEED_MAX_BONUS, time * SPIKE_SPEED_TIME_FACTOR);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  update(): void {
    this.x += this.vx;
    this.y += this.vy;
    this.rot += SPIKE_ROTATION_SPEED;
    this.spawned = Math.min(1, this.spawned + 0.08);
  }

  offscreen(w: number, h: number): boolean {
    const m = SPIKE_OFFSCREEN_MARGIN;
    return this.x < -m || this.x > w + m || this.y < -m || this.y > h + m;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.scale(this.spawned, this.spawned);
    ctx.shadowColor = '#ff3355';
    ctx.shadowBlur = 24;
    const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, this.r * 2);
    grd.addColorStop(0, '#ff7799');
    grd.addColorStop(1, '#cc1133');
    ctx.fillStyle = grd;
    ctx.beginPath();
    for (let i = 0; i < SPIKE_POINTS; i++) {
      const a = (i / SPIKE_POINTS) * Math.PI * 2;
      const r = i % 2 === 0 ? this.r : this.r * 0.45;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
