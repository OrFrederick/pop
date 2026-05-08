import {
  SPIKE_BASE_SPEED, SPIKE_SPEED_VARIANCE, SPIKE_SPEED_MAX_BONUS,
  SPIKE_SPEED_TIME_FACTOR, SPIKE_SCATTER, SPIKE_OFFSCREEN_MARGIN,
  SPIKE_ROTATION_SPEED, SPIKE_POINTS,
  SPIKE_FAST_COLOR, SPIKE_FAST_RADIUS, SPIKE_FAST_SPEED_MULT,
  SPIKE_HEAVY_COLOR, SPIKE_HEAVY_RADIUS, SPIKE_HEAVY_SPEED_MULT, SPIKE_HEAVY_DAMAGE,
  SPIKE_GHOST_FLICKER_INTERVAL,
} from './constants';

export type SpikeType = 'standard' | 'fast' | 'heavy' | 'ghost';

export function spikeTypeForWave(wave: number, random = Math.random()): SpikeType {
  const r = random * 100;
  if (wave >= 4) {
    if (r < 35) return 'standard';
    if (r < 65) return 'fast';
    if (r < 85) return 'heavy';
    return 'ghost';
  }
  if (wave >= 3) {
    if (r < 50) return 'standard';
    if (r < 80) return 'fast';
    return 'heavy';
  }
  if (wave >= 2) {
    return r < 70 ? 'standard' : 'fast';
  }
  return 'standard';
}

export function spikeSpeedMult(type: SpikeType): number {
  if (type === 'fast') return SPIKE_FAST_SPEED_MULT;
  if (type === 'heavy') return SPIKE_HEAVY_SPEED_MULT;
  return 1;
}

export function spikeRadiusFor(type: SpikeType): number {
  if (type === 'fast') return SPIKE_FAST_RADIUS;
  if (type === 'heavy') return SPIKE_HEAVY_RADIUS;
  return 14;
}

export class Spike {
  x: number;
  y: number;
  vx: number;
  vy: number;
  readonly r: number;
  readonly type: SpikeType;
  readonly damage: number;
  private rot = 0;
  private spawned = 0;
  private age = 0;

  constructor(
    type: SpikeType,
    w: number, h: number,
    playerX: number, playerY: number,
    time: number,
  ) {
    this.type = type;
    this.r = spikeRadiusFor(type);
    this.damage = type === 'heavy' ? SPIKE_HEAVY_DAMAGE : 1;

    const side = Math.floor(Math.random() * 4);
    const m = 40;
    if (side === 0) { this.x = Math.random() * w; this.y = -m; }
    else if (side === 1) { this.x = w + m; this.y = Math.random() * h; }
    else if (side === 2) { this.x = Math.random() * w; this.y = h + m; }
    else { this.x = -m; this.y = Math.random() * h; }

    const tx = playerX + (Math.random() - 0.5) * SPIKE_SCATTER;
    const ty = playerY + (Math.random() - 0.5) * SPIKE_SCATTER;
    const angle = Math.atan2(ty - this.y, tx - this.x);
    const base =
      SPIKE_BASE_SPEED +
      Math.random() * SPIKE_SPEED_VARIANCE +
      Math.min(SPIKE_SPEED_MAX_BONUS, time * SPIKE_SPEED_TIME_FACTOR);
    const speed = base * spikeSpeedMult(type);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  update(slowMult = 1): void {
    this.x += this.vx * slowMult;
    this.y += this.vy * slowMult;
    this.rot += SPIKE_ROTATION_SPEED;
    this.spawned = Math.min(1, this.spawned + 0.08);
    this.age++;
  }

  offscreen(w: number, h: number): boolean {
    const m = SPIKE_OFFSCREEN_MARGIN;
    return this.x < -m || this.x > w + m || this.y < -m || this.y > h + m;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.type === 'ghost' && Math.floor(this.age / SPIKE_GHOST_FLICKER_INTERVAL) % 2 === 1) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.scale(this.spawned, this.spawned);

    if (this.type === 'standard') {
      ctx.shadowColor = '#ff3355'; ctx.shadowBlur = 24;
      const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, this.r * 2);
      grd.addColorStop(0, '#ff7799'); grd.addColorStop(1, '#cc1133');
      ctx.fillStyle = grd;
    } else if (this.type === 'fast') {
      ctx.shadowColor = SPIKE_FAST_COLOR; ctx.shadowBlur = 20;
      ctx.fillStyle = SPIKE_FAST_COLOR;
    } else if (this.type === 'heavy') {
      ctx.shadowColor = SPIKE_HEAVY_COLOR; ctx.shadowBlur = 30;
      ctx.fillStyle = SPIKE_HEAVY_COLOR;
    } else {
      ctx.shadowColor = 'rgba(255,255,255,0.5)'; ctx.shadowBlur = 15;
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
    }

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
