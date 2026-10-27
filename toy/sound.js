/**
 * Soft toy sounds made on the fly: a foam pop, wood thunks, a paper tear,
 * a suction thwop and a button click. No music, no files.
 */
let ctx = null;
let master = null;
let noise = null;

/** The first press on the page is what lets audio start */
export function wakeAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.42;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    master.connect(comp).connect(ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === "suspended") ctx.resume();
}

function ready() {
  return ctx && ctx.state === "running";
}

function env(gain, t, attack, decay, peak) {
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(peak, t + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

function burst({ type = "bandpass", freq, q = 1, attack = 0.002, decay, peak, at = 0 }) {
  const t = ctx.currentTime + at;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.playbackRate.value = 0.8 + Math.random() * 0.4;
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;
  filter.Q.value = q;
  const g = ctx.createGain();
  env(g, t, attack, decay, peak);
  src.connect(filter).connect(g).connect(master);
  src.start(t, Math.random() * 0.3);
  src.stop(t + attack + decay + 0.05);
}

function tone({ type = "sine", from, to, attack = 0.002, decay, peak, at = 0 }) {
  const t = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(to, t + attack + decay);
  const g = ctx.createGain();
  env(g, t, attack, decay, peak);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + attack + decay + 0.05);
}

const vary = (x, amount = 0.12) => x * (1 + (Math.random() - 0.5) * amount * 2);

export const sound = {
  pop() {
    if (!ready()) return;
    burst({ freq: vary(1400), q: 0.9, decay: 0.05, peak: 0.55 });
    tone({ from: vary(260), to: 90, decay: 0.07, peak: 0.5 });
    burst({ type: "lowpass", freq: 500, decay: 0.09, peak: 0.25, at: 0.005 });
  },
  /**
   * A shot that came out weak: half a pop, then a wobbly slide-whistle
   * sinking away with a sputter of air. Silly on purpose, a blown shot.
   */
  fizzle() {
    if (!ready()) return;
    const t = ctx.currentTime + 0.03;
    const len = vary(0.38, 0.12);
    burst({ freq: vary(1100), q: 0.9, decay: 0.04, peak: 0.28 });
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(vary(620, 0.1), t);
    osc.frequency.exponentialRampToValueAtTime(vary(110, 0.15), t + len);
    // A wobble that gets wider as it droops
    const lfo = ctx.createOscillator();
    lfo.frequency.value = vary(17, 0.15);
    const depth = ctx.createGain();
    depth.gain.setValueAtTime(8, t);
    depth.gain.linearRampToValueAtTime(40, t + len);
    lfo.connect(depth).connect(osc.frequency);
    const g = ctx.createGain();
    env(g, t, 0.02, len, 0.3);
    osc.connect(g).connect(master);
    osc.start(t);
    lfo.start(t);
    osc.stop(t + len + 0.08);
    lfo.stop(t + len + 0.08);
    burst({ type: "bandpass", freq: vary(3200), q: 1.2, attack: 0.01, decay: len * 0.8, peak: 0.1, at: 0.03 });
  },
  thunk(strength = 0.6, small = false) {
    if (!ready()) return;
    const s = Math.max(0.08, Math.min(1, strength));
    const pitch = small ? vary(620, 0.2) : vary(330, 0.25);
    tone({ type: "triangle", from: pitch, to: pitch * 0.75, decay: 0.06 + s * 0.05, peak: 0.12 + s * 0.38 });
    burst({ freq: vary(small ? 2600 : 1600), q: 2.5, decay: 0.025, peak: 0.1 + s * 0.25 });
  },
  /**
   * Through the paper: psssh. A soft "p" of a punch, then one smooth hiss
   * that starts bright and sibilant and slides darker as it fades, over
   * about a third of a second.
   */
  tear() {
    if (!ready()) return;
    burst({ type: "lowpass", freq: 420, decay: 0.04, peak: 0.2 });
    const t = ctx.currentTime + 0.006;
    // Each tear is a different sheet: the whole hiss shifts up or down
    // together, and the length and the slide's depth move with it
    const pitch = 0.7 + Math.random() * 0.75;
    const length = 0.2 * (1.25 - (pitch - 0.7) * 0.5) * vary(1, 0.1);
    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    src.playbackRate.value = 0.85 + (pitch - 0.7) * 0.4;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 0.7 + Math.random() * 0.6;
    filter.frequency.setValueAtTime(Math.min(9500, 6800 * pitch), t);
    filter.frequency.exponentialRampToValueAtTime(2600 * pitch * vary(1, 0.2), t + length);
    // Air on top, so the start has a crisp "s" in it
    const air = ctx.createBiquadFilter();
    air.type = "highshelf";
    air.frequency.value = 5000;
    air.gain.value = 6;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.42, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.22, t + length * 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t + length);
    src.connect(filter).connect(air).connect(g).connect(master);
    src.start(t, Math.random() * 0.3);
    src.stop(t + length + 0.05);
  },
  stick() {
    if (!ready()) return;
    tone({ from: vary(720), to: 260, decay: 0.06, peak: 0.22 });
    burst({ type: "lowpass", freq: 700, decay: 0.04, peak: 0.15 });
  },
  press() {
    if (!ready()) return;
    tone({ type: "square", from: 900, to: 600, decay: 0.02, peak: 0.08 });
    tone({ type: "triangle", from: vary(380), to: 300, decay: 0.05, peak: 0.25, at: 0.01 });
  },
  /** A dart thwops onto a train target: suction, then a bright wooden ring */
  ding() {
    if (!ready()) return;
    tone({ from: vary(720), to: 260, decay: 0.06, peak: 0.22 });
    tone({ type: "triangle", from: 1320, to: 1300, attack: 0.004, decay: 0.35, peak: 0.16, at: 0.03 });
    tone({ type: "sine", from: 1980, to: 1960, attack: 0.004, decay: 0.25, peak: 0.07, at: 0.03 });
  },
  /** Nothing but net: a swish, then a bright little three-note cheer */
  swish() {
    if (!ready()) return;
    burst({ type: "bandpass", freq: 2600, q: 0.8, attack: 0.03, decay: 0.22, peak: 0.25 });
    [523, 659, 784].forEach((f, i) => tone({ type: "triangle", from: f, to: f, attack: 0.005, decay: 0.22, peak: 0.16, at: 0.14 + i * 0.09 }));
  },
  bounce() {
    if (!ready()) return;
    tone({ type: "triangle", from: vary(500), to: 380, decay: 0.04, peak: 0.15 });
  },
};
