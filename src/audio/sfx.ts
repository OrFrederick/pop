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
