export class HUD {
  private readonly scoreEl: HTMLElement;
  private readonly highEl: HTMLElement;
  private readonly livesEl: HTMLElement;
  private readonly waveEl: HTMLElement;
  private readonly upgradeListEl: HTMLElement;

  constructor() {
    this.scoreEl = document.getElementById('score')!;
    this.highEl = document.getElementById('high')!;
    this.livesEl = document.getElementById('lives')!;
    this.waveEl = document.getElementById('wave')!;
    this.upgradeListEl = document.getElementById('upgrade-list')!;
  }

  update(score: number, highScore: number, lives: number, wave: number): void {
    this.scoreEl.textContent = String(score);
    this.highEl.textContent = String(highScore);
    this.livesEl.textContent = lives > 0 ? '♥ '.repeat(lives).trim() : '—';
    this.waveEl.textContent = `Wave ${wave}`;
  }

  setActiveUpgrades(names: string[]): void {
    this.upgradeListEl.replaceChildren(
      ...names.map(n => {
        const d = document.createElement('div');
        d.className = 'upgrade-badge';
        d.textContent = n;
        return d;
      })
    );
  }
}
