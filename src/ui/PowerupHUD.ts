export class PowerupHUD {
  private hue = 0;
  private name = '';
  private remaining = 0;
  private total = 1;
  private visible = false;

  setActive(type: string, hue: number, name: string, remaining: number, total: number): void {
    void type;
    this.hue = hue;
    this.name = name;
    this.remaining = remaining;
    this.total = total;
    this.visible = true;
  }

  clear(): void { this.visible = false; }

  draw(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    if (!this.visible) return;
    const x = w - 56;
    const y = h - 56;
    const r = 18;

    ctx.save();
    const frac = Math.max(0, this.remaining / this.total);
    ctx.strokeStyle = `hsl(${this.hue}, 80%, 65%)`;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(x, y, r + 5, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = `hsl(${this.hue}, 70%, 40%)`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px -apple-system, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(this.name.toUpperCase(), x - r - 10, y + 4);
    ctx.restore();
  }
}
