import { STAT_IDS, STAT_NAMES, STAT_MAX, type StatTree, type StatId } from '../game/StatTree';

export class StatInvestOverlay {
  private readonly el: HTMLDivElement;
  private readonly fab: HTMLButtonElement;
  private readonly panel: HTMLDivElement;
  private readonly pointsEl: HTMLSpanElement;
  private readonly onInvest: (id: StatId) => void;
  private tree: StatTree;
  private points = 0;
  private visible = false;

  constructor(onInvest: (id: StatId) => void, initialTree: StatTree) {
    this.onInvest = onInvest;
    this.tree = initialTree;
    this.fab = document.getElementById('invest-fab') as HTMLButtonElement;

    this.el = document.createElement('div');
    this.el.className = 'stat-invest';
    this.el.id = 'stat-invest';
    this.panel = document.createElement('div');
    this.panel.className = 'stat-invest-panel';
    this.el.appendChild(this.panel);
    document.body.appendChild(this.el);

    const header = document.createElement('div');
    header.className = 'stat-invest-header';
    const title = document.createElement('span');
    title.textContent = 'INVEST';
    this.pointsEl = document.createElement('span');
    this.pointsEl.className = 'stat-invest-points';
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'stat-invest-close';
    close.textContent = 'CLOSE';
    close.addEventListener('click', () => this.hide());
    const right = document.createElement('span');
    right.style.display = 'flex';
    right.style.gap = '8px';
    right.style.alignItems = 'center';
    right.append(this.pointsEl, close);
    header.append(title, right);
    this.panel.appendChild(header);

    this.el.addEventListener('click', (e) => {
      if (e.target === this.el) this.hide();
    });

    this.fab.addEventListener('click', () => this.show());

    this.renderRows();
  }

  update(tree: StatTree, points: number): void {
    this.tree = tree;
    this.points = points;
    this.pointsEl.textContent = `${points} pt${points === 1 ? '' : 's'}`;
    this.fab.classList.toggle('show', points > 0 && this.fabEnabled);
    if (this.visible) this.renderRows();
  }

  private fabEnabled = false;

  setFabEnabled(enabled: boolean): void {
    this.fabEnabled = enabled;
    this.fab.classList.toggle('show', enabled && this.points > 0);
  }

  show(): void {
    if (this.points <= 0) return;
    this.visible = true;
    this.el.classList.add('show');
    this.renderRows();
  }

  hide(): void {
    this.visible = false;
    this.el.classList.remove('show');
  }

  isVisible(): boolean { return this.visible; }

  private renderRows(): void {
    const rows = this.panel.querySelectorAll('.stat-invest-btn');
    rows.forEach(r => r.remove());

    STAT_IDS.forEach((id: StatId) => {
      const level = this.tree[id];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'stat-invest-btn' + (level >= STAT_MAX ? ' maxed' : '');
      btn.disabled = level >= STAT_MAX || this.points <= 0;

      const name = document.createElement('span');
      name.className = 'stat-invest-btn-name';
      name.textContent = STAT_NAMES[id];

      const pips = document.createElement('span');
      pips.className = 'stat-invest-btn-pips';
      for (let i = 0; i < STAT_MAX; i++) {
        const pip = document.createElement('span');
        pip.className = 'stat-invest-btn-pip' + (i < level ? ' filled' : '');
        pips.appendChild(pip);
      }

      btn.append(name, pips);
      btn.addEventListener('click', () => {
        if (level >= STAT_MAX || this.points <= 0) return;
        this.onInvest(id);
      });
      this.panel.appendChild(btn);
    });
  }
}
