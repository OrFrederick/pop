import { PARTICLE_DECAY_MIN, PARTICLE_DECAY_RANGE, PARTICLE_FRICTION } from './constants';
import { rand } from '../util/math';

export class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number = 1;
  hue: number;
  size: number;
  decay: number;

  constructor(x: number, y: number, hue: number, big = false) {
    this.x = x;
    this.y = y;
    const spread = big ? 14 : 7;
    this.vx = (Math.random() - 0.5) * spread;
    this.vy = (Math.random() - 0.5) * spread;
    this.hue = hue;
    this.size = (big ? 4 : 2) + rand(0, big ? 5 : 3);
    this.decay = PARTICLE_DECAY_MIN + rand(0, PARTICLE_DECAY_RANGE);
  }

  update(): void {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= PARTICLE_FRICTION;
    this.vy *= PARTICLE_FRICTION;
    this.life -= this.decay;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.life <= 0) return;
    ctx.fillStyle = `hsla(${this.hue}, 95%, 70%, ${this.life})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
    ctx.fill();
  }
}
