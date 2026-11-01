import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import type { Costume } from '../core/buddy.ts';
import { Candle } from '../ui/art/Candle.tsx';
import { Ghost } from '../ui/art/Ghost.tsx';
import { Jar } from '../ui/art/Jar.tsx';
import { Bat, Moon, Pumpkin } from '../ui/art/Spooky.tsx';
import { sound } from '../ui/sound.ts';
import { href, prefersReducedMotion, useAtmosphere } from '../ui/shell.tsx';
import { Typed } from '../ui/components/Typed.tsx';
import { HowItWorks } from './HowItWorks.tsx';

const d = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties;

interface Hider {
  costume: Costume;
  /** Where it hides, in percent of the hero; `xp`/`yp` on a phone, where it peeks in from the side. */
  x: number;
  y: number;
  xp?: number;
  yp?: number;
  size: number;
  tilt: number;
}

// Friends hiding in the dark. The lantern (the pointer) finds them; once found, they stay.
const HIDERS: Hider[] = [
  { costume: 'witch', x: 10, y: 30, size: 86, tilt: -8, xp: 4, yp: 60 },
  { costume: 'skeleton', x: 7, y: 72, size: 98, tilt: 6, xp: 6, yp: 90 },
  { costume: 'mummy', x: 27, y: 84, size: 78, tilt: -4 },
  { costume: 'vampire', x: 73, y: 84, size: 80, tilt: 5 },
  { costume: 'pumpkin', x: 92, y: 72, size: 98, tilt: -6, xp: 96, yp: 64 },
  { costume: 'bat', x: 89, y: 40, size: 76, tilt: 8, xp: 94, yp: 90 },
];

// Fireflies drifting over the hills: left, top (percent), and a delay so they never move together.
const FIREFLIES = [
  [6, 58, 0],
  [14, 80, -3.1],
  [22, 64, -6.4],
  [31, 76, -1.7],
  [39, 90, -8.2],
  [61, 88, -4.6],
  [68, 70, -2.3],
  [77, 62, -7.1],
  [85, 82, -5.2],
  [94, 66, -0.9],
  [48, 70, -9.4],
  [56, 60, -3.8],
] as const;

type Gag = 'boo' | 'laugh' | 'found' | null;
const GAG_LINE: Record<Exclude<Gag, null>, string> = { boo: 'BOO!', laugh: 'Hee hee. Hi!', found: 'You found us all!' };

const INTRO_KEY = 'phylactery:intro';

/**
 * Once a visit, the home page opens in the dark: a candle catches, someone
 * whispers, and the light spreads into the night. A click or a key skips it.
 */
function useIntro() {
  const [on, setOn] = useState(() => {
    if (prefersReducedMotion()) return false;
    try {
      return sessionStorage.getItem(INTRO_KEY) !== '1';
    } catch {
      return false;
    }
  });
  const done = useCallback(() => {
    setOn(false);
    try {
      sessionStorage.setItem(INTRO_KEY, '1');
    } catch {
      // A private window: it may play again, which is fine.
    }
  }, []);
  useEffect(() => {
    if (!on) return;
    const strike = window.setTimeout(() => sound.strike(), 300);
    const end = window.setTimeout(done, 3150);
    window.addEventListener('keydown', done);
    return () => {
      clearTimeout(strike);
      clearTimeout(end);
      window.removeEventListener('keydown', done);
    };
  }, [on, done]);
  return { on, done };
}

/**
 * The hero is a Halloween night you can play in. The pointer is a lantern:
 * its warm light finds friends hiding in the dark, and the hills shift a
 * little as it moves. The ghost in the jar wakes and watches it, and dozes
 * off when left alone; poke the jar and it jumps up with a "BOO!". Click the
 * sky and a bat flaps off.
 */
