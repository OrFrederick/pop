import { xpForNextLevel, XP_LEVEL_CAP, type XPState } from '../game/XP';

export class XPBar {
  private readonly levelEl: HTMLElement;
  private readonly textEl: HTMLElement;
  private readonly fillEl: HTMLElement;

  constructor() {
    this.levelEl = document.getElementById('xp-level')!;
    this.textEl = document.getElementById('xp-text')!;
    this.fillEl = document.getElementById('xp-bar-fill')!;
  }

  update(s: XPState): void {
    this.levelEl.textContent = `Lv ${s.level}`;
    if (s.level >= XP_LEVEL_CAP) {
      this.textEl.textContent = 'MAX';
      this.fillEl.style.width = '100%';
      return;
    }
    const need = xpForNextLevel(s.level);
    this.textEl.textContent = `${s.xp} / ${need}`;
    this.fillEl.style.width = `${(s.xp / need) * 100}%`;
  }
}
