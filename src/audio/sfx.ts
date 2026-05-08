let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (!audioCtx) {
    try {
      audioCtx = new AudioContext();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

export function resumeAudio(): void {
  const ctx = getCtx();
  if (ctx && ctx.state === 'suspended') void ctx.resume();
}

function beep(freq: number, dur: number, type: OscillatorType, vol: number): void {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = vol;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  } catch {
    // audio errors are non-fatal
  }
}

export function sfxCollect(combo: number): void {
  beep(440 + Math.min(800, combo * 40), 0.08, 'triangle', 0.08);
}

export function sfxHit(): void {
  beep(120, 0.3, 'sawtooth', 0.12);
}

export function sfxHeart(): void {
  beep(660, 0.12, 'sine', 0.1);
  setTimeout(() => beep(880, 0.18, 'sine', 0.08), 80);
}

export function sfxGameOver(): void {
  beep(80, 0.6, 'sawtooth', 0.15);
}

function sweep(start: number, end: number, dur: number, type: OscillatorType, vol: number): void {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(start, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(end, ctx.currentTime + dur);
    gain.gain.value = vol;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  } catch { /* non-fatal */ }
}

function chord(freqs: number[], dur: number, vol: number): void {
  for (const f of freqs) beep(f, dur, 'sine', vol);
}

export function sfxBossSpawn(): void { sweep(60, 90, 0.8, 'sine', 0.1); }
export function sfxBossHit(): void { beep(880, 0.05, 'sine', 0.08); }
export function sfxBossDeath(): void { chord([220, 330, 440], 0.4, 0.1); }
export function sfxShieldAbsorb(): void {
  beep(200, 0.08, 'sawtooth', 0.1);
  setTimeout(() => beep(1200, 0.1, 'sine', 0.08), 40);
}
export function sfxSlowActivate(): void { sweep(600, 200, 0.3, 'sine', 0.08); }
export function sfxMagnetActivate(): void { sweep(300, 600, 0.2, 'triangle', 0.08); }
export function sfxFrenzyActivate(): void {
  beep(660, 0.05, 'sine', 0.1);
  setTimeout(() => beep(660, 0.05, 'sine', 0.1), 70);
  setTimeout(() => beep(660, 0.05, 'sine', 0.1), 140);
}
export function sfxGhostActivate(): void { sweep(800, 200, 0.15, 'sine', 0.05); }
export function sfxUpgrade(): void {
  beep(261, 0.08, 'sine', 0.1);
  setTimeout(() => beep(329, 0.08, 'sine', 0.1), 90);
  setTimeout(() => beep(392, 0.12, 'sine', 0.1), 180);
}
export function sfxBombCollect(): void { beep(80, 0.4, 'sawtooth', 0.15); }