function useNightHero(ready: boolean) {
  const hero = useRef<HTMLElement>(null);
  const jar = useRef<HTMLButtonElement>(null);
  const hiders = useRef<(HTMLSpanElement | null)[]>([]);
  const [look, setLook] = useState<{ x: number; y: number } | null>(null);
  const [found, setFound] = useState<boolean[]>(() => HIDERS.map(() => false));
  const [lit, setLit] = useState<number>(-1);
  const [gag, setGag] = useState<Gag>(null);
  const [bats, setBats] = useState<{ id: number; x: number; y: number }[]>([]);
  const timers = useRef<number[]>([]);
  const later = useCallback((fn: () => void, ms: number) => void timers.current.push(window.setTimeout(fn, ms)), []);
  const gagTimers = useRef<number[]>([]);
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      gagTimers.current.forEach(clearTimeout);
    },
    [],
  );

  const setVar = useCallback((name: string, value: string) => hero.current?.style.setProperty(name, value), []);
  const dark = useCallback(() => {
    setVar('--lx', '-999px');
    setVar('--ly', '-999px');
    setLit(-1);
  }, [setVar]);

  /** Shine the lantern at a point on the screen; returns which hider it is on, if any. */
  const shine = useCallback((cx: number, cy: number, count: boolean) => {
    const r = hero.current?.getBoundingClientRect();
    if (!r) return;
    setVar('--lx', `${cx - r.left}px`);
    setVar('--ly', `${cy - r.top}px`);
    let on = -1;
    hiders.current.forEach((el, i) => {
      if (!el || el.offsetParent === null) return;
      const b = el.getBoundingClientRect();
      if (Math.hypot(cx - (b.left + b.width / 2), cy - (b.top + b.height / 2)) < Math.max(70, b.width * 0.7)) on = i;
    });
    setLit(on);
    if (count && on >= 0) {
      setFound((was) => {
        if (was[on]) return was;
        sound.found();
        const next = was.map((v, j) => v || j === on);
        if (next.every(Boolean)) {
          sound.giggle();
          setGag('found');
          gagTimers.current.forEach(clearTimeout);
          gagTimers.current = [window.setTimeout(() => setGag(null), 2600)];
        }
        return next;
      });
    }
  }, [setVar]);

  useEffect(() => {
    let frame = 0;
    let idle = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = hero.current?.getBoundingClientRect();
        const j = jar.current?.getBoundingClientRect();
        if (!r || !j) return;
        const inside = e.clientY < r.bottom && e.clientY > r.top;
        const clamp = (v: number) => Math.max(-1, Math.min(1, v));
        // The hills shift a little against the pointer: depth.
        setVar('--px', clamp((e.clientX - r.left) / r.width - 0.5).toFixed(3));
        setVar('--py', clamp((e.clientY - r.top) / r.height - 0.5).toFixed(3));
        if (inside) shine(e.clientX, e.clientY, true);
        else dark();
        const next = inside ? { x: Math.round(clamp((e.clientX - (j.left + j.width / 2)) / 320) * 10) / 10, y: Math.round(clamp((e.clientY - (j.top + j.height / 2)) / 240) * 10) / 10 } : null;
        setLook((was) => (was?.x === next?.x && was?.y === next?.y ? was : next));
        clearTimeout(idle);
        idle = window.setTimeout(() => setLook(null), 2600);
      });
    };
    window.addEventListener('pointermove', onMove);
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(frame);
      clearTimeout(idle);
    };
  }, [shine, dark, setVar]);

  // Once the night is showing, the lantern sweeps across it once, so you see what it does.
  useEffect(() => {
    if (!ready || prefersReducedMotion()) return;
    let frame = 0;
    const start = performance.now() + 400;
    const step = (now: number) => {
      const r = hero.current?.getBoundingClientRect();
      const t = (now - start) / 2400;
      if (!r || t > 1) {
        dark();
        return;
      }
      if (t >= 0) shine(r.left + r.width * (0.04 + 0.92 * t), r.top + r.height * (0.8 - 0.42 * Math.sin(Math.PI * t)), false);
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [ready, shine, dark]);

  const boo = useCallback(() => {
    gagTimers.current.forEach(clearTimeout);
    setGag('boo');
    sound.boo();
    gagTimers.current = [
      window.setTimeout(() => {
        setGag('laugh');
        sound.giggle();
      }, 950),
      window.setTimeout(() => setGag(null), 2300),
    ];
  }, []);

  /** A tap on a phone lights the lantern there for a moment; a click on the sky lets a bat go. */
  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if ((e.target as Element).closest('a, button')) return;
    const r = hero.current?.getBoundingClientRect();
    if (!r) return;
    if (e.pointerType === 'touch') {
      shine(e.clientX, e.clientY, true);
      later(dark, 1600);
    }
    if (prefersReducedMotion()) return;
    const id = performance.now();
    setBats((b) => [...b.slice(-5), { id, x: e.clientX - r.left, y: e.clientY - r.top }]);
    sound.squeak();
    later(() => setBats((b) => b.filter((x) => x.id !== id)), 1500);
  };

  return { hero, jar, hiders, look, found, lit, gag, bats, boo, onPointerDown };
}

