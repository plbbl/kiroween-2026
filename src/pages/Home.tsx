import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Costume } from '../core/buddy.ts';
import { EmblemIcon } from '../ui/art/Emblem.tsx';
import { Ghost, GhostHand, type Mood } from '../ui/art/Ghost.tsx';
import { Jar } from '../ui/art/Jar.tsx';
import { HowItWorks } from './HowItWorks.tsx';
import { sound } from '../ui/sound.ts';
import { href, useAtmosphere } from '../ui/shell.tsx';
import { Bat, Moon, Pumpkin } from '../ui/art/Spooky.tsx';

const d = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties;

interface EdgePeeker {
  costume: Costume;
  mood?: Mood;
  edge: 'top';
  /** Along the edge, in percent of the hero. */
  at: number;
  size: number;
  tilt?: number;
}

// Friends peeking over the hero's edges, holding on with little hands.
const PEEKERS: EdgePeeker[] = [
  { costume: 'skeleton', edge: 'top', at: 22, size: 118, tilt: -6 },
  { costume: 'pumpkin', edge: 'top', at: 80, size: 104, tilt: 7, mood: 'wink' },
];

/** The ghosts sit behind the hero; their hands are drawn in front of its edge. Shy: they duck when the pointer comes near. */
function HeroPeekers({ layer, ducked }: { layer: 'ghosts' | 'hands'; ducked: boolean[] }) {
  return (
    <div className={`edge-${layer}`} aria-hidden="true">
      {PEEKERS.map((p, i) => {
        const style = { '--at': `${p.at}%`, '--size': `${p.size}px`, '--tilt': `${p.tilt ?? 0}deg`, '--delay': `${300 + i * 160}ms` } as CSSProperties;
        if (layer === 'ghosts') {
          return (
            <div key={i} className={`edge-peeker ${p.edge}${ducked[i] ? ' ducked' : ''}`} style={style}>
              <Ghost costume={p.costume} mood={ducked[i] ? 'wow' : (p.mood ?? 'open')} size={p.size} phase={i * 0.9} />
            </div>
          );
        }
        const hand = Math.round(p.size * 0.25);
        return p.edge === 'top' ? (
          <div key={i} className={`edge-grip top${ducked[i] ? ' ducked' : ''}`} style={style}>
            <GhostHand costume={p.costume} size={hand} />
            <GhostHand costume={p.costume} size={hand} />
          </div>
        ) : (
          <div key={i} className={`edge-grip ${p.edge}`} style={style}>
            <GhostHand costume={p.costume} size={hand} />
          </div>
        );
      })}
    </div>
  );
}

type Gag = 'boo' | 'laugh' | null;

/**
 * The hero's ghost sleeps in its jar until the pointer comes near; then it
 * wakes and watches it, and dozes off again when left alone. Poke the jar
 * and it jumps up with a "BOO!", then giggles. The friends peeking over the
 * edge duck out of sight when the pointer comes close.
 */
function useHauntedHero() {
  const stage = useRef<HTMLDivElement>(null);
  const jar = useRef<HTMLButtonElement>(null);
  const [look, setLook] = useState<{ x: number; y: number } | null>(null);
  const [ducked, setDucked] = useState<boolean[]>(() => PEEKERS.map(() => false));
  const [gag, setGag] = useState<Gag>(null);

  useEffect(() => {
    let frame = 0;
    let idle = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const j = jar.current?.getBoundingClientRect();
        const s = stage.current?.getBoundingClientRect();
        if (!j || !s) return;
        const dx = e.clientX - (j.left + j.width / 2);
        const dy = e.clientY - (j.top + j.height / 2);
        const near = e.clientY < s.bottom + 80;
        const clamp = (v: number) => Math.max(-1, Math.min(1, v));
        setLook(near ? { x: clamp(dx / 320), y: clamp(dy / 240) } : null);
        setDucked((was) => {
          const next = PEEKERS.map((p) => Math.hypot(e.clientX - (s.left + (s.width * p.at) / 100), e.clientY - s.top) < 140);
          return next.some((v, i) => v !== was[i]) ? next : was;
        });
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
  }, []);

  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const boo = useCallback(() => {
    timers.current.forEach(clearTimeout);
    setGag('boo');
    sound.boo();
    timers.current = [
      window.setTimeout(() => {
        setGag('laugh');
        sound.giggle();
      }, 950),
      window.setTimeout(() => setGag(null), 2300),
    ];
  }, []);

  return { stage, jar, look, ducked, gag, boo };
}

