// Every sound is synthesised with the Web Audio API at the moment it plays.
// There are no audio files, so there is nothing to license and nothing to
// download. Sound is off until the person turns it on.
let ctx = null;
let master = null;
let enabled = false;
let drone = null;
function audio() {
    if (!enabled)
        return null;
    if (!ctx) {
        ctx = new AudioContext();
        master = ctx.createGain();
        master.gain.value = 0.55;
        master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended')
        void ctx.resume();
    return { ctx, out: master };
}
function noise(c, seconds) {
    const buf = c.createBuffer(1, Math.ceil(c.sampleRate * seconds), c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++)
        data[i] = Math.random() * 2 - 1;
    return buf;
}
function burst(c, out, { at = 0, dur, type, freq, q = 1, gain, attack = 0.005 }) {
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
    setEnabled(on) {
        enabled = on;
        if (!on) {
            drone?.stop();
            drone = null;
        }
        else {
            audio();
        }
    },
    /** A match struck, then catching. */
    strike() {
        const a = audio();
        if (!a)
            return;
        burst(a.ctx, a.out, { dur: 0.09, type: 'bandpass', freq: 2600, q: 0.9, gain: 0.5 });
        burst(a.ctx, a.out, { at: 0.06, dur: 0.35, type: 'highpass', freq: 3800, gain: 0.08, attack: 0.03 });
    },
    /** The soft rush of a flame taking. */
    ignite() {
        const a = audio();
        if (!a)
            return;
        const { f, t } = burst(a.ctx, a.out, { dur: 0.9, type: 'lowpass', freq: 280, q: 0.7, gain: 0.32, attack: 0.18 });
        f.frequency.setValueAtTime(280, t);
        f.frequency.exponentialRampToValueAtTime(1900, t + 0.35);
        f.frequency.exponentialRampToValueAtTime(600, t + 0.9);
    },
    /** A seal pressed into warm wax. */
    thud() {
        const a = audio();
        if (!a)
            return;
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
        if (!a)
            return;
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
        if (!a)
            return;
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
        if (!a)
            return;
        [0, 0.05, 0.09, 0.16, 0.22, 0.31].forEach((at, i) => burst(a.ctx, a.out, { at, dur: 0.035 + (i % 2) * 0.02, type: 'highpass', freq: 1400 + i * 300, gain: 0.35 - i * 0.03, attack: 0.001 }));
    },
    /** A small bell, for the moment the jar opens. */
    chime() {
        const a = audio();
        if (!a)
            return;
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
    /** A low room tone for the séance. */
    startDrone() {
        const a = audio();
        if (!a || drone)
            return;
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
};
