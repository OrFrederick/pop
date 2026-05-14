import {
  BOSS_RADIUS, BOSS_HP, BOSS_ESCAPE_FRAMES,
  BOSS_RING_INTERVAL, BOSS_RING_COUNT, BOSS_RING_TELEGRAPH,
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
  private ringTelegraph = 0;
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

  telegraphAlpha(): number {
    if (this.ringTelegraph <= 0) return 0;
    return this.ringTelegraph / BOSS_RING_TELEGRAPH;
  }

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
    // Speed scales gently with wave; capped so late waves stay readable.
    const sm = 1 + Math.min(0.6, Math.max(0, wave - 3) * 0.15);
    // Phase 1: full HP, rings only. Phase 2: after first hit, +spiral. Phase 3: <=1/3 HP, +aimed (enrage).
    const wounded = this.hp < BOSS_HP;
    const enrage = this.hp <= Math.ceil(BOSS_HP / 3);

    if (this.ringTelegraph > 0) this.ringTelegraph--;

    if (++this.ringTimer >= BOSS_RING_INTERVAL - BOSS_RING_TELEGRAPH && this.ringTelegraph === 0 && this.ringTimer < BOSS_RING_INTERVAL) {
      this.ringTelegraph = BOSS_RING_TELEGRAPH;
    }
    if (this.ringTimer >= BOSS_RING_INTERVAL) {
      this.ringTimer = 0;
      const count = enrage ? BOSS_RING_COUNT + 2 : BOSS_RING_COUNT;
      const offset = Math.random() * Math.PI * 2;
      for (let i = 0; i < count; i++) {
        bullets.push(new Bullet(this.x, this.y, offset + (i / count) * Math.PI * 2, sm));
      }
    }

    // Spiral unlocks after first hit, or on wave 3+ regardless.
    const spiralUnlocked = wounded || wave >= 3;
    if (spiralUnlocked && ++this.spiralTimer >= BOSS_SPIRAL_INTERVAL) {
      this.spiralTimer = 0;
      this.spiralAngle += 0.35;
      bullets.push(new Bullet(this.x, this.y, this.spiralAngle, sm));
      bullets.push(new Bullet(this.x, this.y, this.spiralAngle + Math.PI, sm));
    }

    // Aimed: enrage phase only.
    if (enrage && ++this.aimTimer >= BOSS_AIMED_INTERVAL) {
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
    const tel = this.telegraphAlpha();
    ctx.save();
    ctx.shadowColor = tel > 0 ? '#ff4444' : '#ffaa00';
    ctx.shadowBlur = 40 + tel * 30;
    const grd = ctx.createRadialGradient(x, y, 0, x, y, r * 2);
    grd.addColorStop(0, 'rgba(255,200,50,0.9)');
    grd.addColorStop(0.5, 'rgba(255,140,20,0.7)');
    grd.addColorStop(1, 'rgba(200,80,0,0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, r * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = tel > 0 ? `rgb(255, ${Math.round(204 - tel * 140)}, ${Math.round(51 - tel * 51)})` : '#ffcc33';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(255,255,255,${0.4 + tel * 0.5})`;
    ctx.lineWidth = 2 + tel * 3;
    ctx.beginPath();
    ctx.arc(x, y, r + 4 + tel * 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}
