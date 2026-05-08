export class BossBar {
  private readonly container: HTMLDivElement;
  private readonly fill: HTMLDivElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'boss-bar';
    Object.assign(this.container.style, {
      position: 'fixed', top: '16px', left: '50%',
      transform: 'translateX(-50%)', width: '220px', height: '12px',
      background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,200,50,0.6)',
      borderRadius: '6px', display: 'none', zIndex: '100',
    });
    this.fill = document.createElement('div');
    Object.assign(this.fill.style, {
      height: '100%', background: 'linear-gradient(90deg, #ff8800, #ffdd44)',
      borderRadius: '6px', width: '100%',
    });
    this.container.appendChild(this.fill);
    document.body.appendChild(this.container);
  }

  show(hp: number, maxHp: number): void {
    this.container.style.display = 'block';
    this.fill.style.width = `${Math.max(0, (hp / maxHp) * 100)}%`;
  }

  hide(): void { this.container.style.display = 'none'; }
}
