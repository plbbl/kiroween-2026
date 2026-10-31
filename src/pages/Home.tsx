import type { CSSProperties } from 'react';
import { Candle } from '../ui/components/Candle.tsx';
import { CandleIcon, Ornament, SealIcon, WatchIcon } from '../ui/components/Ornaments.tsx';
import { Vessel } from '../ui/components/Vessel.tsx';
import { WaxSeal } from '../ui/components/WaxSeal.tsx';
import { href, useAtmosphere } from '../ui/shell.tsx';

const d = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties;

const DUST = Array.from({ length: 18 }, (_, i) => ({
  x: 8 + ((i * 53) % 84),
  y: 30 + ((i * 29) % 60),
  t: 11 + ((i * 7) % 9),
  d: (i * 3.1) % 14,
  dx: ((i * 41) % 60) - 30,
}));

export function Home() {
  useAtmosphere('day', 3);

  return (
    <div className="page home">
      <section className="column center hero">
        <p className="eyebrow ink">On leaving well</p>
        <h1 className="title ink" style={d(150)}>
          Phylactery
        </h1>
        <p className="lede ink" style={d(450)}>
          Seal what you want to leave behind. Split the key among the people you trust. Only together can they open it.
        </p>
      </section>

      <figure className="plate rise" style={d(650)}>
        <div className="plate-scene" data-theme="night">
          <div className="plate-glow" />
          <p className="plate-inscription" aria-hidden="true">
            Memento · Mori
          </p>
          {DUST.map((p, i) => (
            <span key={i} className="dust" style={{ left: `${p.x}%`, top: `${p.y}%`, '--t': `${p.t}s`, '--d': `${-p.d}s`, '--dx': `${p.dx}px` } as CSSProperties} />
          ))}
          <svg className="plate-circle" viewBox="0 0 600 120" preserveAspectRatio="none" aria-hidden="true">
            <ellipse cx="300" cy="60" rx="270" ry="44" />
            <ellipse cx="300" cy="60" rx="240" ry="36" />
          </svg>
          <div className="plate-candle" style={{ left: '14%', bottom: '17%' }}>
            <Candle lit delay={0.3} height={128} />
          </div>
          <div className="plate-candle" style={{ left: '27%', bottom: '11%' }}>
            <Candle lit delay={1.7} height={156} />
          </div>
          <div className="plate-vessel">
            <Vessel width={186} glow={0.55} seal={<WaxSeal initials="JA" size={64} />} />
          </div>
          <div className="plate-candle" style={{ right: '27%', bottom: '11%' }}>
            <Candle lit delay={0.9} height={148} />
          </div>
          <div className="plate-candle" style={{ right: '14%', bottom: '17%' }}>
            <Candle lit={false} delay={2.4} height={120} />
          </div>
        </div>
        <figcaption>
          <span className="roman">Fig. I</span> — The vessel, sealed. Five cards were made; any three will open it.
        </figcaption>
      </figure>

      <div className="column center cta-block rise" style={d(900)}>
        <div className="row cta">
          <a className="btn primary" href={href('seal')}>
            Seal a vessel
          </a>
          <a className="btn" href={href('seance')}>
            Attend a séance
          </a>
        </div>
        <p className="faint small-print">No account. Nothing you write leaves this device.</p>
      </div>

      <Ornament />

      <section className="acts wide" aria-label="How it works">
        <article className="act">
          <div className="act-icon">
            <SealIcon />
          </div>
          <p className="roman act-num">I</p>
          <h3>The Seal</h3>
          <p>
            While you are here, write what the people you love will need: a word to all of them, the accounts you keep,
            where things are, what you wish for. Add a letter for each person if you like.
          </p>
          <p className="muted">
            It is locked in your browser and the key is broken into cards, one for each person in your circle.
          </p>
          <a href={href('seal')}>Begin the seal</a>
        </article>
        <article className="act">
          <div className="act-icon">
            <WatchIcon />
          </div>
          <p className="roman act-num">II</p>
          <h3>The Watch</h3>
          <p>
            Every week or month, a quiet question: <em>are you still here?</em> One tap answers it. If you fall silent, you
            are asked again, and again.
          </p>
          <p className="muted">
            Only then are your people asked to look in on you. Not told that you are gone. Asked to check.
          </p>
          <a href={href('watch')}>See the watch</a>
        </article>
        <article className="act">
          <div className="act-icon">
            <CandleIcon />
          </div>
          <p className="roman act-num">III</p>
          <h3>The Séance</h3>
          <p>
            When the time comes, your people gather with their cards. Each card lights a candle. When enough are lit, the
            seal breaks and the vessel opens.
          </p>
          <p className="muted">Then each of them can open the letter you wrote only to them, with their own card.</p>
          <a href={href('seance')}>Try a séance</a>
        </article>
      </section>

      <Ornament />

      <section className="column principles" aria-labelledby="promises">
        <p className="eyebrow center">Three promises</p>
        <h2 id="promises" className="center">
          Made so that it cannot be misused
        </h2>
        <ol>
          <li>
            <h3>No one can open it alone.</h3>
            <p>
              Not one friend, not a company, not us. The key is split with Shamir's Secret Sharing. Fewer cards than you
              chose reveal nothing at all.
            </p>
          </li>
          <li>
            <h3>Nothing leaves your hands.</h3>
            <p>
              Everything is written and encrypted in your browser. The watch, when it is switched on, only knows when to ask
              after you, never what you wrote.
            </p>
          </li>
          <li>
            <h3>It will outlast us.</h3>
            <p>
              Each vessel can be kept as a single file, the Grimoire, that opens without the internet, years from now, even if
              this website is gone.
            </p>
          </li>
        </ol>
      </section>

      <section className="epigraph column center">
        <blockquote>
          Do not act as if thou wert going to live ten thousand years. Death hangs over thee. While thou livest, while it is
          in thy power, be good.
        </blockquote>
        <cite>Marcus Aurelius, Meditations IV.17, translated by George Long</cite>
      </section>

      <footer className="colophon column center faint">
        <p>
          Phylactery is open source under the MIT licence. It uses WebCrypto and an independently audited implementation of
          Shamir's Secret Sharing. It keeps no analytics and loads nothing from other servers.
        </p>
      </footer>
    </div>
  );
}
