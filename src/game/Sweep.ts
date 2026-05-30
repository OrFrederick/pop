import { Bullet } from './Bullet';
import {
  SWEEP_BULLET_COUNT, SWEEP_BULLET_SPEED, SWEEP_TELEGRAPH_FRAMES,
  BOSS_BULLET_SPEED,
} from './constants';

export type SweepEdge = 'left' | 'right' | 'top' | 'bottom';

export class Sweep {
  private readonly _bullets: Bullet[] = [];
  private telegraph = SWEEP_TELEGRAPH_FRAMES;
  private spawned = false;

  constructor(
    private readonly edge: SweepEdge,
    private readonly w: number,
    private readonly h: number,
  ) {}

  update(slowMult = 1): void {
    if (this.telegraph > 0) {
      this.telegraph--;
      return;
    }
    if (!this.spawned) {
      this.spawnBullets();
      this.spawned = true;
    }
    for (const b of this._bullets) b.update(slowMult);
  }

  private spawnBullets(): void {
    const speedMult = SWEEP_BULLET_SPEED / BOSS_BULLET_SPEED;
    for (let i = 0; i < SWEEP_BULLET_COUNT; i++) {
      const t = i / (SWEEP_BULLET_COUNT - 1);
      let x = 0, y = 0, angle = 0;
      if (this.edge === 'left')   { x = 0;       y = t * this.h; angle = 0; }
      if (this.edge === 'right')  { x = this.w;  y = t * this.h; angle = Math.PI; }
      if (this.edge === 'top')    { x = t * this.w; y = 0;       angle = Math.PI / 2; }
      if (this.edge === 'bottom') { x = t * this.w; y = this.h;  angle = -Math.PI / 2; }
      this._bullets.push(new Bullet(x, y, angle, speedMult));
    }
  }

  bullets(): Bullet[] { return this._bullets; }

  telegraphAlpha(): number {
    return this.telegraph / SWEEP_TELEGRAPH_FRAMES;
  }

  edgeId(): SweepEdge { return this.edge; }

  done(w: number, h: number): boolean {
    if (!this.spawned) return false;
    return this._bullets.every(b => b.offscreen(w, h));
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.telegraph > 0) {
      const a = this.telegraphAlpha();
      ctx.save();
      ctx.strokeStyle = `rgba(255, 80, 80, ${0.7 * a})`;
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 8]);
      ctx.beginPath();
      if (this.edge === 'left')   { ctx.moveTo(0, 0);          ctx.lineTo(0, this.h); }
      if (this.edge === 'right')  { ctx.moveTo(this.w, 0);     ctx.lineTo(this.w, this.h); }
      if (this.edge === 'top')    { ctx.moveTo(0, 0);          ctx.lineTo(this.w, 0); }
      if (this.edge === 'bottom') { ctx.moveTo(0, this.h);     ctx.lineTo(this.w, this.h); }
      ctx.stroke();
      ctx.restore();
    }
    for (const b of this._bullets) b.draw(ctx);
  }
}
