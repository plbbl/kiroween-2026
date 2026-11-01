import { useEffect, useState, type CSSProperties } from 'react';
import type { Buddy, Emblem } from '../../core/buddy.ts';
import { CardError, parseCard } from '../../core/cards.ts';
import { openLetter, type JarFile, type JarHolder, type Letter, type OpenedJar } from '../../core/jar.ts';
import { DEMO_CARDS, isDemo } from '../../demo/demo.ts';
import { Candle } from '../../ui/art/Candle.tsx';
import { Sparkles } from '../../ui/art/Decor.tsx';
import { EmblemIcon } from '../../ui/art/Emblem.tsx';
import { Ghost, GhostHand } from '../../ui/art/Ghost.tsx';
import { Jar } from '../../ui/art/Jar.tsx';
import { WaxSeal, initialsOf } from '../../ui/art/WaxSeal.tsx';
import { CardInput } from '../../ui/components/CardInput.tsx';
import { ConfirmButton } from '../../ui/components/Confirm.tsx';
import { href, useFocusOnArrival, useLeaveWarning } from '../../ui/shell.tsx';
import { sound } from '../../ui/sound.ts';

const WISH_LABELS: Record<string, string> = {
  decide: 'Up to you',
  close: 'Close it',
  memorialize: 'Keep as a memorial',
  keep: 'Keep it running',
  'hand-over': 'Hand it over',
};

const WISHES: [key: 'farewell' | 'body' | 'dependents' | 'other', label: string, icon: Emblem, color: string][] = [
  ['farewell', 'The farewell', 'flower', '#e0457a'],
  ['body', 'The body', 'heart', '#8e47ff'],
  ['dependents', 'Who depends on me', 'bone', '#d0832a'],
  ['other', 'Anything else', 'spark', '#2f9e7a'],
];

