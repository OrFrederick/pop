import { STAT_IDS, STAT_NAMES, STAT_MAX, type StatTree, type StatId } from '../game/StatTree';

export class StatHUD {
  private readonly rowsEl: HTMLElement;
  private readonly pointsEl: HTMLElement;
  private readonly hudEl: HTMLElement;

  constructor() {
    this.hudEl = document.getElementById('stat-hud')!;
    this.rowsEl = document.getElementById('stat-rows')!;
    this.pointsEl = document.getElementById('stat-points')!;
  }

  show(): void { this.hudEl.style.display = 'block'; }
  hide(): void { this.hudEl.style.display = 'none'; }

  update(tree: StatTree, points: number): void {
    this.pointsEl.textContent = `${points} pt${points === 1 ? '' : 's'}`;
    if (points > 0) {
      this.pointsEl.style.color = '#ffd166';
      this.pointsEl.style.background = 'rgba(255, 209, 102, 0.18)';
    } else {
      this.pointsEl.style.color = 'rgba(255,255,255,0.35)';
      this.pointsEl.style.background = 'rgba(255,255,255,0.06)';
    }
    this.renderRows(tree);
  }

  private renderRows(tree: StatTree): void {
    const rows = STAT_IDS.map((id: StatId, idx: number) => {
      const level = tree[id];
      const row = document.createElement('div');
      row.className = 'stat-row';
      const key = document.createElement('span');
      key.className = 'stat-key';
      key.textContent = String(idx + 1);
      const name = document.createElement('span');
      name.className = 'stat-name';
      name.textContent = STAT_NAMES[id];
      const pips = document.createElement('span');
      pips.className = 'stat-pips';
      for (let i = 0; i < STAT_MAX; i++) {
        const pip = document.createElement('span');
        pip.className = 'stat-pip' + (i < level ? ' filled' : '');
        pips.appendChild(pip);
      }
      row.append(key, name, pips);
      return row;
    });
    this.rowsEl.replaceChildren(...rows);
  }
}
