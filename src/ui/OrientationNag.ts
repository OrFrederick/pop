export class OrientationNag {
  private readonly el: HTMLElement;
  private enabled = false;

  constructor() {
    this.el = document.getElementById('orientation-nag')!;
    window.addEventListener('resize', () => this.refresh());
    window.addEventListener('orientationchange', () => this.refresh());
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.refresh();
  }

  isShowing(): boolean {
    return this.enabled && this.isPortrait();
  }

  private isPortrait(): boolean {
    return window.innerHeight > window.innerWidth;
  }

  private refresh(): void {
    const show = this.enabled && this.isPortrait();
    this.el.classList.toggle('show', show);
  }
}
