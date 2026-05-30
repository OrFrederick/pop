export interface StickState {
  active: boolean;
  origin: { x: number; y: number };
  current: { x: number; y: number };
  vec: { x: number; y: number };
  magnitude: number;
}

export const STICK_MAX_RADIUS = 70;
export const STICK_DEAD_ZONE = 0.18;
export const STICK_GUIDE_RADIUS = 64;

function emptyStick(): StickState {
  return {
    active: false,
    origin: { x: 0, y: 0 },
    current: { x: 0, y: 0 },
    vec: { x: 0, y: 0 },
    magnitude: 0,
  };
}

export class TouchInput {
  readonly move: StickState = emptyStick();
  readonly aim: StickState = emptyStick();
  private movePointerId: number | null = null;
  private aimPointerId: number | null = null;
  private viewportW = 0;
  private viewportH = 0;
  private onAnyPress: (() => void) | null = null;

  constructor(private readonly target: HTMLElement) {}

  setViewport(w: number, h: number): void {
    this.viewportW = w;
    this.viewportH = h;
  }

  /** Fires once per pointerdown — use for tap-to-start. */
  setOnAnyPress(cb: () => void): void {
    this.onAnyPress = cb;
  }

  attach(): void {
    this.target.addEventListener('pointerdown', this.onDown);
    this.target.addEventListener('pointermove', this.onMove);
    this.target.addEventListener('pointerup', this.onUp);
    this.target.addEventListener('pointercancel', this.onUp);
    this.target.addEventListener('pointerleave', this.onUp);
  }

  detach(): void {
    this.target.removeEventListener('pointerdown', this.onDown);
    this.target.removeEventListener('pointermove', this.onMove);
    this.target.removeEventListener('pointerup', this.onUp);
    this.target.removeEventListener('pointercancel', this.onUp);
    this.target.removeEventListener('pointerleave', this.onUp);
  }

  reset(): void {
    this.releaseStick(this.move);
    this.releaseStick(this.aim);
    this.movePointerId = null;
    this.aimPointerId = null;
  }

  private localPoint(e: PointerEvent): { x: number; y: number } {
    const rect = this.target.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  private isTouchLike(e: PointerEvent): boolean {
    return e.pointerType === 'touch' || e.pointerType === 'pen';
  }

  private onDown = (e: PointerEvent): void => {
    if (!this.isTouchLike(e)) return;
    e.preventDefault();
    if (this.onAnyPress) this.onAnyPress();
    const p = this.localPoint(e);
    const half = this.viewportW > 0 ? this.viewportW / 2 : window.innerWidth / 2;
    const wantsRight = p.x >= half;
    if (wantsRight && this.aimPointerId === null) {
      this.aimPointerId = e.pointerId;
      this.activateStick(this.aim, p);
    } else if (!wantsRight && this.movePointerId === null) {
      this.movePointerId = e.pointerId;
      this.activateStick(this.move, p);
    } else if (this.aimPointerId === null) {
      this.aimPointerId = e.pointerId;
      this.activateStick(this.aim, p);
    } else if (this.movePointerId === null) {
      this.movePointerId = e.pointerId;
      this.activateStick(this.move, p);
    }
    try { this.target.setPointerCapture(e.pointerId); } catch { /* ignore */ }
  };

  private onMove = (e: PointerEvent): void => {
    if (!this.isTouchLike(e)) return;
    const p = this.localPoint(e);
    if (e.pointerId === this.movePointerId) this.updateStick(this.move, p);
    else if (e.pointerId === this.aimPointerId) this.updateStick(this.aim, p);
  };

  private onUp = (e: PointerEvent): void => {
    if (e.pointerId === this.movePointerId) {
      this.releaseStick(this.move);
      this.movePointerId = null;
    } else if (e.pointerId === this.aimPointerId) {
      this.releaseStick(this.aim);
      this.aimPointerId = null;
    }
  };

  private activateStick(s: StickState, p: { x: number; y: number }): void {
    s.active = true;
    s.origin.x = p.x;
    s.origin.y = p.y;
    s.current.x = p.x;
    s.current.y = p.y;
    s.vec.x = 0;
    s.vec.y = 0;
    s.magnitude = 0;
  }

  private updateStick(s: StickState, p: { x: number; y: number }): void {
    s.current.x = p.x;
    s.current.y = p.y;
    const dx = p.x - s.origin.x;
    const dy = p.y - s.origin.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= 0.0001) {
      s.vec.x = 0; s.vec.y = 0; s.magnitude = 0;
      return;
    }
    const mag = Math.min(1, dist / STICK_MAX_RADIUS);
    s.vec.x = (dx / dist) * mag;
    s.vec.y = (dy / dist) * mag;
    s.magnitude = mag;
    if (dist > STICK_MAX_RADIUS) {
      s.current.x = s.origin.x + (dx / dist) * STICK_MAX_RADIUS;
      s.current.y = s.origin.y + (dy / dist) * STICK_MAX_RADIUS;
    }
  }

  private releaseStick(s: StickState): void {
    s.active = false;
    s.vec.x = 0;
    s.vec.y = 0;
    s.magnitude = 0;
  }

  /** True when stick is past deadzone. */
  static engaged(s: StickState): boolean {
    return s.active && s.magnitude > STICK_DEAD_ZONE;
  }
}

export function detectTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const hasTouch = 'ontouchstart' in window || (navigator.maxTouchPoints ?? 0) > 0;
  const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  return hasTouch || coarse;
}
