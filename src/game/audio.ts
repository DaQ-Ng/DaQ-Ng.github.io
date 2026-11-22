/** Original, tiny sound effects and background music made with square waves. No audio files. */
let ac: AudioContext | null = null;
let muted = false;

export const setMuted = (m: boolean) => {
  muted = m;
  if (m) music.stop();
  else if (musicWanted) music.start();
};

function ctx(): AudioContext | null {
  if (muted) return null;
  try {
    ac ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ac.state === 'suspended') void ac.resume();
    return ac;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, vol = 0.04, type: OscillatorType = 'square', out?: AudioNode, at?: number) {
  const a = ctx();
  if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t = (at ?? a.currentTime) + start;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(out ?? a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export const sfx = {
  blip: () => tone(880, 0, 0.04, 0.025),
  select: () => (tone(660, 0, 0.05), tone(990, 0.05, 0.06)),
  error: () => tone(140, 0, 0.18, 0.05, 'sawtooth'),
  fragment: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.12)),
  door: () => [392, 523, 659].forEach((f, i) => tone(f, i * 0.12, 0.18, 0.035, 'triangle')),
  restored: () => [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.11, 0.16, 0.035)),
  boot: () => (tone(220, 0, 0.08), tone(330, 0.1, 0.08)),
  note: (freq: number) => tone(freq, 0, 0.14, 0.03),
};

/* ───────────── Background music ─────────────
   An original 8-bar loop (Am–F–C–G), one 8th note per step, scheduled a little
   ahead of time so it stays in rhythm even when the main thread is busy. */
const BPM = 104;
const STEP = 60 / BPM / 2;
// prettier-ignore
const LEAD = [
  69, 0, 72, 0, 76, 74, 72, 0,   72, 0, 69, 0, 65, 67, 69, 0,
  67, 0, 72, 0, 76, 0, 79, 77,   76, 0, 74, 0, 71, 0, 74, 0,
  69, 72, 76, 72, 81, 0, 79, 76, 77, 0, 76, 0, 72, 0, 69, 0,
  72, 76, 79, 76, 72, 0, 67, 0,  71, 0, 74, 0, 79, 0, 0, 0,
];
const ROOTS = [45, 41, 48, 43, 45, 41, 48, 43];
const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

let musicWanted = false;
let musicGain: GainNode | null = null;
let timer = 0;
let step = 0;
let nextAt = 0;
let ducked = false;

const LEVEL = 0.7;
const DUCKED = 0.25;

function schedule() {
  const a = ctx();
  if (!a || !musicGain) return;
  while (nextAt < a.currentTime + 0.15) {
    const n = LEAD[step];
    if (n) tone(hz(n), 0, STEP * 0.9, 0.018, 'square', musicGain, nextAt);
    const root = ROOTS[Math.floor(step / 8)];
    tone(hz(step % 2 ? root + 12 : root), 0, STEP * 0.8, 0.05, 'triangle', musicGain, nextAt);
    nextAt += STEP;
    step = (step + 1) % LEAD.length;
  }
}

export const music = {
  /** Start (or resume) the loop. Must first be called from a user gesture. */
  start() {
    musicWanted = true;
    const a = ctx();
    if (!a || timer) return;
    musicGain = a.createGain();
    musicGain.gain.value = ducked ? DUCKED : LEVEL;
    musicGain.connect(a.destination);
    nextAt = a.currentTime + 0.05;
    schedule();
    timer = window.setInterval(schedule, 50);
  },
  /** Stop the loop. `keepWanted` lets it come back on unmute / tab return. */
  stop(keepWanted = true) {
    if (!keepWanted) musicWanted = false;
    clearInterval(timer);
    timer = 0;
    if (musicGain && ac) {
      const g = musicGain;
      g.gain.setTargetAtTime(0, ac.currentTime, 0.05);
      window.setTimeout(() => g.disconnect(), 400);
    }
    musicGain = null;
  },
  /** Quieter while a window (puzzle, index…) is open. */
  duck(on: boolean) {
    ducked = on;
    if (musicGain && ac) musicGain.gain.setTargetAtTime(on ? DUCKED : LEVEL, ac.currentTime, 0.15);
  },
};

// Don't keep playing in a background tab.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) music.stop();
    else if (musicWanted && !muted) music.start();
  });
}