export function Home() {
  useAtmosphere('night');
  const { stage, jar: jarButton, look, ducked, gag, boo } = useHauntedHero();

  return (
    <div className="page home">
      <div className="hero-stage" ref={stage}>
        <HeroPeekers layer="ghosts" ducked={ducked} />
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <h1 id="hero-title" className="hero-title pop" style={d(200)}>
              Phylactery
            </h1>
            <p className="hero-sub rise" style={d(380)}>
              Leave your passwords, papers and last words in a jar that only your friends, together, can open.
            </p>
            <div className="row centered rise" style={d(520)}>
              <a className="btn on-purple" href={href('seal')}>
                Seal a jar
              </a>
              <a className="btn ghosty" href={`${href('seance')}?demo`}>
                Try a séance
              </a>
            </div>
            <p className="hero-trust rise" style={d(620)}>
              Free · No account · Locked in your browser
            </p>
          </div>
          {/* A Halloween night inside the hero: the moon, bats, a hill with lit pumpkins. */}
          <div className="hero-night" aria-hidden="true">
            <Moon size={150} cloud className="hero-moon" />
            <Bat size={70} color="#3b1680" flap={false} className="hero-bat b1" />
            <Bat size={48} color="#4a1fa0" flap={false} className="hero-bat b2" />
            <Bat size={40} color="#4a1fa0" flap={false} className="hero-bat b3" />
            <svg className="hero-hill" viewBox="0 0 1000 120" preserveAspectRatio="xMidYMax slice">
              <path d="M0 70 C140 40 260 46 380 64 C470 78 540 50 620 44 C760 34 860 70 1000 52 L1000 120 L0 120 Z" fill="#3a1f78" />
              {/* A small old house on the far hill, its windows lit. */}
              <g transform="translate(0 16)">
              <path d="M792 52 L792 26 L784 26 L804 8 L824 26 L816 26 L816 48 Z M806 30 L806 4 L802 4 L810 -12 L818 4 L815 4 L815 40 Z" fill="#3a1f78" />
              <g fill="#ffc65a">
                <rect x="796" y="32" width="5" height="7" rx="1" />
                <rect x="806" y="32" width="5" height="7" rx="1" />
                <rect x="808" y="8" width="3.5" height="5" rx="0.8" />
              </g>
              </g>
              <path d="M0 92 C160 70 300 80 430 90 C560 100 680 76 820 78 C900 79 960 88 1000 84 L1000 120 L0 120 Z" fill="#2a1458" />
            </svg>
          </div>
          <div className="hero-altar">
            <Pumpkin size={78} lit className="hero-pumpkin left pop" style={d(800)} />
            <button type="button" className="hero-jar pop" style={d(650)} ref={jarButton} onClick={boo} aria-label="Wake the little ghost">
              <Jar
                initials="ME"
                size={250}
                warmth={look || gag ? 0.7 : 0.45}
                mood={gag ?? (look ? 'open' : 'sleep')}
                look={gag ? undefined : (look ?? undefined)}
                rattle={gag === 'boo'}
                label="A jar with a little ghost inside"
              />
              {gag && (
                <span className={`boo-bubble ${gag}`} key={gag} aria-live="polite">
                  {gag === 'boo' ? 'BOO!' : 'Hee hee. Hi!'}
                </span>
              )}
            </button>
            <Pumpkin size={56} lit className="hero-pumpkin right pop" style={d(900)} />
          </div>
        </section>
        <HeroPeekers layer="hands" ducked={ducked} />
      </div>

      <HowItWorks />

      <section className="promises wrap" aria-labelledby="promises-title">
        <h2 id="promises-title" className="center">
          Kind, and hard to break
        </h2>
        <div className="promise-grid">
          <div className="promise">
            <span className="promise-icon" style={{ background: '#efe7ff', color: '#8e47ff' }}>
              <EmblemIcon name="key" size={26} />
            </span>
            <h3>No one opens it alone</h3>
            <p className="muted">Not one friend, not a company, not this website. Too few cards reveal nothing.</p>
          </div>
          <div className="promise">
            <span className="promise-icon" style={{ background: '#ffe7f1', color: '#e0457a' }}>
              <EmblemIcon name="heart" size={26} />
            </span>
            <h3>Nothing leaves unlocked</h3>
            <p className="muted">Locked in your browser before anything is saved or sent. No account, no tracking.</p>
          </div>
          <div className="promise">
            <span className="promise-icon" style={{ background: '#fff3d6', color: '#e39a14' }}>
              <EmblemIcon name="star" size={26} />
            </span>
            <h3>It outlives this website</h3>
            <p className="muted">Your jar is one small file. It opens offline, years from now.</p>
          </div>
        </div>
      </section>

      <section className="closing wrap" data-theme="night">
        <div className="closing-ghost">
          <Pumpkin size={64} lit className="closing-pumpkin" />
          <Ghost mood="happy" size={110} float rim={0.5} />
          <Pumpkin size={52} lit className="closing-pumpkin" />
        </div>
        <p className="closing-line">One day your friends will gather.</p>
        <p className="closing-sub">Leave them something to open together.</p>
        <a className="btn primary" href={href('seal')}>
          Seal a jar
        </a>
      </section>

      <footer className="footer center faint">
        Free and open source (MIT) · No account, no analytics, no tracking · Your jar never leaves your device unlocked
      </footer>
    </div>
  );
}
