import {
  PLAYER_RADIUS,
  PLAYER_ACCEL,
  PLAYER_FRICTION,
  PLAYER_MAX_SPEED,
  PLAYER_TRAIL_LENGTH,
  PLAYER_FLICKER_INTERVAL,
  PLAYER_MOUSE_DEAD_ZONE,
  TRAIL_FADE,
} from './constants';

interface TrailPoint {
  x: number;
  y: number;
  life: number;
}

export class Player {
  x: number;
  y: number;
  vx = 0;
  vy = 0;
  readonly r = PLAYER_RADIUS;
  private trail: TrailPoint[] = [];

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  fireDirection(): { x: number; y: number } {
    const sp = Math.hypot(this.vx, this.vy);
    if (sp > 0.1) return { x: this.vx / sp, y: this.vy / sp };
    return { x: 0, y: -1 };
  }

  reset(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.trail = [];
  }

  update(keys: Set<string>, w: number, h: number, target?: { x: number; y: number }): void {
    let ax = 0, ay = 0;
    if (target) {
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > PLAYER_MOUSE_DEAD_ZONE) {
        ax = (dx / dist) * PLAYER_ACCEL;
        ay = (dy / dist) * PLAYER_ACCEL;
      }
    } else {
      if (keys.has('arrowup') || keys.has('w')) ay -= PLAYER_ACCEL;
      if (keys.has('arrowdown') || keys.has('s')) ay += PLAYER_ACCEL;
      if (keys.has('arrowleft') || keys.has('a')) ax -= PLAYER_ACCEL;
      if (keys.has('arrowright') || keys.has('d')) ax += PLAYER_ACCEL;
    }

    this.vx += ax;
    this.vy += ay;
    this.vx *= PLAYER_FRICTION;
    this.vy *= PLAYER_FRICTION;

    const sp = Math.hypot(this.vx, this.vy);
    if (sp > PLAYER_MAX_SPEED) {
      this.vx = (this.vx / sp) * PLAYER_MAX_SPEED;
      this.vy = (this.vy / sp) * PLAYER_MAX_SPEED;
    }

    this.x += this.vx;
    this.y += this.vy;

    if (this.x < this.r) { this.x = this.r; this.vx = 0; }
    if (this.x > w - this.r) { this.x = w - this.r; this.vx = 0; }
    if (this.y < this.r) { this.y = this.r; this.vy = 0; }
    if (this.y > h - this.r) { this.y = h - this.r; this.vy = 0; }

    this.trail.push({ x: this.x, y: this.y, life: 1 });
    if (this.trail.length > PLAYER_TRAIL_LENGTH) this.trail.shift();
    for (const t of this.trail) t.life -= TRAIL_FADE;
  }

  draw(ctx: CanvasRenderingContext2D, invuln: number): void {
    for (const t of this.trail) {
      if (t.life <= 0) continue;
      ctx.fillStyle = `hsla(280, 90%, 70%, ${t.life * 0.4})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, this.r * t.life * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }

    if (invuln > 0 && Math.floor(invuln / PLAYER_FLICKER_INTERVAL) % 2 === 1) return;

    const grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 4);
    grd.addColorStop(0, 'rgba(167, 139, 250, 0.8)');
    grd.addColorStop(0.5, 'rgba(99, 102, 241, 0.3)');
    grd.addColorStop(1, 'rgba(99, 102, 241, 0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r * 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r * 0.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.stroke();
  }
}
