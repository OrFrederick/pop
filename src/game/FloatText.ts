import { FLOAT_TEXT_RISE, FLOAT_TEXT_FADE } from './constants';

export class FloatText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number = 1;

  constructor(x: number, y: number, text: string, color = '#fff') {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
  }

  update(): void {
    this.y -= FLOAT_TEXT_RISE;
    this.life -= FLOAT_TEXT_FADE;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.life <= 0) return;
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.font = 'bold 20px -apple-system, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.text, this.x, this.y);
    ctx.globalAlpha = 1;
  }
}
