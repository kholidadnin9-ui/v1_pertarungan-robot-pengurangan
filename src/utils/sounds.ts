// Simple Web Audio synthesized sound effects — no external files needed.
let ctx: AudioContext | null = null;
let muted = false;

try {
  muted = localStorage.getItem('rmb-muted') === '1';
} catch { /* ignore */ }

export function isMuted() { return muted; }
export function setMuted(m: boolean) {
  muted = m;
  try { localStorage.setItem('rmb-muted', m ? '1' : '0'); } catch { /* ignore */ }
}

function audio(): AudioContext | null {
  if (muted) return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, dur: number, type: OscillatorType = 'square', vol = 0.12, slideTo?: number, delay = 0) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noise(dur: number, vol = 0.2, delay = 0, lowpass = 1200) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const len = Math.max(1, Math.floor(ac.sampleRate * dur));
  const buffer = ac.createBuffer(1, len, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = lowpass;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start(t0);
}

export const sfx = {
  click() { tone(600, 0.08, 'square', 0.08, 900); },
  hover() { tone(500, 0.05, 'sine', 0.05, 700); },
  countBeep(final = false) {
    if (final) { tone(880, 0.35, 'square', 0.14, 1320); }
    else tone(440, 0.15, 'square', 0.1);
  },
  laser() {
    tone(1400, 0.35, 'sawtooth', 0.12, 180);
    tone(2200, 0.2, 'square', 0.06, 400);
    noise(0.15, 0.06, 0, 4000);
  },
  explosion() {
    noise(0.7, 0.32, 0, 900);
    tone(120, 0.6, 'sine', 0.25, 35);
    tone(90, 0.5, 'triangle', 0.18, 30, 0.05);
  },
  bigExplosion() {
    noise(1.2, 0.4, 0, 700);
    tone(100, 1.0, 'sine', 0.3, 28);
    tone(70, 0.9, 'triangle', 0.22, 25, 0.1);
    noise(0.5, 0.2, 0.25, 2000);
  },
  shock() {
    for (let i = 0; i < 6; i++) {
      tone(1800 + Math.random() * 2200, 0.06, 'sawtooth', 0.08, 300 + Math.random() * 500, i * 0.07);
    }
    noise(0.4, 0.1, 0, 5000);
  },
  correct() {
    tone(523, 0.12, 'square', 0.1);
    tone(659, 0.12, 'square', 0.1, undefined, 0.1);
    tone(784, 0.2, 'square', 0.12, undefined, 0.2);
  },
  wrong() {
    tone(300, 0.2, 'sawtooth', 0.12, 150);
    tone(200, 0.25, 'sawtooth', 0.1, 100, 0.15);
  },
  timeout() {
    tone(400, 0.15, 'square', 0.1, 300);
    tone(300, 0.2, 'square', 0.1, 200, 0.15);
  },
  win() {
    const notes = [523, 659, 784, 1047, 784, 1047];
    notes.forEach((n, i) => tone(n, 0.22, 'square', 0.11, undefined, i * 0.14));
  },
  lose() {
    const notes = [400, 350, 300, 220];
    notes.forEach((n, i) => tone(n, 0.28, 'triangle', 0.14, n * 0.9, i * 0.2));
  },
  roundStart() {
    tone(660, 0.1, 'square', 0.1);
    tone(880, 0.15, 'square', 0.11, undefined, 0.09);
  },
};
