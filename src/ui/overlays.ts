export class Overlays {
  private readonly overlay: HTMLElement;
  private readonly endTitle: HTMLElement;
  private readonly finalScore: HTMLElement;
  private readonly bestScore: HTMLElement;
  private readonly hint: HTMLElement;
  private visible = false;

  constructor(onRestart: () => void) {
    this.overlay = document.getElementById('overlay')!;
    this.endTitle = document.getElementById('endTitle')!;
    this.finalScore = document.getElementById('finalScore')!;
    this.bestScore = document.getElementById('bestScore')!;
    this.hint = document.getElementById('hint')!;
    document.getElementById('restartBtn')!.addEventListener('click', onRestart);
    window.addEventListener('keydown', (e) => {
      if (!this.visible) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onRestart();
      }
    });
  }

  showStart(): void {
    this.hint.style.display = '';
  }

  hideStart(): void {
    this.hint.style.display = 'none';
  }

  showGameOver(score: number, highScore: number): void {
    this.endTitle.textContent = 'Game Over';
    this.finalScore.textContent = `Score: ${score}`;
    this.bestScore.textContent = `Best: ${highScore}`;
    this.overlay.classList.add('show');
    this.visible = true;
  }

  hideGameOver(): void {
    this.overlay.classList.remove('show');
    this.visible = false;
  }
}
