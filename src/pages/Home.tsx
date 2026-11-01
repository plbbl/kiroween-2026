import type { CSSProperties } from 'react';
import type { Costume } from '../core/buddy.ts';
import { Candle } from '../ui/art/Candle.tsx';
import { EmblemIcon } from '../ui/art/Emblem.tsx';
import { Ghost, GhostHand, type Mood } from '../ui/art/Ghost.tsx';
import { Jar } from '../ui/art/Jar.tsx';
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
  useAtmosphere('night');

  return (
    <div className="page home">
      <div className="hero-stage">
        <HeroPeekers layer="ghosts" />
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
              <a className="btn ghosty" href={href('seance')}>
                Try a séance
              </a>
            </div>
            <p className="hero-trust rise" style={d(620)}>
              Free · No account · Locked in your browser
            </p>
          </div>
          {/* A Halloween night inside the hero: the moon, bats, a hill with lit pumpkins. */}
          <div className="hero-night" aria-hidden="true">
            <Moon size={150} className="hero-moon" />
            <Bat size={70} color="#3b1680" className="hero-bat b1" />
            <Bat size={48} color="#4a1fa0" className="hero-bat b2" />
            <Bat size={40} color="#4a1fa0" className="hero-bat b3" />
            <svg className="hero-hill" viewBox="0 0 1000 120" preserveAspectRatio="none">
              <path d="M0 70 C140 40 260 46 380 64 C470 78 540 50 620 44 C760 34 860 70 1000 52 L1000 120 L0 120 Z" fill="#6a2ee0" />
              <path d="M0 92 C160 70 300 80 430 90 C560 100 680 76 820 78 C900 79 960 88 1000 84 L1000 120 L0 120 Z" fill="#5a22c4" />
            </svg>
          </div>
          <div className="hero-altar">
            <Pumpkin size={78} lit className="hero-pumpkin left pop" style={d(800)} />
            <div className="hero-jar pop" style={d(650)}>
              <Jar initials="ME" size={250} warmth={0.45} />
            </div>
            <Pumpkin size={56} lit className="hero-pumpkin right pop" style={d(900)} />
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
            <h3>Nothing leaves unlocked</h3>
            <p className="muted">Free, no account, no tracking. Your words are locked in your browser before anything is saved or sent.</p>
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
        <div className="closing-ghost">
          <Ghost mood="happy" size={110} float rim={0.5} />
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
