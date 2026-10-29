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

const pick = (set) => Object.values(set)[Math.floor(Math.random() * Object.keys(set).length)];

/** A whistle: two slightly detuned voices with a flutter and a breath of steam */
function toot(freq, len, peak = 0.16, bend = 1) {
  const t = ctx.currentTime;
  for (const detune of [1, 1.012]) {
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq * detune * 0.97, t);
    osc.frequency.exponentialRampToValueAtTime(freq * detune, t + 0.04);
    if (bend !== 1) osc.frequency.exponentialRampToValueAtTime(freq * detune * bend, t + len);
    const lfo = ctx.createOscillator();
    lfo.frequency.value = vary(7, 0.2);
    const depth = ctx.createGain();
    depth.gain.value = freq * 0.006;
    lfo.connect(depth).connect(osc.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.03);
    g.gain.setValueAtTime(peak, t + Math.max(0.03, len - 0.08));
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    osc.connect(g).connect(master);
    osc.start(t);
    lfo.start(t);
    osc.stop(t + len + 0.05);
    lfo.stop(t + len + 0.05);
  }
  burst({ type: "bandpass", freq: freq * 2.5, q: 1.5, attack: 0.02, decay: len, peak: 0.05 });
}

/**
 * A funny vocal "wuah", a little like a frog: a buzzy sawtooth that dips in
 * pitch, run through two vowel-like filters that slide from "oo" to "ah",
 * with a fast croaky flutter in the volume.
 */
function frogWah({ pitch, drop = 0.7, len = 0.4, croak = 26, sweep = [500, 1300], peak = 1.2 }) {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(pitch * 1.15, t);
  osc.frequency.exponentialRampToValueAtTime(pitch, t + 0.05);
  osc.frequency.exponentialRampToValueAtTime(pitch * drop, t + len);
  const mix = ctx.createGain();
  // Two vowel formants that open up like a mouth saying "wah"
  [[1, 1], [2.6, 0.5]].forEach(([mult, level]) => {
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.Q.value = 5;
    f.frequency.setValueAtTime(sweep[0] * mult, t);
    f.frequency.exponentialRampToValueAtTime(sweep[1] * mult, t + len * 0.35);
    f.frequency.exponentialRampToValueAtTime(sweep[0] * 1.2 * mult, t + len);
    const lv = ctx.createGain();
    lv.gain.value = level;
    osc.connect(f).connect(lv).connect(mix);
  });
  // The croak: the volume flutters quickly
  const flutter = ctx.createGain();
  flutter.gain.value = 0.65;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = croak;
  const lfoDepth = ctx.createGain();
  lfoDepth.gain.value = 0.35;
  lfo.connect(lfoDepth).connect(flutter.gain);
  const g = ctx.createGain();
  env(g, t, 0.025, len, peak);
  mix.connect(flutter).connect(g).connect(master);
  osc.start(t);
  lfo.start(t);
  osc.stop(t + len + 0.1);
  lfo.stop(t + len + 0.1);
}

/** Each is one sound that starts at once. Named so the sample page can play them one by one. */
export const TRAIN_SOUNDS = {
  longWhistle: () => toot(vary(880, 0.1), 0.7, 0.17, 0.96),
  shortToot: () => toot(vary(990, 0.1), 0.22),
};

export const MEEPLE_SOUNDS = {
  frogWah: () => frogWah({ pitch: vary(260, 0.2) }),
  longWah: () => frogWah({ pitch: vary(220, 0.2), len: 0.6, drop: 0.55, croak: 20, sweep: [450, 1100] }),
  quickWah: () => frogWah({ pitch: vary(330, 0.2), len: 0.4, drop: 0.75, croak: 30, sweep: [600, 1500] }),
};

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
  /** A dart on the train's body but not a target: a random toot, honk or squeak */
  whistle() {
    if (!ready()) return;
    pick(TRAIN_SOUNDS)();
  },
  /** A dart on the big yellow meeple with the face: a random silly noise */
  squeal() {
    if (!ready()) return;
    pick(MEEPLE_SOUNDS)();
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
  /**
   * The clock's tick as time is wound. On: a crisp tick that dies away.
   * Back: the same tick played backwards, swelling up out of nothing and
   * cut off dead, so it sounds sucked in rather than struck.
   */
  tick(back = false) {
    if (!ready()) return;
    if (!back) {
      burst({ freq: vary(4200, 0.06), q: 5, decay: 0.03, peak: 0.3 });
      tone({ type: "triangle", from: vary(1900, 0.05), to: 1500, decay: 0.035, peak: 0.08 });
      return;
    }
    const t = ctx.currentTime;
    const rise = vary(0.07, 0.15);
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 5;
    filter.frequency.setValueAtTime(2600, t);
    filter.frequency.exponentialRampToValueAtTime(vary(4400, 0.06), t + rise);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.32, t + rise);
    g.gain.linearRampToValueAtTime(0, t + rise + 0.004);
    src.connect(filter).connect(g).connect(master);
    src.start(t, Math.random() * 0.3);
    src.stop(t + rise + 0.02);
  },
  /**
   * Time starts to wind: a tape warping. Back, it slides down with a
   * wobble, like a reel dragged backwards; on, it slides up.
   */
  warp(back = true) {
    if (!ready()) return;
    const t = ctx.currentTime;
    const len = 0.42;
    const [from, to] = back ? [880, 160] : [180, 900];
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + len);
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 9;
    const depth = ctx.createGain();
    depth.gain.value = 26;
    lfo.connect(depth).connect(osc.frequency);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1400;
    const g = ctx.createGain();
    env(g, t, 0.04, len, 0.12);
    osc.connect(filter).connect(g).connect(master);
    osc.start(t);
    lfo.start(t);
    osc.stop(t + len + 0.08);
    lfo.stop(t + len + 0.08);
    burst({ type: "bandpass", freq: back ? 1800 : 3200, q: 0.8, attack: 0.05, decay: len, peak: 0.08 });
  },
  /** Time runs again: the alarm bell's hammer gives one light tap */
  ring() {
    if (!ready()) return;
    tone({ type: "triangle", from: vary(700), to: 420, decay: 0.03, peak: 0.12 });
    [1568, 2349, 3136].forEach((f, i) => tone({ from: f, to: f * 0.998, attack: 0.003, decay: 0.7 - i * 0.18, peak: 0.1 - i * 0.025, at: 0.01 }));
  },
  /**
   * A dart on the clock: one ding of its alarm bell. The same bell as
   * ring(), struck harder, so it is louder and rings a little longer.
   */
  bell() {
    if (!ready()) return;
    tone({ type: "triangle", from: vary(760), to: 420, decay: 0.03, peak: 0.16 });
    [1568, 2349, 3136].forEach((f, i) => tone({ from: vary(f, 0.01), to: f * 0.998, attack: 0.003, decay: 0.9 - i * 0.22, peak: 0.17 - i * 0.04, at: 0.01 }));
  },
};
