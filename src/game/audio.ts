/** Original, tiny sound effects and background music made with square waves. No audio files. */
let ac: AudioContext | null = null;
let muted = false;

export const setMuted = (m: boolean) => {
  muted = m;
  if (m) {
    music.stop();
    silent?.pause();
  } else {
    playSilent();
    if (musicWanted) music.start();
  }
};

function ctx(): AudioContext | null {
  if (muted) return null;
  try {
    ac ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ac.state !== 'running') void ac.resume().catch(() => {});
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
   Original loops, one 8th note per step, scheduled a little ahead of time so
   they stay in rhythm even when the main thread is busy. MIDI note numbers
   (60 = middle C), 0 = rest. */
type Part = { lead: number[]; bass: number[] };
type Track = { bpm: number; vol: number; intro?: Part; loop: Part };

/** Bass line from one root per bar: root, octave, root, octave… */
const walk = (roots: number[]) => roots.flatMap((r) => [r, r + 12, r, r + 12, r, r + 12, r, r + 12]);

const TRACKS = {
  // Exploring: Am–F–C–G.
  main: {
    bpm: 104,
    vol: 0.018,
    loop: {
      // prettier-ignore
      lead: [
        69, 0, 72, 0, 76, 74, 72, 0,   72, 0, 69, 0, 65, 67, 69, 0,
        67, 0, 72, 0, 76, 0, 79, 77,   76, 0, 74, 0, 71, 0, 74, 0,
        69, 72, 76, 72, 81, 0, 79, 76, 77, 0, 76, 0, 72, 0, 69, 0,
        72, 76, 79, 76, 72, 0, 67, 0,  71, 0, 74, 0, 79, 0, 0, 0,
      ],
      bass: walk([45, 41, 48, 43, 45, 41, 48, 43]),
    },
  },
  // Save restored: a fanfare once, then a bright C–Am–F–G loop.
  victory: {
    bpm: 120,
    vol: 0.02,
    intro: {
      // prettier-ignore
      lead: [
        67, 67, 67, 72, 0, 0, 72, 74,  76, 0, 74, 76, 79, 0, 0, 0,
      ],
      // prettier-ignore
      bass: [
        48, 0, 48, 0, 48, 0, 0, 0,     43, 55, 43, 55, 48, 60, 48, 0,
      ],
    },
    loop: {
      // prettier-ignore
      lead: [
        72, 0, 76, 79, 84, 0, 79, 76,  76, 0, 72, 76, 81, 0, 79, 0,
        77, 0, 81, 84, 81, 0, 77, 0,   79, 0, 74, 77, 79, 0, 83, 0,
        84, 0, 83, 84, 79, 0, 76, 79,  81, 0, 79, 81, 76, 0, 72, 0,
        77, 81, 84, 81, 77, 0, 74, 0,  79, 0, 83, 0, 86, 0, 84, 0,
      ],
      bass: walk([48, 45, 41, 43, 48, 45, 41, 43]),
    },
  },
} satisfies Record<string, Track>;
export type TrackName = keyof typeof TRACKS;

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

let musicWanted = false;
let musicGain: GainNode | null = null;
let timer = 0;
let track: Track = TRACKS.main;
let trackName: TrackName = 'main';
let part: Part = track.loop;
let step = 0;
let nextAt = 0;
let ducked = false;

const LEVEL = 0.7;
const DUCKED = 0.25;

function schedule() {
  const a = ctx();
  if (!a || !musicGain) return;
  const len = 60 / track.bpm / 2;
  // After a long stall (e.g. a frozen tab), skip ahead instead of bursting notes.
  if (nextAt < a.currentTime - 0.2) nextAt = a.currentTime + 0.05;
  while (nextAt < a.currentTime + 0.15) {
    const n = part.lead[step];
    if (n) tone(hz(n), 0, len * 0.9, track.vol, 'square', musicGain, nextAt);
    const b = part.bass[step];
    if (b) tone(hz(b), 0, len * 0.8, 0.05, 'triangle', musicGain, nextAt);
    nextAt += len;
    step++;
    if (step >= part.lead.length) {
      step = 0;
      part = track.loop;
    }
  }
}

export const music = {
  /**
   * Start (or resume) music. With a track name it switches to that track from
   * the top (playing its intro if `intro` is true); without one it carries on.
   */
  start(name?: TrackName, intro = false) {
    musicWanted = true;
    const switching = !!name && (name !== trackName || intro);
    if (switching) {
      trackName = name;
      track = TRACKS[name];
      part = intro && track.intro ? track.intro : track.loop;
      step = 0;
    }
    const a = ctx();
    if (!a) return;
    if (timer) {
      if (switching) nextAt = a.currentTime + 0.05;
      return;
    }
    musicGain = a.createGain();
    musicGain.gain.value = ducked ? DUCKED : LEVEL;
    musicGain.connect(a.destination);
    nextAt = a.currentTime + 0.05;
    schedule();
    timer = window.setInterval(schedule, 50);
  },
  /** Stop the music. `keepWanted` lets it come back on unmute / tab return. */
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
    if (on === ducked) return;
    ducked = on;
    if (musicGain && ac) musicGain.gain.setTargetAtTime(on ? DUCKED : LEVEL, ac.currentTime, 0.15);
  },
};

