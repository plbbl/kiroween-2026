import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { CardError, parseCard, shardX, type Shard } from '../core/cards.ts';
import { checkShard, JarError, jarIdBytes, openJar, openLetter, parseJar, type JarFile, type JarHolder, type Letter, type OpenedJar } from '../core/jar.ts';
import { sigilSeed } from '../core/sigil.ts';
import { DEMO_CARDS, DEMO_JAR, isDemo } from '../demo/demo.ts';
import { Candle } from '../ui/components/Candle.tsx';
import { CardInput } from '../ui/components/CardInput.tsx';
import { numberWord } from '../ui/components/Cards.tsx';
import { Ornament } from '../ui/components/Ornaments.tsx';
import { Sigil } from '../ui/components/Sigil.tsx';
import { Vessel } from '../ui/components/Vessel.tsx';
import { initialsOf, WaxSeal, type WaxState } from '../ui/components/WaxSeal.tsx';
import { href, useAtmosphere, useShell, wait } from '../ui/shell.tsx';
import { sound } from '../ui/sound.ts';

const REFUSALS: Record<string, string> = {
  'other-jar': 'This card belongs to another vessel.',
  'unknown-holder': 'This card does not match anyone in this circle.',
  duplicate: 'This card has already been offered.',
};

export function Seance({ embedded }: { embedded: JarFile | null }) {
  useAtmosphere('night', 0);
  const shell = useShell();
  const [jar, setJar] = useState<JarFile | null>(embedded);

  useEffect(() => {
    sound.startDrone();
    return () => {
      sound.stopDrone();
      shell.setCandlelight(0);
    };
  }, [shell]);

  if (!jar) return <ChooseVessel onChoose={setJar} />;
  return <Circle jar={jar} key={jar.jarId} onLeave={embedded ? undefined : () => setJar(null)} />;
}

