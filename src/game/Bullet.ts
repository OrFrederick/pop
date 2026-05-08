import { BOSS_BULLET_RADIUS, BOSS_BULLET_SPEED } from './constants';

export class Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  readonly r = BOSS_BULLET_RADIUS;

  constructor(x: number, y: number, angle: number, speedMult = 1) {
    this.x = x;
    this.y = y;
    const speed = BOSS_BULLET_SPEED * speedMult;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  update(slowMult = 1): void {
    this.x += this.vx * slowMult;
    this.y += this.vy * slowMult;
  }

  offscreen(w: number, h: number): boolean {
    return this.x < -20 || this.x > w + 20 || this.y < -20 || this.y > h + 20;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.shadowColor = '#ff3333';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ff3333';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