function hiderStyle(h: Hider): CSSProperties {
  return {
    '--x': `${h.x}%`,
    '--y': `${h.y}%`,
    '--xp': `${h.xp ?? h.x}%`,
    '--yp': `${h.yp ?? h.y}%`,
    '--tilt': `${h.tilt}deg`,
  } as CSSProperties;
}

export function Home() {
  useAtmosphere('night');
  // With sound on, the night outside: a soft wind and crickets.
  useEffect(() => {
    sound.startNight();
    return () => sound.stopNight();
  }, []);
  const intro = useIntro();
  const { hero, jar: jarButton, hiders, look, found, lit, gag, bats, boo, onPointerDown } = useNightHero(!intro.on);

  return (
    <div className="page home">
      {intro.on &&
        createPortal(
          <div className="intro" onClick={intro.done} aria-hidden="true">
            <div className="intro-candle">
              <Candle lit justLit size={84} />
            </div>
            <p className="intro-line">
              <Typed text="Shh… it’s sleeping." delay={650} speed={45} />
            </p>
            <span className="intro-skip">Skip</span>
          </div>,
          document.body,
        )}

      <section className={`hero${intro.on ? ' waiting' : ''}`} ref={hero} aria-labelledby="hero-title" onPointerDown={onPointerDown}>
        {/* The night, in layers that shift a little with the pointer. */}
        <div className="hero-night" aria-hidden="true">
          <div className="layer" style={{ '--depth': 6 } as CSSProperties}>
            <Moon size={128} cloud className="hero-moon" />
          </div>
          <div className="layer" style={{ '--depth': 10 } as CSSProperties}>
            <Bat size={70} color="#1d0c40" flap={false} className="hero-bat b1" />
            <Bat size={46} color="#24104f" flap={false} className="hero-bat b2" />
            <Bat size={38} color="#24104f" flap={false} className="hero-bat b3" />
          </div>
          <svg className="hero-hill far layer" style={{ '--depth': 14 } as CSSProperties} viewBox="0 0 1000 160" preserveAspectRatio="xMidYMax slice">
            <path d="M0 96 C140 64 260 70 380 88 C470 102 540 74 620 68 C760 58 860 94 1000 76 L1000 160 L0 160 Z" fill="#3a1f78" />
            {/* A small old house on the far hill, its windows lit. */}
            <g transform="translate(0 40)">
              <path d="M792 52 L792 26 L784 26 L804 8 L824 26 L816 26 L816 48 Z M806 30 L806 4 L802 4 L810 -12 L818 4 L815 4 L815 40 Z" fill="#3a1f78" />
              <g fill="#ffc65a" className="house-lights">
                <rect x="796" y="32" width="5" height="7" rx="1" />
                <rect x="806" y="32" width="5" height="7" rx="1" />
                <rect x="808" y="8" width="3.5" height="5" rx="0.8" />
              </g>
            </g>
          </svg>
          <div className="hero-fog f1 layer" style={{ '--depth': 18 } as CSSProperties} />
          {/* Friends hiding in the dark: found ones stay, faintly; the lantern shows them all. */}
          <div className="hiders found-layer layer" style={{ '--depth': 18 } as CSSProperties}>
            {HIDERS.map((h, i) => (
              <span key={h.costume} className={`hider${found[i] ? ' found' : ''}${h.xp === undefined ? ' desk-only' : ''}`} style={hiderStyle(h)}>
                <Ghost costume={h.costume} mood={gag === 'found' ? 'laugh' : 'happy'} size={h.size} float phase={i * 0.7} />
              </span>
            ))}
          </div>
          <div className="hiders lantern-layer layer" style={{ '--depth': 18 } as CSSProperties}>
            {HIDERS.map((h, i) => (
              <span
                key={h.costume}
                ref={(el) => {
                  hiders.current[i] = el;
                }}
                className={`hider${h.xp === undefined ? ' desk-only' : ''}`}
                style={hiderStyle(h)}
              >
                <Ghost costume={h.costume} mood={lit === i ? 'wow' : 'happy'} size={h.size} float phase={i * 0.7} />
              </span>
            ))}
          </div>
          <div className="fireflies">
            {FIREFLIES.map(([x, y, delay], i) => (
              <i key={i} style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${delay}s, ${delay / 2}s` }} />
            ))}
          </div>
          <svg className="hero-hill near layer" style={{ '--depth': 26 } as CSSProperties} viewBox="0 0 1000 120" preserveAspectRatio="xMidYMax slice">
            <path d="M0 70 C160 44 300 56 430 66 C560 76 680 50 820 54 C900 56 960 66 1000 62 L1000 120 L0 120 Z" fill="#150c28" />
          </svg>
          <div className="hero-fog f2" />
          <div className="lantern-light" />
          <div className="grain" />
        </div>

        <div className="hero-copy">
          <h1 id="hero-title" className="hero-title pop" style={d(200)}>
            Phylactery
          </h1>
          <p className="hero-sub rise" style={d(380)}>
            Passwords and last words, in a jar only your friends can open together.
          </p>
          <div className="row centered rise" style={d(520)}>
            <a className="btn on-purple big" href={href('seal')}>
              Seal a jar
            </a>
            <a className="btn ghosty big" href={`${href('seance')}?demo`}>
              Try a séance
            </a>
          </div>
        </div>

        <div className="hero-altar">
          <Pumpkin size={78} lit className="hero-pumpkin left pop" style={d(800)} />
          <button type="button" className="hero-jar pop" style={d(650)} ref={jarButton} onClick={boo} aria-label="Wake the little ghost">
            <Jar
              initials="ME"
              size={280}
              warmth={look || gag ? 0.75 : 0.5}
              mood={gag === 'found' ? 'laugh' : (gag ?? (look ? 'open' : 'sleep'))}
              look={gag ? undefined : (look ?? undefined)}
              rattle={gag === 'boo'}
              label="A jar with a little ghost inside"
            />
            {gag && (
              <span className={`boo-bubble ${gag === 'found' ? 'laugh' : gag}`} key={gag} aria-live="polite">
                {gag === 'boo' ? GAG_LINE.boo : <Typed key={gag} text={GAG_LINE[gag]} />}
              </span>
            )}
          </button>
          <Pumpkin size={56} lit className="hero-pumpkin right pop" style={d(900)} />
        </div>

        {bats.map((b) => (
          <span key={b.id} className="click-bat" style={{ left: b.x, top: b.y, '--dx': Math.round(b.id) % 2 ? 1 : -1 } as CSSProperties} aria-hidden="true">
            <Bat size={46} color="#0b0714" />
          </span>
        ))}
      </section>

      <HowItWorks />

      <section className="facts wrap" aria-labelledby="facts-title">
        <h2 id="facts-title" className="center">
          Kind, and hard to break
        </h2>
        <div className="fact-grid">
          <div className="fact f-purple">
            <span className="fact-big">2 of 3</span>
            <p>friends open it, together. One alone sees nothing.</p>
            <span className="fact-art" aria-hidden="true">
              <Ghost costume="witch" mood="happy" size={74} />
              <Ghost costume="pumpkin" mood="happy" size={74} />
              <Ghost costume="vampire" mood="sleep" size={74} />
            </span>
          </div>
          <div className="fact f-pink">
            <span className="fact-big">0</span>
            <p>servers that can read it. It’s locked in your browser.</p>
            <span className="fact-art" aria-hidden="true">
              <Jar initials="ME" size={120} mood="sleep" label="" />
            </span>
          </div>
          <div className="fact f-amber">
            <span className="fact-big">1 file</span>
            <p>that opens offline, years from now.</p>
            <span className="fact-art" aria-hidden="true">
              <Ghost mood="happy" size={92} emblem="key" />
            </span>
          </div>
        </div>
      </section>

      <section className="closing wrap" data-theme="night">
        <div className="closing-ghost">
          <Pumpkin size={80} lit className="closing-pumpkin" />
          <Ghost mood="happy" size={150} float rim={0.5} />
          <Pumpkin size={64} lit className="closing-pumpkin" />
        </div>
        <p className="closing-line">One day your friends will gather.</p>
        <a className="btn primary big" href={href('seal')}>
          Seal a jar
        </a>
      </section>

      <footer className="footer center faint">
        Free and open source · No account, no tracking
      </footer>
    </div>
  );
}