function ChooseVessel({ onChoose }: { onChoose: (jar: JarFile) => void }) {
  const [error, setError] = useState('');
  const [over, setOver] = useState(false);

  const readFile = async (file: File) => {
    setError('');
    try {
      const text = await file.text();
      // A Grimoire is an HTML page with the vessel inside it.
      const embedded = /<script id="phylactery-jar" type="application\/json">([\s\S]*?)<\/script>/.exec(text)?.[1];
      onChoose(parseJar(embedded ?? text));
    } catch (e) {
      setError(e instanceof JarError ? e.message : 'That file is not a vessel.');
    }
  };

  return (
    <div className="page seance-page">
      <section className="column center stack choose">
        <p className="eyebrow ink">The third act</p>
        <h1 className="ink" style={{ '--d': '150ms' } as CSSProperties}>
          The Séance
        </h1>
        <p className="lede ink" style={{ margin: '0 auto', '--d': '350ms' } as CSSProperties}>
          When the time has come, the holders gather. Each card lights one candle. When enough are lit, the seal breaks.
        </p>
      </section>

      <section className="choose-grid wide">
        <button className="choose-option rise" style={{ '--d': '500ms' } as CSSProperties} onClick={() => onChoose(DEMO_JAR)}>
          <span className="choose-vessel">
            <Vessel width={92} glow={0.6} seal={<WaxSeal initials="JA" size={28} />} />
          </span>
          <span className="roman">I</span>
          <span className="choose-title">The demonstration vessel</span>
          <span className="faint">June Alder sealed hers in October with five cards. The cards are on the table. Three will open it.</span>
        </button>

        <label
          className={`choose-option drop rise${over ? ' over' : ''}`}
          style={{ '--d': '650ms' } as CSSProperties}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            const f = e.dataTransfer.files[0];
            if (f) void readFile(f);
          }}
        >
          <input
            type="file"
            accept=".html,.json,text/html,application/json"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void readFile(f);
              e.target.value = '';
            }}
          />
          <span className="choose-scroll" aria-hidden="true">
            <svg viewBox="0 0 64 64">
              <path d="M16 10 H44 C48 10 50 12 50 16 V50 C50 54 48 56 44 56 H20 C16 56 14 54 14 50 V14 C14 12 15 10 16 10 Z M22 22 H42 M22 30 H42 M22 38 H36" fill="none" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </span>
          <span className="roman">II</span>
          <span className="choose-title">A vessel you were given</span>
          <span className="faint">Choose or drop the Grimoire file, or the vessel file. It is read here and nowhere else.</span>
        </label>
      </section>
      {error && (
        <p className="error center" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

interface Offered {
  shard: Shard;
  holder: JarHolder;
}

type Phase = 'gathering' | 'opening' | 'open';

/**
 * Place candles evenly and symmetrically around the circle. Angles are in
 * screen terms: 90° is the front, nearest the viewer. No candle stands
 * directly behind the vessel, where it would be hidden.
 */
function candleAngles(k: number): number[] {
  const start = k % 2 === 1 ? 90 : 90 + 180 / k;
  return Array.from({ length: k }, (_, i) => (start + (i * 360) / k) % 360);
}

function Circle({ jar, onLeave }: { jar: JarFile; onLeave?: () => void }) {
  const shell = useShell();
  const [offered, setOffered] = useState<Offered[]>([]);
  const [justLit, setJustLit] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('gathering');
  const [wax, setWax] = useState<WaxState>('whole');
  const [opened, setOpened] = useState<OpenedJar | null>(null);
  const [announce, setAnnounce] = useState('');
  const [failure, setFailure] = useState('');
  const k = jar.threshold;
  const demo = isDemo(jar);
  const angles = useMemo(() => candleAngles(k), [k]);
  const offeredRef = useRef<Offered[]>([]);
  offeredRef.current = offered;

  useEffect(() => {
    shell.setCandlelight(phase === 'open' ? 1 : offered.length / k);
  }, [shell, offered.length, k, phase]);

  const open = useCallback(
    async (circle: Offered[]) => {
      setPhase('opening');
      try {
        const [result] = await Promise.all([openJar(jar, circle.map((o) => o.shard)), wait(1400)]);
        setWax('cracking');
        sound.crack();
        await wait(650);
        setWax('broken');
        setOpened(result);
        sound.chime();
        setAnnounce('The seal is broken. The vessel is open.');
        await wait(3200);
        setPhase('open');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (e) {
        setPhase('gathering');
        setFailure(e instanceof Error ? e.message : 'The vessel would not open.');
      }
    },
    [jar],
  );

  const offer = useCallback(
    (text: string): string | null => {
      setFailure('');
      let card;
      try {
        card = parseCard(text);
      } catch (e) {
        return e instanceof CardError ? e.message : 'This card could not be read.';
      }
      if (card.kind === 'seal') return 'That is a personal seal, from the inside of a card. Keep it until the vessel is open.';
      const current = offeredRef.current;
      if (current.length >= k) return 'Enough candles are lit.';
      const check = checkShard(jar, card, current.map((o) => o.shard));
      if (!check.ok) return REFUSALS[check.reason] ?? 'This card was refused.';
      const next = [...current, { shard: card, holder: check.holder }];
      offeredRef.current = next;
      setOffered(next);
      setJustLit(next.length - 1);
      sound.strike();
      setTimeout(() => sound.ignite(), 90);
      setAnnounce(`${check.holder.name}'s card is accepted. ${next.length} of ${k} candles lit.`);
      if (next.length === k) void open(next);
      return null;
    },
    [jar, k, open],
  );

  if (phase === 'open' && opened) {
    return <Reveal jar={jar} opened={opened} circle={offered.map((o) => o.holder.name)} />;
  }

  const last = offered[offered.length - 1];
  const sealedOn = new Date(jar.sealedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="page seance-page">
      <p className="visually-hidden" aria-live="assertive">
        {announce}
      </p>
      <section className="column center seance-head">
        <p className="eyebrow ink">The Séance</p>
        <h1 className="ink" style={{ '--d': '150ms' } as CSSProperties}>
          The Phylactery of {jar.owner}
        </h1>
        <p className="lede ink" style={{ margin: '0 auto', '--d': '300ms' } as CSSProperties}>
          Sealed on {sealedOn}. Any {numberWord(k)} of the {numberWord(jar.total)} cards will open it.
        </p>
      </section>

      <div className={`altar phase-${phase}`} style={{ '--lit': offered.length / k } as CSSProperties}>
        <svg className="altar-circle" viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden="true">
          <ellipse cx="500" cy="150" rx="470" ry="130" />
          <ellipse cx="500" cy="150" rx="430" ry="112" />
          <ellipse className="glint" cx="500" cy="150" rx="450" ry="121" pathLength={1000} />
          {Array.from({ length: 48 }, (_, i) => {
            const a = (i / 48) * Math.PI * 2;
            return <line key={i} x1={500 + Math.cos(a) * 430} y1={150 + Math.sin(a) * 112} x2={500 + Math.cos(a) * 470} y2={150 + Math.sin(a) * 130} />;
          })}
          <polygon
            points={Array.from({ length: 5 }, (_, i) => {
              const a = ((i * 2 * 360) / 5 - 90) * (Math.PI / 180);
              return `${500 + Math.cos(a) * 400},${150 + Math.sin(a) * 104}`;
            }).join(' ')}
          />
        </svg>
        <div className="altar-glow" />

        {angles.map((deg, i) => {
          const a = (deg * Math.PI) / 180;
          const x = 50 + Math.cos(a) * 40;
          const y = 61 + Math.sin(a) * 18;
          const depth = (Math.sin(a) + 1) / 2;
          const o = offered[i];
          return (
            <div
              key={i}
              className="altar-candle"
              style={{ left: `${x}%`, top: `${y}%`, zIndex: Math.round(y * 10), '--depth': depth } as CSSProperties}
            >
              <Candle lit={!!o} justLit={justLit === i} delay={i * 0.83} height={Math.round(104 + depth * 30)} label={o ? `Candle lit by ${o.holder.name}` : 'An unlit candle'} />
              <span className={`altar-name${o ? ' shown' : ''}`}>{o?.holder.name ?? ''}</span>
            </div>
          );
        })}

        <div className="altar-vessel" style={{ zIndex: 580 }}>
          <Vessel width={200} open={wax === 'broken'} glow={offered.length / k} seal={<WaxSeal initials={initialsOf(jar.owner)} size={72} state={wax} />} />
        </div>
      </div>

      <section className="column offering">
        {phase === 'gathering' && (
          <>
            {last && (
              <div className="mark-check rise" key={shardX(last.shard)}>
                <Sigil seed={sigilSeed(jarIdBytes(jar), shardX(last.shard))} size={78} draw />
                <p>
                  <strong>{last.holder.name}</strong>’s card bears this mark. It should match the mark printed on the card.
                </p>
              </div>
            )}
            <h2 className="center">
              {offered.length === 0 ? 'Offer the first card' : `${numberWord(k - offered.length)[0]!.toUpperCase()}${numberWord(k - offered.length).slice(1)} more`}
            </h2>
            {demo && <DemoTable offered={offered} onOffer={offer} />}
            <CardInput kind="shard" onCard={offer} />
            {failure && (
              <p className="error" role="alert">
                {failure}
              </p>
            )}
            {onLeave && (
              <p className="center">
                <button className="link-btn" onClick={onLeave}>
                  Choose another vessel
                </button>
              </p>
            )}
          </>
        )}
        {phase === 'opening' && (
          <p className="center opening-text ink" aria-hidden="true">
            {wax === 'broken' ? 'It opens.' : 'The circle is complete.'}
          </p>
        )}
      </section>
    </div>
  );
}

function DemoTable({ offered, onOffer }: { offered: Offered[]; onOffer: (text: string) => string | null }) {
  const [note, setNote] = useState('');
  const used = new Set(offered.map((o) => o.holder.name));
  return (
    <div className="demo-table">
      <p className="label center">The cards on the table · choose any three</p>
      <div className="demo-cards">
        {DEMO_CARDS.map((c, i) => (
          <button
            key={c.name}
            className={`demo-card${used.has(c.name) ? ' used' : ''}`}
            style={{ '--tilt': `${[-3, 2, -1, 3, -2][i]}deg` } as CSSProperties}
            disabled={used.has(c.name)}
            onClick={() => setNote(onOffer(c.shard) ?? '')}
          >
            <span className="demo-card-kind">Shard</span>
            <span className="demo-card-name">{c.name}</span>
            <span className="demo-card-hint">{used.has(c.name) ? 'Offered' : 'Offer'}</span>
          </button>
        ))}
      </div>
      {note && <p className="error center">{note}</p>}
      <p className="faint center demo-or">or offer a card the real way, below</p>
    </div>
  );
}

function Paragraphs({ text, start = 0 }: { text: string; start?: number }) {
  return (
    <>
      {text
        .split(/\n{2,}/)
        .filter((p) => p.trim())
        .map((p, i) => (
          <p key={i} className="ink" style={{ '--d': `${start + i * 450}ms` } as CSSProperties}>
            {p.split('\n').map((line, j, all) => (
              <span key={j}>
                {line}
                {j < all.length - 1 && <br />}
              </span>
            ))}
          </p>
        ))}
    </>
  );
}

const WISH_LABELS: Record<string, string> = {
  close: 'Close it',
  memorialize: 'Keep it as a memorial',
  keep: 'Keep it running',
  'hand-over': 'Hand it to someone',
};

function Reveal({ jar, opened, circle }: { jar: JarFile; opened: OpenedJar; circle: string[] }) {
  const c = opened.content;
  const wishes = (
    [
      ['The farewell', c.wishes.farewell],
      ['The body', c.wishes.body],
      ['Those who depend on me', c.wishes.dependents],
      ['Anything else', c.wishes.other],
    ] as const
  ).filter(([, v]) => v.trim());
  const letters = jar.holders.filter((h) => h.hasLetter);
  const names = circle.length > 1 ? `${circle.slice(0, -1).join(', ')} and ${circle[circle.length - 1]}` : circle[0];

  return (
    <div className="page reveal-page">
      <article className="column reveal">
        <header className="center">
          <div className="reveal-vessel rise">
            <Vessel width={110} open glow={1} seal={<WaxSeal initials={initialsOf(jar.owner)} size={34} state="broken" />} />
          </div>
          <p className="eyebrow ink">Opened by {names}</p>
          <h1 className="ink" style={{ '--d': '200ms' } as CSSProperties}>
            {jar.owner}
          </h1>
        </header>

        {c.message.trim() && (
          <section className="reveal-message">
            <Paragraphs text={c.message} start={600} />
          </section>
        )}

        <Ornament />

        {c.accounts.length > 0 && (
          <section className="reveal-section rise" style={{ '--d': '400ms' } as CSSProperties}>
            <h2>The accounts</h2>
            <table className="ledger-table">
              <thead>
                <tr>
                  <th scope="col">Service</th>
                  <th scope="col">How to get in</th>
                  <th scope="col">Wish</th>
                </tr>
              </thead>
              <tbody>
                {c.accounts.map((a, i) => (
                  <tr key={i}>
                    <td>{a.service}</td>
                    <td className="mono-cell">{a.login}</td>
                    <td>
                      {WISH_LABELS[a.wish]}
                      {a.note && <span className="note">{a.note}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {c.documents.length > 0 && (
          <section className="reveal-section rise" style={{ '--d': '500ms' } as CSSProperties}>
            <h2>Where things are</h2>
            <dl className="places">
              {c.documents.map((d, i) => (
                <div key={i}>
                  <dt>{d.item}</dt>
                  <dd>{d.location}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {wishes.length > 0 && (
          <section className="reveal-section rise" style={{ '--d': '600ms' } as CSSProperties}>
            <h2>Wishes</h2>
            <dl className="places">
              {wishes.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {letters.length > 0 && (
          <>
            <Ornament />
            <section className="reveal-section">
              <h2 className="center">Letters</h2>
              <p className="center muted">
                Each letter opens only with the seal inside its reader’s card. Not even the circle can read it.
              </p>
              <div className="envelopes">
                {letters.map((h) => (
                  <Envelope key={h.x} jar={jar} opened={opened} holder={h} />
                ))}
              </div>
            </section>
          </>
        )}

        <Ornament />
        <section className="center stack after-links">
          <p className="muted">There is a checklist for the days that follow, written for the people left to do them.</p>
          <div className="row cta">
            <a className="btn" href={`${href('guides')}#after`}>
              For the days that follow
            </a>
            <button className="btn quiet" onClick={() => window.location.reload()}>
              Close the vessel
            </button>
          </div>
          <p className="faint">Closing forgets everything that was opened. Nothing was saved.</p>
        </section>
      </article>
    </div>
  );
}

function Envelope({ jar, opened, holder }: { jar: JarFile; opened: OpenedJar; holder: JarHolder }) {
  const [letter, setLetter] = useState<Letter | null>(null);
  const [asking, setAsking] = useState(false);
  const demoCard = isDemo(jar) ? DEMO_CARDS.find((c) => c.name === holder.name) : undefined;

  const tryOpen = async (text: string): Promise<string | null> => {
    let card;
    try {
      card = parseCard(text);
    } catch (e) {
      return e instanceof CardError ? e.message : 'This seal could not be read.';
    }
    if (card.kind !== 'seal') return 'That is the outside of a card. This needs the seal from the inside.';
    if (card.x !== holder.x) return `That seal belongs to someone else. This letter is for ${holder.name}.`;
    try {
      const l = await openLetter(jar, opened, card);
      sound.crack();
      setTimeout(() => sound.chime(), 400);
      setLetter(l);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : 'The seal did not open the letter.';
    }
  };

  if (letter) {
    return (
      <article className="letter">
        <p className="eyebrow">For {letter.to}</p>
        <div className="letter-body">
          <Paragraphs text={letter.text} start={200} />
        </div>
      </article>
    );
  }

  return (
    <div className={`envelope${asking ? ' asking' : ''}`}>
      <div className="envelope-front">
        <span className="envelope-flap" aria-hidden="true" />
        <div className="envelope-seal">
          <WaxSeal initials={initialsOf(holder.name)} size={56} />
        </div>
        <p className="envelope-to">For {holder.name}</p>
        {!asking && (
          <button className="btn small" onClick={() => setAsking(true)}>
            Break with your seal
          </button>
        )}
      </div>
      {asking && (
        <div className="envelope-input rise">
          {demoCard && (
            <button className="btn small primary demo-seal" onClick={() => void tryOpen(demoCard.seal)}>
              Use {holder.name.split(' ')[0]}’s seal from the demo
            </button>
          )}
          <CardInput kind="seal" onCard={tryOpen} />
        </div>
      )}
    </div>
  );
}
