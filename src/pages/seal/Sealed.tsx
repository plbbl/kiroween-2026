import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import { circleBuddies } from '../../core/buddy.ts';
import { verifyCircle, type CircleCheck, type JarFile, type SealResult } from '../../core/jar.ts';
import { Sparkles } from '../../ui/art/Decor.tsx';
import { EmblemIcon } from '../../ui/art/Emblem.tsx';
import { Jar } from '../../ui/art/Jar.tsx';
import { initialsOf } from '../../ui/art/WaxSeal.tsx';
import { BuddyCard, EnvelopeMark, PrintableCard, PrintableKey } from '../../ui/components/Cards.tsx';
import { capitalised, numberWord } from '../../ui/text.ts';
import { canMakeGrimoire, download, makeGrimoire, safeFilename } from '../../ui/grimoire.ts';
import { href } from '../../ui/shell.tsx';
import { ApiError, jarHandoff, watchApi, watchAvailable } from '../../ui/watchApi.ts';

function combos(n: number, k: number): number {
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return Math.round(r);
}

export function Sealed({ result }: { result: SealResult }) {
  const { jar, cards } = result;
  const buddies = useMemo(() => circleBuddies(cards[0]!.shard.jarId, cards.map((c) => c.x)), [cards]);
  const [check, setCheck] = useState<CircleCheck | null>(null);
  const grimoireOk = canMakeGrimoire();
  const base = safeFilename(`${jar.owner}'s jar`);
  const k = jar.threshold;
  const n = cards.length;

  useEffect(() => {
    let live = true;
    void verifyCircle(jar, cards).then((c) => live && setCheck(c));
    return () => {
      live = false;
    };
  }, [jar, cards]);

  return (
    <div className="page sealed-page">
      <section className="narrow center sealed-hero">
        <div className="sealed-jar pop">
          <Jar initials={initialsOf(jar.owner)} size={250} warmth={0.6} />
          <Sparkles burst="sealed" radius={150} count={18} />
        </div>
        <h1 className="sealed-title">Sealed!</h1>
        <p className="lede">
          {capitalised(numberWord(n))} cards were made. Any {numberWord(k)} of them open the jar. This is the only time they can be printed.
        </p>
        <p className={`proof${check ? (check.ok ? ' ok' : ' bad') : ''}`} role="status">
          <EmblemIcon name="spark" size={18} title="" />
          {!check && `Checking all ${combos(n, k)} ways to gather…`}
          {check?.ok &&
            `Checked: all ${check.opened} groups of ${numberWord(k)} open it${k > 2 ? `, and none of the ${check.refused} groups of ${numberWord(k - 1)} can` : ', and no one can alone'}.`}
          {check && !check.ok && 'Something is wrong with these cards. Please seal the jar again.'}
        </p>
      </section>

      <section className="fan wrap" aria-label="The cards">
        {cards.map((c, i) => {
          const mid = (n - 1) / 2;
          return (
            <BuddyCard
              key={c.x}
              name={c.name}
              buddy={buddies.get(c.x)!}
              index={i}
              total={n}
              note={c.hasLetter ? `${c.name} has a private letter` : undefined}
              className="fan-card pop"
              style={{ '--rot': `${(i - mid) * 7}deg`, '--lift': `${Math.abs(i - mid) * 12}px`, '--d': `${200 + i * 110}ms` } as CSSProperties}
            />
          );
        })}
      </section>
      {cards.some((c) => c.hasLetter) && (
        <p className="fan-legend faint">
          <span className="buddy-card-note">
            <EnvelopeMark />
          </span>
          a private letter, opened with that card’s seal
        </p>
      )}

      <section className="todo wrap">
        <article className="todo-item card">
          <span className="todo-num">1</span>
          <div>
            <h3>Print the cards</h3>
            <p className="muted">One page per friend, folded so the seal is inside. And one page for you: your key, to change the jar later.</p>
            <button type="button" className="btn primary" onClick={() => window.print()}>
              Print the cards
            </button>
          </div>
        </article>
        <article className="todo-item card">
          <span className="todo-num">2</span>
          <div>
            <h3>Give everyone the jar file</h3>
            <p className="muted">One small file with this app and your locked jar inside. It opens offline. It is safe to email.</p>
            <div className="row">
              <button type="button" className="btn" disabled={!grimoireOk} onClick={() => download(`${base}.html`, makeGrimoire(jar), 'text/html')}>
                Download the jar
              </button>
              <button type="button" className="text-btn" onClick={() => download(`${base}.json`, JSON.stringify(jar, null, 2), 'application/json')}>
                or just the data
              </button>
            </div>
            {!grimoireOk && <p className="faint">The jar file can only be made from the built app.</p>}
          </div>
        </article>
        <article className="todo-item card">
          <span className="todo-num">3</span>
          <div>
            <h3>Turn on the watch</h3>
            <p className="muted">We ask now and then if you are still here, and only ask your friends to check on you if you go quiet.</p>
            <a className="btn" href={href('watch')} onClick={() => jarHandoff.give(jar)}>
              Set the watch
            </a>
          </div>
        </article>
      </section>

      <div className="print-area" aria-hidden="true">
        {cards.map((c, i) => (
          <PrintableCard key={c.x} owner={jar.owner} card={c} buddy={buddies.get(c.x)!} index={i} total={n} threshold={k} />
        ))}
        <PrintableKey owner={jar.owner} keyCard={result.key} />
      </div>
    </div>
  );
}

