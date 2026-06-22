'use client';

/**
 * Synthesised UI sounds via the Web Audio API — no audio assets required.
 * Gracefully no-ops if the browser blocks audio or AudioContext is unavailable.
 */
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, gain = 0.15, type: OscillatorType = 'sine') {
  const ac = getCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = ac.currentTime + start;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

/** Triumphant ascending arpeggio for payment success. */
export function playSuccess() {
  tone(523.25, 0, 0.4, 0.12); // C5
  tone(659.25, 0.09, 0.4, 0.12); // E5
  tone(783.99, 0.18, 0.5, 0.14); // G5
  tone(1046.5, 0.28, 0.7, 0.12); // C6
}

/** Soft tick used when a palm "lands" on the scanner. */
export function playScan() {
  tone(880, 0, 0.12, 0.06, 'triangle');
}

/** Subtle click for adding to cart. */
export function playTap() {
  tone(660, 0, 0.08, 0.05, 'triangle');
}
