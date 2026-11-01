// Every sound is synthesised with the Web Audio API at the moment it plays.
// There are no audio files, so there is nothing to license and nothing to
// download. Sound is off until the person turns it on.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = false;
let drone: { stop: () => void } | null = null;
let night: { stop: () => void } | null = null;

function audio(): { ctx: AudioContext; out: GainNode } | null {
  if (!enabled) return null;
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return { ctx, out: master! };
}

function noise(c: AudioContext, seconds: number): AudioBuffer {
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * seconds), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function burst(
  c: AudioContext,
  out: AudioNode,
  { at = 0, dur, type, freq, q = 1, gain, attack = 0.005 }: { at?: number; dur: number; type: BiquadFilterType; freq: number; q?: number; gain: number; attack?: number },
) {
  const t = c.currentTime + at;
  const src = c.createBufferSource();
  src.buffer = noise(c, dur);
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(out);
  src.start(t);
  src.stop(t + dur + 0.05);
  return { f, t };
}

export const sound = {
  get enabled() {
    return enabled;
  },

  setEnabled(on: boolean) {
    enabled = on;
    if (!on) {
      drone?.stop();
      drone = null;
      night?.stop();
      night = null;
    } else {
      audio();
    }
  },

  /** A match struck, then catching. */
  strike() {
    const a = audio();
    if (!a) return;
    burst(a.ctx, a.out, { dur: 0.09, type: 'bandpass', freq: 2600, q: 0.9, gain: 0.5 });
    burst(a.ctx, a.out, { at: 0.06, dur: 0.35, type: 'highpass', freq: 3800, gain: 0.08, attack: 0.03 });
  },

  /** The soft rush of a flame taking. */
  ignite() {
    const a = audio();
    if (!a) return;
    const { f, t } = burst(a.ctx, a.out, { dur: 0.9, type: 'lowpass', freq: 280, q: 0.7, gain: 0.32, attack: 0.18 });
    f.frequency.setValueAtTime(280, t);
    f.frequency.exponentialRampToValueAtTime(1900, t + 0.35);
    f.frequency.exponentialRampToValueAtTime(600, t + 0.9);
  },

  /** A seal pressed into warm wax. */
  thud() {
    const a = audio();
    if (!a) return;
    const t = a.ctx.currentTime;
    const o = a.ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.28);
    const g = a.ctx.createGain();
    g.gain.setValueAtTime(0.7, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    o.connect(g).connect(a.out);
    o.start(t);
    o.stop(t + 0.45);
    burst(a.ctx, a.out, { dur: 0.12, type: 'lowpass', freq: 500, gain: 0.25 });
  },

  /** A cork pushed into the neck of a jar: a short, hollow knock. */
  cork() {
    const a = audio();
    if (!a) return;
    const t = a.ctx.currentTime;
    const o = a.ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(260, t);
    o.frequency.exponentialRampToValueAtTime(150, t + 0.09);
    const g = a.ctx.createGain();
    g.gain.setValueAtTime(0.45, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(g).connect(a.out);
    o.start(t);
    o.stop(t + 0.2);
    burst(a.ctx, a.out, { dur: 0.05, type: 'bandpass', freq: 900, q: 1.2, gain: 0.2 });
  },

  /** A cork popping out: a bright, rising blip. */
  pop() {
    const a = audio();
    if (!a) return;
    const t = a.ctx.currentTime;
    const o = a.ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(380, t);
    o.frequency.exponentialRampToValueAtTime(1100, t + 0.07);
    const g = a.ctx.createGain();
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(g).connect(a.out);
    o.start(t);
    o.stop(t + 0.15);
    burst(a.ctx, a.out, { dur: 0.04, type: 'highpass', freq: 2200, gain: 0.25, attack: 0.001 });
  },

  /** Brittle wax giving way. */
  crack() {
    const a = audio();
    if (!a) return;
    [0, 0.05, 0.09, 0.16, 0.22, 0.31].forEach((at, i) =>
      burst(a.ctx, a.out, { at, dur: 0.035 + (i % 2) * 0.02, type: 'highpass', freq: 1400 + i * 300, gain: 0.35 - i * 0.03, attack: 0.001 }),
    );
  },

  /** A small bell, for the moment the jar opens. */
  chime() {
    const a = audio();
    if (!a) return;
    const t = a.ctx.currentTime;
    [523.25, 784.0, 1046.5].forEach((freq, i) => {
      const o = a.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq;
      const g = a.ctx.createGain();
      g.gain.setValueAtTime(0, t + i * 0.08);
      g.gain.linearRampToValueAtTime(0.09 / (i + 1), t + i * 0.08 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.08 + 3.2);
      o.connect(g).connect(a.out);
      o.start(t + i * 0.08);
      o.stop(t + i * 0.08 + 3.3);
    });
  },

  /** A ghost's "booo": a wobbly tone that slides down, more silly than scary. */
  boo() {
    const a = audio();
    if (!a) return;
    const t = a.ctx.currentTime;
    const o = a.ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(420, t);
    o.frequency.exponentialRampToValueAtTime(190, t + 0.75);
    const lfo = a.ctx.createOscillator();
    lfo.frequency.value = 7;
    const depth = a.ctx.createGain();
    depth.gain.value = 18;
    lfo.connect(depth).connect(o.frequency);
    const g = a.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.32, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
    o.connect(g).connect(a.out);
    o.start(t);
    lfo.start(t);
    o.stop(t + 0.9);
    lfo.stop(t + 0.9);
  },

  /** A giggle: three quick little hops up in pitch. */
  giggle() {
    const a = audio();
    if (!a) return;
    const t = a.ctx.currentTime;
    [0, 0.11, 0.22, 0.34].forEach((at, i) => {
      const o = a.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(700 + i * 90, t + at);
      o.frequency.exponentialRampToValueAtTime(980 + i * 90, t + at + 0.06);
      const g = a.ctx.createGain();
      g.gain.setValueAtTime(0, t + at);
      g.gain.linearRampToValueAtTime(0.16, t + at + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + at + 0.09);
      o.connect(g).connect(a.out);
      o.start(t + at);
      o.stop(t + at + 0.1);
    });
  },

  /** A bat's squeak as it flaps off: two tiny chirps, high and quick. */
  squeak() {
    const a = audio();
    if (!a) return;
    const t = a.ctx.currentTime;
    [0, 0.09].forEach((at) => {
      const o = a.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(2600, t + at);
      o.frequency.exponentialRampToValueAtTime(1700, t + at + 0.05);
      const g = a.ctx.createGain();
      g.gain.setValueAtTime(0, t + at);
      g.gain.linearRampToValueAtTime(0.08, t + at + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + at + 0.06);
      o.connect(g).connect(a.out);
      o.start(t + at);
      o.stop(t + at + 0.07);
    });
  },

  /** Found you! A soft rising "ooh" when the lantern catches a hiding ghost. */
  found() {
    const a = audio();
    if (!a) return;
    const t = a.ctx.currentTime;
    const o = a.ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(330, t);
    o.frequency.exponentialRampToValueAtTime(560, t + 0.28);
    const g = a.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.14, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
    o.connect(g).connect(a.out);
    o.start(t);
    o.stop(t + 0.45);
  },

  /** Thunder far away: a low rumble, soft enough to make someone smile. */
  thunder() {
    const a = audio();
    if (!a) return;
    const { f, t } = burst(a.ctx, a.out, { dur: 2.2, type: 'lowpass', freq: 160, q: 0.6, gain: 0.55, attack: 0.05 });
    f.frequency.setValueAtTime(320, t);
    f.frequency.exponentialRampToValueAtTime(90, t + 2);
    burst(a.ctx, a.out, { at: 0.35, dur: 1.4, type: 'lowpass', freq: 120, q: 0.5, gain: 0.35, attack: 0.2 });
  },

  /** A low room tone for the séance. */
  startDrone() {
    const a = audio();
    if (!a || drone) return;
    const t = a.ctx.currentTime;
    const g = a.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.05, t + 4);
    const lfo = a.ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = a.ctx.createGain();
    lfoGain.gain.value = 0.018;
    lfo.connect(lfoGain).connect(g.gain);
    const oscs = [55, 82.41, 110.3].map((freq, i) => {
      const o = a.ctx.createOscillator();
      o.type = i === 2 ? 'triangle' : 'sine';
      o.frequency.value = freq;
      o.detune.value = (i - 1) * 4;
      const og = a.ctx.createGain();
      og.gain.value = i === 2 ? 0.25 : 0.6;
      o.connect(og).connect(g);
      o.start(t);
      return o;
    });
    const air = a.ctx.createBufferSource();
    air.buffer = noise(a.ctx, 4);
    air.loop = true;
    const lp = a.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 240;
    const ag = a.ctx.createGain();
    ag.gain.value = 0.35;
    air.connect(lp).connect(ag).connect(g);
    air.start(t);
    lfo.start(t);
    g.connect(a.out);
    drone = {
      stop: () => {
        const now = a.ctx.currentTime;
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(g.gain.value, now);
        g.gain.linearRampToValueAtTime(0, now + 1.5);
        [...oscs, air, lfo].forEach((n) => n.stop(now + 1.6));
      },
    };
  },

  stopDrone() {
    drone?.stop();
    drone = null;
  },

  /** The night outside, for the home page: a soft wind, and crickets now and then. */
  startNight() {
    const a = audio();
    if (!a || night) return;
    const t = a.ctx.currentTime;
    const g = a.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.05, t + 3);
    const lfo = a.ctx.createOscillator();
    lfo.frequency.value = 0.09;
    const lfoGain = a.ctx.createGain();
    lfoGain.gain.value = 0.025;
    lfo.connect(lfoGain).connect(g.gain);
    const wind = a.ctx.createBufferSource();
    wind.buffer = noise(a.ctx, 4);
    wind.loop = true;
    const bp = a.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 480;
    bp.Q.value = 0.7;
    wind.connect(bp).connect(g).connect(a.out);
    wind.start(t);
    lfo.start(t);
    let timer = 0;
    const chirp = () => {
      const c = audio();
      if (c) {
        const at = c.ctx.currentTime;
        const pitch = 4300 + Math.random() * 600;
        for (let i = 0; i < 3; i++) {
          const o = c.ctx.createOscillator();
          o.type = 'sine';
          o.frequency.value = pitch;
          const cg = c.ctx.createGain();
          const s0 = at + i * 0.07;
          cg.gain.setValueAtTime(0, s0);
          cg.gain.linearRampToValueAtTime(0.025, s0 + 0.008);
          cg.gain.exponentialRampToValueAtTime(0.0001, s0 + 0.035);
          o.connect(cg).connect(c.out);
          o.start(s0);
          o.stop(s0 + 0.04);
        }
      }
      timer = window.setTimeout(chirp, 900 + Math.random() * 1800);
    };
    timer = window.setTimeout(chirp, 1200);
    night = {
      stop: () => {
        clearTimeout(timer);
        const now = a.ctx.currentTime;
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(g.gain.value, now);
        g.gain.linearRampToValueAtTime(0, now + 1.2);
        wind.stop(now + 1.3);
        lfo.stop(now + 1.3);
      },
    };
  },

  stopNight() {
    night?.stop();
    night = null;
  },
};
