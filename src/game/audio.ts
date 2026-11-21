/** Original, tiny sound effects made with square waves. No audio files. */
let ac: AudioContext | null = null;
let muted = false;

export const setMuted = (m: boolean) => void (muted = m);

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

function tone(freq: number, start: number, dur: number, vol = 0.04, type: OscillatorType = 'square') {
  const a = ctx();
  if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t = a.currentTime + start;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
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
