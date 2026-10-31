import type { CSSProperties } from 'react';
import type { Costume } from '../core/buddy.ts';
import { Candle } from '../ui/art/Candle.tsx';
import { EmblemIcon } from '../ui/art/Emblem.tsx';
import { Ghost, GhostHand, type Mood } from '../ui/art/Ghost.tsx';
import { Jar } from '../ui/art/Jar.tsx';
import { Candy, FlyingBats, Lantern, Moon, Pumpkin, Web } from '../ui/art/Spooky.tsx';
import { href, useAtmosphere } from '../ui/shell.tsx';

const d = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties;

const TWINKLES = [
  { x: 30, y: 18, s: 14, d: 0 },
  { x: 72, y: 14, s: 10, d: 1.2 },
  { x: 64, y: 62, s: 12, d: 2.1 },
  { x: 24, y: 58, s: 9, d: 0.7 },
  { x: 80, y: 40, s: 8, d: 1.8 },
  { x: 12, y: 32, s: 10, d: 2.6 },
  { x: 44, y: 8, s: 7, d: 3.1 },
];

interface EdgePeeker {
  costume: Costume;
  mood?: Mood;
  edge: 'top' | 'left' | 'right';
  /** Along the edge, in percent of the hero. */
  at: number;
  size: number;
  tilt?: number;
}

// Friends peeking over the hero's edges, holding on with little hands.
const PEEKERS: EdgePeeker[] = [
  { costume: 'skeleton', edge: 'top', at: 24, size: 118, tilt: -6 },
  { costume: 'pumpkin', edge: 'top', at: 79, size: 96, tilt: 7, mood: 'wink' },
  { costume: 'franken', edge: 'left', at: 40, size: 132, tilt: -10 },
  { costume: 'sheet', edge: 'right', at: 30, size: 138, tilt: 9 },
];

