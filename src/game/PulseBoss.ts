import {
  BOSS_RADIUS, BOSS_HP, BOSS_ESCAPE_FRAMES,
  BOSS_RING_INTERVAL, BOSS_RING_COUNT,
  BOSS_SPIRAL_INTERVAL, BOSS_AIMED_INTERVAL, BOSS_AIMED_SPREAD, BOSS_WOBBLE,
} from './constants';
import { Bullet } from './Bullet';

export class PulseBoss {
  x: number;
  y: number;
  readonly r = BOSS_RADIUS;
  hp: number = BOSS_HP;
  private readonly spawnFrame: number;
  private spiralAngle = 0;
  private ringTimer = 0;
  private spiralTimer = 0;
  private aimTimer = 0;
  private wobbleVx = (Math.random() - 0.5) * BOSS_WOBBLE * 2;
  private wobbleVy = (Math.random() - 0.5) * BOSS_WOBBLE * 2;
  private wobbleFlip = 0;

  constructor(cx: number, cy: number, frame: number) {
    this.x = cx;
    this.y = cy;
    this.spawnFrame = frame;
  }

  escaped(frame: number): boolean {
    return frame - this.spawnFrame >= BOSS_ESCAPE_FRAMES;
  }

  hit(): void { this.hp--; }

  update(
    frame: number, wave: number,
    centerX: number, centerY: number,
    playerX: number, playerY: number,
  ): Bullet[] {
    const dx = centerX - this.x;
    const dy = centerY - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 5) { this.x += (dx / dist) * 0.3; this.y += (dy / dist) * 0.3; }

    if (++this.wobbleFlip >= 40) {
      this.wobbleFlip = 0;
      this.wobbleVx = (Math.random() - 0.5) * BOSS_WOBBLE * 2;
      this.wobbleVy = (Math.random() - 0.5) * BOSS_WOBBLE * 2;
    }
    this.x += this.wobbleVx;
    this.y += this.wobbleVy;

    const bullets: Bullet[] = [];
    const sm = wave >= 4 ? 1.5 : 1;

    if (++this.ringTimer >= BOSS_RING_INTERVAL) {
      this.ringTimer = 0;
      for (let i = 0; i < BOSS_RING_COUNT; i++) {
        bullets.push(new Bullet(this.x, this.y, (i / BOSS_RING_COUNT) * Math.PI * 2, sm));
      }
    }

    if (wave >= 2 && ++this.spiralTimer >= BOSS_SPIRAL_INTERVAL) {
      this.spiralTimer = 0;
      this.spiralAngle += 0.2;
      bullets.push(new Bullet(this.x, this.y, this.spiralAngle, sm));
      bullets.push(new Bullet(this.x, this.y, this.spiralAngle + Math.PI, sm));
    }

    if (wave >= 3 && ++this.aimTimer >= BOSS_AIMED_INTERVAL) {
      this.aimTimer = 0;
      const base = Math.atan2(playerY - this.y, playerX - this.x);
      for (let i = -1; i <= 1; i++) {
        bullets.push(new Bullet(this.x, this.y, base + i * BOSS_AIMED_SPREAD, sm));
      }
    }

    return bullets;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const { x, y, r } = this;
    ctx.save();
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 40;
    const grd = ctx.createRadialGradient(x, y, 0, x, y, r * 2);
    grd.addColorStop(0, 'rgba(255,200,50,0.9)');
    grd.addColorStop(0.5, 'rgba(255,140,20,0.7)');
    grd.addColorStop(1, 'rgba(200,80,0,0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, r * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffcc33';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r + 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}
