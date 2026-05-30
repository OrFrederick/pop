import { STICK_MAX_RADIUS, STICK_GUIDE_RADIUS, type StickState } from '../game/TouchInput';

const GUIDE_MARGIN = 80;
const GUIDE_BOTTOM = 90;

export class TouchHUD {
  draw(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    move: StickState,
    aim: StickState,
  ): void {
    const leftGx = GUIDE_MARGIN;
    const rightGx = w - GUIDE_MARGIN;
    const gy = h - GUIDE_BOTTOM;

    if (!move.active) this.drawGuide(ctx, leftGx, gy, 'move');
    if (!aim.active) this.drawGuide(ctx, rightGx, gy, 'aim');

    if (move.active) this.drawStick(ctx, move, 'rgba(110, 231, 255, 0.85)');
    if (aim.active) this.drawStick(ctx, aim, 'rgba(255, 209, 102, 0.9)');
  }

  private drawGuide(ctx: CanvasRenderingContext2D, x: number, y: number, label: 'move' | 'aim'): void {
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = label === 'move' ? '#6ee7ff' : '#ffd166';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(x, y, STICK_GUIDE_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = label === 'move' ? '#6ee7ff' : '#ffd166';
    ctx.font = '10px -apple-system, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label === 'move' ? 'MOVE' : 'AIM', x, y + 4);
    ctx.restore();
  }

  private drawStick(ctx: CanvasRenderingContext2D, s: StickState, color: string): void {
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(s.origin.x, s.origin.y, STICK_MAX_RADIUS, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = 0.85;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(s.current.x, s.current.y, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(s.current.x, s.current.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
