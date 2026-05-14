import { HIGH_SCORE_KEY, CONTROL_MODE_KEY } from '../game/constants';

export function loadHighScore(): number {
  const stored = localStorage.getItem(HIGH_SCORE_KEY);
  if (!stored) return 0;
  const parsed = parseInt(stored, 10);
  return isNaN(parsed) ? 0 : parsed;
}

export function saveHighScore(score: number): void {
  localStorage.setItem(HIGH_SCORE_KEY, String(score));
}

export type ControlMode = 'keyboard' | 'mouse';

export function loadControlMode(): ControlMode {
  const stored = localStorage.getItem(CONTROL_MODE_KEY);
  return stored === 'mouse' ? 'mouse' : 'keyboard';
}

export function saveControlMode(mode: ControlMode): void {
  localStorage.setItem(CONTROL_MODE_KEY, mode);
}
