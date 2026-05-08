import type { UpgradeId } from './ActiveEffects';

export interface UpgradeDef {
  id: UpgradeId;
  name: string;
  description: string;
}

export const UPGRADE_POOL: UpgradeDef[] = [
  { id: 'speed_demon',  name: 'Speed Demon',  description: 'Top speed +25%, snappier acceleration' },
  { id: 'iron_grip',    name: 'Iron Grip',    description: 'Tighter control, lower top speed' },
  { id: 'combo_master', name: 'Combo Master', description: 'Combo window +60 frames' },
  { id: 'orb_pull',     name: 'Orb Pull',     description: 'Nearby orbs drift toward you' },
  { id: 'lucky_drop',   name: 'Lucky Drop',   description: 'Powerups spawn 33% more often' },
  { id: 'berserker',    name: 'Berserker',    description: 'Score ×3 at 1 life remaining' },
  { id: 'extra_life',   name: 'Extra Life',   description: '+1 life immediately' },
  { id: 'blitz',        name: 'Blitz',        description: 'Spikes spawn 20% faster, +5 pts per dodge' },
  { id: 'collector',    name: 'Collector',    description: 'Orb cap +4 permanently' },
  { id: 'wide_trail',   name: 'Wide Trail',   description: 'Trail length nearly doubles' },
];

export function pickUpgradeOptions(
  picked: Set<UpgradeId>,
  pool: UpgradeId[],
): UpgradeId[] {
  const available = pool.filter(id => !picked.has(id));
  return available.sort(() => Math.random() - 0.5).slice(0, 3);
}

export class UpgradeScreen {
  private options: UpgradeDef[] = [];
  private readonly el: HTMLDivElement;
  private readonly onPick: (id: UpgradeId) => void;
  private boundKey!: (e: KeyboardEvent) => void;

  constructor(onPick: (id: UpgradeId) => void) {
    this.onPick = onPick;
    this.el = document.createElement('div');
    this.el.id = 'upgrade-screen';
    Object.assign(this.el.style, {
      display: 'none', position: 'fixed', inset: '0',
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)',
      zIndex: '200', alignItems: 'center', justifyContent: 'center',
      gap: '24px', flexDirection: 'column',
    });
    document.body.appendChild(this.el);
  }

  show(picked: Set<UpgradeId>): void {
    const ids = pickUpgradeOptions(picked, UPGRADE_POOL.map(u => u.id));
    if (ids.length === 0) { this.onPick('extra_life'); return; }
    this.options = ids.map(id => UPGRADE_POOL.find(u => u.id === id)!);
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
      color: '#fff', font: 'bold 20px system-ui',
      letterSpacing: '2px', textAlign: 'center', marginBottom: '8px',
    });
    title.textContent = 'CHOOSE UPGRADE';

    const row = document.createElement('div');
    Object.assign(row.style, { display: 'flex', gap: '20px', alignItems: 'stretch' });

    this.options.forEach((u, i) => {
      const card = document.createElement('div');
      card.dataset['idx'] = String(i);
      Object.assign(card.style, {
        background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '12px', padding: '24px 20px', width: '180px',
        cursor: 'pointer', textAlign: 'center', transition: 'transform 0.1s',
      });
      card.addEventListener('mouseenter', () => { card.style.transform = 'translateY(-4px)'; });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });

      const hint = document.createElement('div');
      Object.assign(hint.style, { color: 'rgba(255,255,255,0.4)', font: '13px system-ui', marginBottom: '6px' });
      hint.textContent = `[${i + 1}]`;

      const name = document.createElement('div');
      Object.assign(name.style, { color: '#fff', font: 'bold 16px system-ui', marginBottom: '8px' });
      name.textContent = u.name;

      const desc = document.createElement('div');
      Object.assign(desc.style, { color: 'rgba(255,255,255,0.6)', font: '13px system-ui', lineHeight: '1.4' });
      desc.textContent = u.description;

      card.append(hint, name, desc);
      row.appendChild(card);
    });

    this.el.replaceChildren(title, row);
  }
}
