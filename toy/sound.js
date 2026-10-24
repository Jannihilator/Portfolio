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
  thunk(strength = 0.6, small = false) {
    if (!ready()) return;
    const s = Math.max(0.08, Math.min(1, strength));
    const pitch = small ? vary(620, 0.2) : vary(330, 0.25);
    tone({ type: "triangle", from: pitch, to: pitch * 0.75, decay: 0.06 + s * 0.05, peak: 0.12 + s * 0.38 });
    burst({ freq: vary(small ? 2600 : 1600), q: 2.5, decay: 0.025, peak: 0.1 + s * 0.25 });
  },
  /**
   * Through the paper: a soft punch, then the rip itself, many tiny
   * crackles of bright noise, uneven in timing and loudness, that swell
   * and fade over about a fifth of a second.
   */
  tear() {
    if (!ready()) return;
    burst({ type: "lowpass", freq: 380, decay: 0.05, peak: 0.22 });
    const length = vary(0.2, 0.25);
    let t = 0.008;
    while (t < length) {
      const k = t / length;
      const swell = Math.sin(Math.PI * Math.min(1, k * 1.3));
      burst({
        type: "bandpass",
        freq: 1800 + Math.random() * 3800,
        q: 0.8 + Math.random() * 0.9,
        attack: 0.001,
        decay: 0.004 + Math.random() * 0.012,
        peak: (0.05 + Math.random() * 0.2) * (0.35 + swell),
        at: t,
      });
      t += 0.005 + Math.random() * 0.014;
    }
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