/** After the owner changed what is inside: the same cards, a new jar file. */
export function Updated({ jar }: { jar: JarFile }) {
  const grimoireOk = canMakeGrimoire();
  const base = safeFilename(`${jar.owner}'s jar`);
  const first = jar.owner.split(/\s+/)[0];
  return (
    <div className="page sealed-page">
      <section className="narrow center sealed-hero">
        <div className="sealed-jar pop">
          <Jar initials={initialsOf(jar.owner)} size={250} warmth={0.6} />
          <Sparkles burst="updated" radius={150} count={18} />
        </div>
        <h1 className="sealed-title">Updated!</h1>
        <p className="lede">
          Version {jar.revision ?? 2} of {first}’s jar. Every card still opens it, and nothing new needs printing. Keep your key for next time.
        </p>
      </section>

      <section className="todo wrap todo-two">
        <article className="todo-item card">
          <span className="todo-num">1</span>
          <div>
            <h3>Send the new jar file</h3>
            <p className="muted">Give it to the same friends. An old file still opens with the cards, but shows the old words.</p>
            <button type="button" className="btn primary" disabled={!grimoireOk} onClick={() => download(`${base}.html`, makeGrimoire(jar), 'text/html')}>
              Download the jar
            </button>
            {!grimoireOk && <p className="faint">The jar file can only be made from the built app.</p>}
          </div>
        </article>
        <WatchCopy jar={jar} />
      </section>
    </div>
  );
}

/** If the watch keeps a copy of the jar, replace it with the new version here. */
function WatchCopy({ jar }: { jar: JarFile }) {
  const [service, setService] = useState<boolean | null>(null);
  const [link, setLink] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [error, setError] = useState('');
  useEffect(() => {
    void watchAvailable().then(setService);
  }, []);

  const give = async (e: FormEvent) => {
    e.preventDefault();
    const token = /manage=([^&\s]+)/.exec(link)?.[1];
    if (!token) {
      setError('Paste the whole manage link from the email that confirmed your watch.');
      return;
    }
    setState('busy');
    setError('');
    try {
      await watchApi.keepJar(decodeURIComponent(token), jar);
      setState('done');
    } catch (err) {
      setState('idle');
      setError(err instanceof ApiError ? err.message : 'The watch service is not answering.');
    }
  };

  return (
    <article className="todo-item card">
      <span className="todo-num">2</span>
      <div>
        <h3>The watch’s copy</h3>
        {service === false && <p className="muted">If a watch keeps a copy of your jar, give it this file from its manage link.</p>}
        {service && state === 'done' && <p className="muted">Done. Your friends’ links now open this version.</p>}
        {service && state !== 'done' && (
          <form className="watch-copy" onSubmit={give}>
            <p className="muted">Does a watch keep a copy of your jar? Paste its manage link, from our email, to give it this version.</p>
            <input type="url" aria-label="Your watch’s manage link" placeholder="https://…#/watch?manage=…" value={link} onChange={(e) => setLink(e.target.value)} />
            <button type="submit" className="btn small" disabled={state === 'busy' || !link.trim()}>
              {state === 'busy' ? 'Giving…' : 'Give it this jar'}
            </button>
            {error && <p className="error">{error}</p>}
          </form>
        )}
      </div>
    </article>
  );
}
