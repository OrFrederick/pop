export class HUD {
  private readonly scoreEl: HTMLElement;
  private readonly highEl: HTMLElement;
  private readonly livesEl: HTMLElement;

  constructor() {
    this.scoreEl = document.getElementById('score')!;
    this.highEl = document.getElementById('high')!;
    this.livesEl = document.getElementById('lives')!;
  }

  update(score: number, highScore: number, lives: number): void {
    this.scoreEl.textContent = String(score);
    this.highEl.textContent = String(highScore);
    this.livesEl.textContent = lives > 0 ? '♥ '.repeat(lives).trim() : '—';
  }
}