/** The ghosts sit behind the hero; their hands are drawn in front of its edge. */
function HeroPeekers({ layer }: { layer: 'ghosts' | 'hands' }) {
  return (
    <div className={`edge-${layer}`} aria-hidden="true">
      {PEEKERS.map((p, i) => {
        const style = { '--at': `${p.at}%`, '--size': `${p.size}px`, '--tilt': `${p.tilt ?? 0}deg`, '--delay': `${300 + i * 160}ms` } as CSSProperties;
        if (layer === 'ghosts') {
          return (
            <div key={i} className={`edge-peeker ${p.edge}`} style={style}>
              <Ghost costume={p.costume} mood={p.mood ?? 'open'} size={p.size} phase={i * 0.9} />
            </div>
          );
        }
        const hand = Math.round(p.size * 0.25);
        return p.edge === 'top' ? (
          <div key={i} className="edge-grip top" style={style}>
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

export function Home() {
  useAtmosphere('day');

  return (
    <div className="page home">
      <FlyingBats />
      <div className="hero-stage">
        <HeroPeekers layer="ghosts" />
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-twinkles" aria-hidden="true">
            {TWINKLES.map((t, i) => (
              <svg key={i} viewBox="0 0 20 20" style={{ left: `${t.x}%`, top: `${t.y}%`, width: t.s, height: t.s, animationDelay: `${-t.d}s` }}>
                <path d="M10 0 C11 7 13 9 20 10 C13 11 11 13 10 20 C9 13 7 11 0 10 C7 9 9 7 10 0 Z" fill="#fff" />
              </svg>
            ))}
          </div>
          <div className="hero-copy">
            <p className="tag hero-tag pop" style={d(100)}>
              a tiny ghost keeps your last words
            </p>
            <h1 id="hero-title" className="hero-title pop" style={d(200)}>
              Phylactery
            </h1>
            <p className="hero-sub rise" style={d(380)}>
              Write it. Seal it in a jar. Only your friends, together, can open it.
            </p>
            <div className="row centered rise" style={d(520)}>
              <a className="btn on-purple" href={href('seal')}>
                Seal a jar
              </a>
              <a className="btn ghosty" href={href('seance')}>
                Try a séance
              </a>
            </div>
          </div>
          <div className="hero-altar">
            <div className="hero-candle left pop" style={d(800)}>
              <Candle lit size={86} phase={0.2} />
            </div>
            <div className="hero-jar pop" style={d(650)}>
              <Jar initials="JA" size={250} warmth={0.45} />
            </div>
            <div className="hero-candle right pop" style={d(900)}>
              <Candle lit={false} size={80} phase={1.1} />
            </div>
          </div>
        </section>
        <HeroPeekers layer="hands" />
      </div>

      <section className="acts wrap" aria-label="How it works">
        <article className="act card rise" style={d(100)}>
          <div className="act-art">
            <div className="act-jar">
              <Jar initials="ME" size={112} />
            </div>
          </div>
          <div>
            <p className="tag">01 · seal</p>
            <h3>Write it, seal it</h3>
            <p className="muted">A note for everyone, your accounts, and a letter for anyone you like.</p>
          </div>
        </article>
        <article className="act card rise" style={d(200)}>
          <div className="act-art">
            <div className="bubble">still here?</div>
            <Ghost mood="curious" size={84} float phase={0.6} />
          </div>
          <div>
            <p className="tag">02 · watch</p>
            <h3>We check in</h3>
            <p className="muted">One gentle question now and then. Go quiet, and your friends look in on you.</p>
          </div>
        </article>
        <article className="act card rise" style={d(300)}>
          <div className="act-art candles">
            <Candle lit size={42} phase={0.1} />
            <Candle lit size={50} phase={0.7} />
            <Candle lit size={42} phase={1.3} />
          </div>
          <div>
            <p className="tag">03 · séance</p>
            <h3>Friends gather</h3>
            <p className="muted">Each card lights a candle. Enough candles, and the ghost hands over your words.</p>
          </div>
        </article>
      </section>

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
            <p className="muted">Not one friend, not a company, not us. Fewer cards than you choose reveal nothing at all.</p>
          </div>
          <div className="promise">
            <span className="promise-icon" style={{ background: '#ffe7f1', color: '#e0457a' }}>
              <EmblemIcon name="heart" size={26} />
            </span>
            <h3>Nothing leaves your hands</h3>
            <p className="muted">No account, no tracking. Your words are locked in your browser before anything is saved.</p>
          </div>
          <div className="promise">
            <span className="promise-icon" style={{ background: '#fff3d6', color: '#e39a14' }}>
              <EmblemIcon name="star" size={26} />
            </span>
            <h3>It outlives us</h3>
            <p className="muted">Keep your jar as one small file that opens offline, years from now, even if this website is gone.</p>
          </div>
        </div>
      </section>

      <section className="closing wrap" data-theme="night">
        <div className="closing-decor" aria-hidden="true">
          <span className="closing-web">
            <Web size={150} />
          </span>
          <span className="closing-moon">
            <Moon size={120} />
          </span>
          <span className="closing-pumpkin left">
            <Pumpkin size={96} phase={0.4} />
          </span>
          <span className="closing-lantern">
            <Lantern size={46} phase={1.1} />
          </span>
          <span className="closing-pumpkin right">
            <Pumpkin size={74} wink phase={1.7} />
          </span>
          <span className="closing-candy one">
            <Candy hue="pink" />
          </span>
          <span className="closing-candy two">
            <Candy hue="mint" size={28} />
          </span>
        </div>
        <div className="closing-ghost">
          <Ghost mood="happy" size={110} float rim={0.55} />
        </div>
        <p className="closing-line">Death gives life its meaning.</p>
        <p className="closing-sub">Leave something kind behind.</p>
        <a className="btn primary" href={href('seal')}>
          Seal a jar
        </a>
      </section>

      <footer className="footer center faint">
        Open source under MIT · Made for Kiroween 2026 · No analytics, no tracking · Your jar is never uploaded
      </footer>
    </div>
  );
}
