import { useState, type CSSProperties } from 'react';
import type { Buddy, Emblem } from '../../core/buddy.ts';
import { CardError, parseCard } from '../../core/cards.ts';
import { openLetter, type JarFile, type JarHolder, type Letter, type OpenedJar } from '../../core/jar.ts';
import { DEMO_CARDS, isDemo } from '../../demo/demo.ts';
import { Sparkles } from '../../ui/art/Decor.tsx';
import { EmblemIcon } from '../../ui/art/Emblem.tsx';
import { Ghost, GhostHand } from '../../ui/art/Ghost.tsx';
import { Jar } from '../../ui/art/Jar.tsx';
import { WaxSeal, initialsOf } from '../../ui/art/WaxSeal.tsx';
import { CardInput } from '../../ui/components/CardInput.tsx';
import { href } from '../../ui/shell.tsx';
import { sound } from '../../ui/sound.ts';

const WISH_LABELS: Record<string, string> = {
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

function names(list: string[]): string {
  const first = list.map((n) => n.split(/\s+/)[0]!);
  return first.length > 1 ? `${first.slice(0, -1).join(', ')} & ${first[first.length - 1]}` : (first[0] ?? '');
}

export function Reveal({ jar, opened, circle, buddies }: { jar: JarFile; opened: OpenedJar; circle: string[]; buddies: Map<number, Buddy> }) {
  const c = opened.content;
  const first = jar.owner.split(/\s+/)[0] ?? jar.owner;
  const wishes = WISHES.filter(([k]) => c.wishes[k].trim());
  const letters = jar.holders.filter((h) => h.hasLetter);

  return (
    <div className="page reveal-page">
      <header className="narrow center reveal-head">
        <div className="reveal-jar">
          <Jar initials={initialsOf(jar.owner)} state="open" wax="broken" warmth={1} notes={false} size={150} label={`${first}’s jar, open`} />
          <Sparkles burst="reveal" radius={120} count={14} />
        </div>
        <p className="tag rise">opened by {names(circle)}</p>
        <h1 className="rise" style={{ '--d': '120ms' } as CSSProperties}>
          {first} left you this
        </h1>
      </header>

      <div className="narrow reveal-body">
        {c.message.trim() && (
          <article className="paper message rise" style={{ '--d': '300ms' } as CSSProperties}>
            <p className="paper-tag">to everyone</p>
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
                  {a.login && <code className="login">{a.login}</code>}
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
            <p className="center muted">Each one opens only with the private seal folded inside its reader’s card.</p>
            <div className="envelopes">
              {letters.map((h) => (
                <Envelope key={h.x} jar={jar} opened={opened} holder={h} buddy={buddies.get(h.x)!} />
              ))}
            </div>
          </section>
        )}

        <section className="center after">
          <Ghost costume="sheet" mood="happy" size={70} float />
          <p className="muted">There is a gentle checklist for the days that follow.</p>
          <div className="row centered">
            <a className="btn primary" href={`${href('guides')}#after`}>
              For the days that follow
            </a>
            <button type="button" className="btn" onClick={() => window.location.reload()}>
              Close the jar
            </button>
          </div>
          <p className="faint">Closing forgets everything that was opened. Nothing was saved.</p>
        </section>
      </div>
    </div>
  );
}

function Envelope({ jar, opened, holder, buddy }: { jar: JarFile; opened: OpenedJar; holder: JarHolder; buddy: Buddy }) {
  const [letter, setLetter] = useState<Letter | null>(null);
  const [asking, setAsking] = useState(false);
  const demoCard = isDemo(jar) ? DEMO_CARDS.find((c) => c.name === holder.name) : undefined;
  const firstName = holder.name.split(/\s+/)[0];

  const tryOpen = async (text: string): Promise<string | null> => {
    let card;
    try {
      card = parseCard(text);
    } catch (e) {
      return e instanceof CardError ? e.message : 'That seal could not be read.';
    }
    if (card.kind !== 'seal') return 'That’s the outside of a card. This needs the private seal from the inside.';
    if (card.x !== holder.x) return `That seal belongs to someone else. This letter is for ${firstName}.`;
    try {
      const l = await openLetter(jar, opened, card);
      sound.crack();
      setTimeout(() => sound.chime(), 300);
      setLetter(l);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : 'That seal didn’t open the letter.';
    }
  };

  return (
    <div className={`envelope-wrap${letter ? ' opened' : ''}${letter || asking ? ' wide' : ''}`}>
      <div className="envelope" aria-hidden={!!letter}>
        <span className="envelope-buddy">
          <Ghost costume={buddy.costume} emblem={buddy.emblem} tilt={buddy.tilt} mood={asking ? 'happy' : 'open'} size={64} phase={holder.x * 0.7} />
        </span>
        <span className="envelope-hands" aria-hidden="true">
          <GhostHand costume={buddy.costume} size={17} />
          <GhostHand costume={buddy.costume} size={17} />
        </span>
        <div className="envelope-back" />
        <div className="envelope-front">
          <span className="envelope-to">for {holder.name}</span>
        </div>
        <div className="envelope-flap">
          <span className="envelope-seal">
            <WaxSeal initials={initialsOf(jar.owner)} size={46} state={letter ? 'broken' : 'whole'} />
          </span>
        </div>
      </div>
      {letter && (
        <article className="letter">
          <span className="letter-buddy">
            <Ghost costume={buddy.costume} emblem={buddy.emblem} tilt={buddy.tilt} mood="happy" size={64} float />
          </span>
          <p className="paper-tag">for {letter.to}</p>
          <Paragraphs text={letter.text} start={1500} step={260} />
        </article>
      )}
      {!letter && !asking && (
        <button type="button" className="btn small" onClick={() => setAsking(true)}>
          Open with {firstName}’s seal
        </button>
      )}
      {!letter && asking && (
        <div className="card envelope-input pop">
          {demoCard && (
            <button type="button" className="btn small primary" onClick={() => void tryOpen(demoCard.seal)}>
              Use {firstName}’s seal from the demo
            </button>
          )}
          <CardInput kind="seal" onCard={tryOpen} />
        </div>
      )}
    </div>
  );
}
