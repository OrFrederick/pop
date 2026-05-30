import type { EvolutionDef, EvolutionId } from '../game/Evolution';

export class EvolutionScreen {
  private options: EvolutionDef[] = [];
  private readonly el: HTMLDivElement;
  private readonly onPick: (id: EvolutionId) => void;
  private boundKey!: (e: KeyboardEvent) => void;

  constructor(onPick: (id: EvolutionId) => void) {
    this.onPick = onPick;
    this.el = document.createElement('div');
    this.el.id = 'evolution-screen';
    Object.assign(this.el.style, {
      display: 'none', position: 'fixed', inset: '0',
      background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(14px)',
      zIndex: '210', alignItems: 'center', justifyContent: 'center',
      gap: '24px', flexDirection: 'column',
    });
    document.body.appendChild(this.el);
  }

  show(options: EvolutionDef[]): void {
    this.options = options;
    this.renderCards();
    this.el.style.display = 'flex';
    this.boundKey = (e: KeyboardEvent) => {
      const idx = parseInt(e.key, 10) - 1;
      if (idx >= 0 && idx < this.options.length) this.pick(idx);
    };
    document.addEventListener('keydown', this.boundKey);
    this.el.addEventListener('click', (e) => {
      const card = (e.target as Element).closest('[data-idx]') as HTMLElement | null;
      if (card) this.pick(Number(card.dataset['idx']));
    }, { once: true });
  }

  hide(): void {
    this.el.style.display = 'none';
    document.removeEventListener('keydown', this.boundKey);
  }

  private pick(idx: number): void {
    if (!this.options[idx]) return;
    this.hide();
    this.onPick(this.options[idx].id);
  }

  private renderCards(): void {
    const title = document.createElement('div');
    Object.assign(title.style, {
      color: '#ffd166', font: 'bold 22px system-ui',
      letterSpacing: '3px', textAlign: 'center', marginBottom: '8px',
    });
    title.textContent = 'CHOOSE EVOLUTION';

    const row = document.createElement('div');
    row.className = 'upgrade-row';
    Object.assign(row.style, {
      display: 'flex', gap: '20px', alignItems: 'stretch',
      flexWrap: 'wrap', justifyContent: 'center', maxWidth: '900px',
    });

    this.options.forEach((u, i) => {
      const card = document.createElement('div');
      card.className = 'upgrade-card';
      card.dataset['idx'] = String(i);
      Object.assign(card.style, {
        background: 'rgba(255,209,102,0.07)', border: '1px solid rgba(255,209,102,0.3)',
        borderRadius: '12px', padding: '24px 20px', width: '200px',
        cursor: 'pointer', textAlign: 'center', transition: 'transform 0.1s',
      });
      card.addEventListener('mouseenter', () => { card.style.transform = 'translateY(-4px)'; });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });

      const hint = document.createElement('div');
      Object.assign(hint.style, { color: 'rgba(255,255,255,0.4)', font: '13px system-ui', marginBottom: '6px' });
      hint.textContent = `[${i + 1}]`;

      const name = document.createElement('div');
      Object.assign(name.style, { color: '#fff', font: 'bold 18px system-ui', marginBottom: '8px' });
      name.textContent = u.name;

      const desc = document.createElement('div');
      Object.assign(desc.style, { color: 'rgba(255,255,255,0.65)', font: '13px system-ui', lineHeight: '1.4' });
      desc.textContent = u.description;

      card.append(hint, name, desc);
      row.appendChild(card);
    });

    this.el.replaceChildren(title, row);
  }
}