/* ───────────── Phones ─────────────
   iOS only lets a page start audio inside a tap, and by default treats Web
   Audio like a ringtone, so the silent switch mutes it. On the first taps we
   resume the context, play a blank buffer, and ask for "playback" audio (with
   a silent looping <audio> as a fallback for older iOS) so sound comes through
   the way it does for video. */
let silent: HTMLAudioElement | null = null;
const isIOS = () => /iP(hone|ad|od)/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

function silentWav(): string {
  const n = 800; // 0.1 s of 8 kHz, 8-bit mono silence
  const b = new Uint8Array(44 + n);
  const v = new DataView(b.buffer);
  const str = (o: number, t: string) => [...t].forEach((c, i) => (b[o + i] = c.charCodeAt(0)));
  str(0, 'RIFF');
  v.setUint32(4, 36 + n, true);
  str(8, 'WAVEfmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true);
  v.setUint32(28, 8000, true);
  v.setUint16(32, 1, true);
  v.setUint16(34, 8, true);
  str(36, 'data');
  v.setUint32(40, n, true);
  b.fill(128, 44);
  return URL.createObjectURL(new Blob([b], { type: 'audio/wav' }));
}

const playSilent = () => {
  if (silent && !muted && !document.hidden) void silent.play().catch(() => {});
};

const GESTURES = ['pointerup', 'touchend', 'click', 'keydown'] as const;
function unlock() {
  if (muted) return;
  const nav = navigator as Navigator & { audioSession?: { type: string } };
  if (nav.audioSession) {
    try {
      nav.audioSession.type = 'playback';
    } catch {
      /* not supported */
    }
  } else if (isIOS() && !silent) {
    try {
      silent = new Audio(silentWav());
      silent.loop = true;
      silent.setAttribute('playsinline', '');
      playSilent();
    } catch {
      /* ignore */
    }
  }
  const a = ctx();
  if (!a) return;
  try {
    const src = a.createBufferSource();
    src.buffer = a.createBuffer(1, 1, 22050);
    src.connect(a.destination);
    src.start(0);
  } catch {
    /* ignore */
  }
  if (a.state === 'running') GESTURES.forEach((e) => window.removeEventListener(e, unlock, true));
}

if (typeof window !== 'undefined') {
  GESTURES.forEach((e) => window.addEventListener(e, unlock, true));
  // Don't keep playing in a background tab.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      music.stop();
      silent?.pause();
    } else if (!muted) {
      playSilent();
      if (musicWanted) music.start();
    }
  });
}
