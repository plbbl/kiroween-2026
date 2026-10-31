import type { CSSProperties } from 'react';
import { Candle } from '../ui/art/Candle.tsx';
import { Peekers } from '../ui/art/Decor.tsx';
import { EmblemIcon } from '../ui/art/Emblem.tsx';
import { Ghost } from '../ui/art/Ghost.tsx';
import { Jar } from '../ui/art/Jar.tsx';
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

export function Home() {
  useAtmosphere('day');

  return (
    <div className="page home">
      <section className="hero" aria-labelledby="hero-title">
        <Peekers
          ghosts={[
            { costume: 'franken', x: 4, y: 74, size: 190, rotate: 24 },
            { costume: 'skeleton', x: 17, y: 2, size: 150, rotate: 162, mood: 'open' },
            { costume: 'sheet', x: 96, y: 52, size: 200, rotate: -16 },
            { costume: 'pumpkin', x: 85, y: 96, size: 170, rotate: -10, mood: 'wink' },
          ]}
        />
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
            Write what your people will need. Seal it in a jar. Give each friend a card. Only together can they open it.
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
            <Candle lit size={64} phase={0.2} />
          </div>
          <div className="hero-jar pop" style={d(650)}>
            <Jar initials="JA" size={230} warmth={0.45} />
          </div>
          <div className="hero-candle right pop" style={d(900)}>
            <Candle lit={false} size={58} phase={1.1} />
          </div>
        </div>
      </section>

      <section className="acts wrap" aria-label="How it works">
        <article className="act card rise" style={d(100)}>
          <div className="act-art">
            <div className="act-jar">
              <Jar initials="ME" size={120} />
            </div>
          </div>
          <p className="tag">01 · seal</p>
          <h3>Write it, seal it</h3>
          <p className="muted">A note for everyone, your accounts, where things are, and a private letter for anyone you like.</p>
        </article>
        <article className="act card rise" style={d(200)}>
          <div className="act-art">
            <div className="bubble">still here?</div>
            <Ghost mood="open" size={92} float phase={0.6} />
          </div>
          <p className="tag">02 · watch</p>
          <h3>We check in</h3>
          <p className="muted">Every week, one gentle question. One tap says yes. Go quiet, and your friends are asked to look in on you.</p>
        </article>
        <article className="act card rise" style={d(300)}>
          <div className="act-art candles">
            <Candle lit size={44} phase={0.1} />
            <Candle lit size={52} phase={0.7} />
            <Candle lit size={44} phase={1.3} />
          </div>
          <p className="tag">03 · séance</p>
          <h3>Friends gather</h3>
          <p className="muted">Each card lights a candle. When enough are lit, the ghost wakes up and hands over your words.</p>
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
        <div className="closing-ghost">
          <Ghost mood="happy" size={110} float />
        </div>
        <p className="closing-line">Death gives life its meaning.</p>
        <p className="closing-sub">Leave something kind behind.</p>
        <a className="btn primary" href={href('seal')}>
          Seal a jar
        </a>
      </section>

      <footer className="footer center faint">
        Open source under MIT · Made for Kiroween 2026 · No analytics, no servers, no tracking
      </footer>
    </div>
  );
}