function Paragraphs({ text, start = 0, step = 380 }: { text: string; start?: number; step?: number }) {
  return (
    <>
      {text
        .split(/\n{2,}/)
        .filter((p) => p.trim())
        .map((p, i) => (
          <p key={i} className="rise" style={{ '--d': `${start + i * step}ms` } as CSSProperties}>
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

/** Copies a login, so no one has to retype a password by hand on a phone. */
function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 1600);
    return () => clearTimeout(t);
  }, [done]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // A jar file opened from disk may not have the clipboard API.
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.append(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    setDone(true);
  };
  return (
    <button type="button" className="copy-btn" onClick={() => void copy()} aria-label={done ? 'Copied' : label}>
      {done ? 'Copied' : 'Copy'}
    </button>
  );
}

function names(list: string[]): string {
  const first = list.map((n) => n.split(/\s+/)[0]!);
  return first.length > 1 ? `${first.slice(0, -1).join(', ')} & ${first[first.length - 1]}` : (first[0] ?? '');
}

export function Reveal({ jar, opened, circle, buddies }: { jar: JarFile; opened: OpenedJar; circle: JarHolder[]; buddies: Map<number, Buddy> }) {
  const c = opened.content;
  const first = jar.owner.split(/\s+/)[0] ?? jar.owner;
  const wishes = WISHES.filter(([k]) => c.wishes[k].trim());
  const letters = jar.holders.filter((h) => h.hasLetter);
  // An open jar can only be opened again with the cards: leaving asks first.
  const [closing, setClosing] = useState(false);
  useLeaveWarning(
    isDemo(jar) || closing ? null : `Leaving closes ${first}’s jar. To read it again, the cards would be needed again. Leave anyway?`,
  );
  useEffect(() => {
    if (closing) window.location.reload();
  }, [closing]);
  const heading = useFocusOnArrival();
  // The friends who opened it keep their candles burning beside the open jar.
  const seats = circle.map((h) => ({ holder: h, buddy: buddies.get(h.x) }));
  const half = Math.ceil(seats.length / 2);
  const seatSize = seats.length > 4 ? 30 : 40;
  const seat = (s: (typeof seats)[number], i: number) => (
    <div className="reveal-seat rise" key={s.holder.x} style={{ '--d': `${200 + i * 90}ms` } as CSSProperties}>
      {s.buddy && <Ghost costume={s.buddy.costume} emblem={s.buddy.emblem} tilt={s.buddy.tilt} mood="happy" size={seatSize + 6} float phase={i * 0.6} />}
      <Candle lit size={seatSize} phase={i * 0.7} label={`${s.holder.name}'s candle, lit`} />
    </div>
  );

  return (
    <div className="page reveal-page print-self">
      <header className="narrow center reveal-head">
        <div className="reveal-altar">
          <div className="reveal-seats">{seats.slice(0, half).map(seat)}</div>
          <div className="reveal-jar">
            <Jar initials={initialsOf(jar.owner)} state="open" wax="broken" warmth={1} notes={false} size={150} label={`${first}’s jar, open`} />
            <Sparkles burst="reveal" radius={120} count={14} />
          </div>
          <div className="reveal-seats">{seats.slice(half).map((s, i) => seat(s, i + half))}</div>
        </div>
        <p className="jar-tag rise">
          <span>Opened by {names(circle.map((h) => h.name))}</span>
        </p>
        <h1 className="rise" style={{ '--d': '120ms' } as CSSProperties} tabIndex={-1} ref={heading}>
          {first} left you this
        </h1>
      </header>

      <div className="narrow reveal-body">
        {c.message.trim() && (
          <article className="paper message rise" style={{ '--d': '300ms' } as CSSProperties}>
            <Paragraphs text={c.message} start={500} />
            <p className="signature rise" style={{ '--d': '1400ms' } as CSSProperties}>
              — {first}
            </p>
          </article>
        )}

        {c.accounts.length > 0 && (
          <section className="paper rise" style={{ '--d': '400ms' } as CSSProperties} aria-labelledby="accounts-title">
            <h2 id="accounts-title" className="paper-title">
              <EmblemIcon name="key" size={22} color="#8e47ff" title="" /> Accounts
            </h2>
            <ul className="account-list">
              {c.accounts.map((a, i) => (
                <li key={i}>
                  <div className="spread">
                    <b>{a.service || 'An account'}</b>
                    <span className={`pill wish-${a.wish}`}>{WISH_LABELS[a.wish]}</span>
                  </div>
                  {a.login && (
                    <div className="login-row">
                      <code className="login">{a.login}</code>
                      <CopyButton text={a.login} label={`Copy how to get into ${a.service || 'this account'}`} />
                    </div>
                  )}
                  {a.note && <p className="muted">{a.note}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {c.documents.length > 0 && (
          <section className="paper rise" style={{ '--d': '500ms' } as CSSProperties} aria-labelledby="places-title">
            <h2 id="places-title" className="paper-title">
              <EmblemIcon name="moon" size={22} color="#e39a14" title="" /> Where things are
            </h2>
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
          <section className="rise" style={{ '--d': '600ms' } as CSSProperties} aria-labelledby="wishes-title">
            <h2 id="wishes-title" className="center section-title">
              Wishes
            </h2>
            <div className="wish-cards">
              {wishes.map(([k, label, icon, color]) => (
                <div className="paper wish-card" key={k}>
                  <span className="wish-icon" style={{ color }}>
                    <EmblemIcon name={icon} size={22} title="" />
                  </span>
                  <h3>{label}</h3>
                  <p>{c.wishes[k]}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {letters.length > 0 && (
          <section className="letters" aria-labelledby="letters-title">
            <h2 id="letters-title" className="center section-title">
              Letters
            </h2>
            <p className="center muted">Each opens only with its reader’s seal.</p>
            <Letters jar={jar} opened={opened} holders={letters} buddies={buddies} />
          </section>
        )}

        <section className="center after">
          <Ghost costume="sheet" mood="happy" size={70} float />
          {isDemo(jar) ? (
            <>
              <p className="muted">That was June’s jar. Yours takes about ten minutes.</p>
              <div className="row centered">
                <a className="btn primary" href={href('seal')}>
                  Seal your own jar
                </a>
                <a className="btn" href={`${href('guides')}#after`} target="_blank" rel="noopener">
                  What to do next
                </a>
              </div>
            </>
          ) : (
            <>
              <p className="muted">A gentle checklist for the days that follow.</p>
              <div className="row centered">
                <a className="btn primary" href={`${href('guides')}#after`} target="_blank" rel="noopener">
                  What to do next
                </a>
                <button type="button" className="btn" onClick={() => window.print()}>
                  Print what {first} left
                </button>
              </div>
              <p className="faint">
                Nothing was saved.{' '}
                <ConfirmButton
                  label="Close the jar"
                  question={`Close ${first}’s jar? To read it again, the cards would be needed again.`}
                  yes="Close it"
                  no="Keep reading"
                  ask={!isDemo(jar)}
                  onConfirm={() => setClosing(true)}
                />
              </p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

/**
 * The envelopes stay in one row. The seal is asked for, and the letters
 * are read, below the row, so opening one never moves the others.
 */
function Letters({ jar, opened, holders, buddies }: { jar: JarFile; opened: OpenedJar; holders: JarHolder[]; buddies: Map<number, Buddy> }) {
  const [asking, setAsking] = useState<number | null>(null);
  const [read, setRead] = useState<Record<number, Letter>>({});
  const holder = holders.find((h) => h.x === asking);
  const order = holders.filter((h) => read[h.x]);

  return (
    <>
      <div className="envelopes">
        {holders.map((h) => {
          const buddy = buddies.get(h.x)!;
          const isOpen = !!read[h.x];
          const first = h.name.split(/\s+/)[0];
          return (
            <div key={h.x} className={`envelope-wrap${isOpen ? ' opened' : ''}${asking === h.x ? ' asking' : ''}`}>
              <div className="envelope" aria-hidden="true">
                <span className="envelope-buddy">
                  <Ghost costume={buddy.costume} emblem={buddy.emblem} tilt={buddy.tilt} mood={isOpen || asking === h.x ? 'happy' : 'open'} size={64} phase={h.x * 0.7} />
                </span>
                <span className="envelope-hands">
                  <GhostHand costume={buddy.costume} size={17} />
                  <GhostHand costume={buddy.costume} size={17} />
                </span>
                <div className="envelope-back" />
                <div className="envelope-letter">{isOpen && <span className="envelope-line">{read[h.x]!.text.trim().split('\n')[0]}</span>}</div>
                <div className="envelope-front">
                  <span className="envelope-to">
                    for <span className="full-name">{h.name}</span>
                    <span className="first-name">{first}</span>
                  </span>
                </div>
                <div className="envelope-flap">
                  <span className="envelope-seal">
                    <WaxSeal initials={initialsOf(jar.owner)} size={46} state={isOpen ? 'broken' : 'whole'} />
                  </span>
                </div>
              </div>
              {isOpen ? (
                <a className="btn small" href={`#letter-${h.x}`} onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(`letter-${h.x}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}>
                  Read {first}’s letter
                </a>
              ) : (
                <button type="button" className="btn small" aria-expanded={asking === h.x} onClick={() => setAsking(asking === h.x ? null : h.x)}>
                  Open with {first}’s seal
                </button>
              )}
            </div>
          );
        })}
      </div>

      {holder && !read[holder.x] && (
        <SealEntry
          key={holder.x}
          jar={jar}
          opened={opened}
          holder={holder}
          onOpen={(letter) => {
            setRead({ ...read, [holder.x]: letter });
            setAsking(null);
          }}
        />
      )}

      {order.map((h) => {
        const letter = read[h.x]!;
        return (
          <article key={h.x} id={`letter-${h.x}`} className="letter">
            <p className="paper-tag">for {letter.to}</p>
            <Paragraphs text={letter.text} start={900} step={260} />
          </article>
        );
      })}
    </>
  );
}

function SealEntry({ jar, opened, holder, onOpen }: { jar: JarFile; opened: OpenedJar; holder: JarHolder; onOpen: (letter: Letter) => void }) {
  const demoCard = isDemo(jar) ? DEMO_CARDS.find((c) => c.name === holder.name) : undefined;
  const firstName = holder.name.split(/\s+/)[0];

  const tryOpen = async (text: string): Promise<string | null> => {
    let card;
    try {
      card = parseCard(text);
    } catch (e) {
      return e instanceof CardError ? e.message : 'That seal could not be read.';
    }
    if (card.kind !== 'seal') return 'That’s a card, not a private seal. A letter opens with the smaller half cut from its reader’s card.';
    if (card.x !== holder.x) return `That seal belongs to someone else. This letter is for ${firstName}.`;
    try {
      const l = await openLetter(jar, opened, card);
      sound.crack();
      setTimeout(() => sound.chime(), 300);
      onOpen(l);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : 'That seal didn’t open the letter.';
    }
  };

  return (
    <div className="card envelope-input pop">
      <p className="envelope-input-title">{firstName}’s private seal</p>
      {demoCard && (
        <button type="button" className="btn small primary" onClick={() => void tryOpen(demoCard.seal)}>
          Use {firstName}’s seal from the demo
        </button>
      )}
      <CardInput kind="seal" onCard={tryOpen} />
    </div>
  );
}
