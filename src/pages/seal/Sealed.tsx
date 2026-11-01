import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import { flushSync } from 'react-dom';
import { circleBuddies } from '../../core/buddy.ts';
import { verifyCircle, type CircleCheck, type JarFile, type SealResult } from '../../core/jar.ts';
import { Candle } from '../../ui/art/Candle.tsx';
import { Sparkles } from '../../ui/art/Decor.tsx';
import { EmblemIcon } from '../../ui/art/Emblem.tsx';
import { Jar } from '../../ui/art/Jar.tsx';
import { initialsOf } from '../../ui/art/WaxSeal.tsx';
import { BuddyCard, EnvelopeMark, PrintableCard, PrintableKey } from '../../ui/components/Cards.tsx';
import { ConfirmButton } from '../../ui/components/Confirm.tsx';
import { capitalised, numberWord } from '../../ui/text.ts';
import { canMakeGrimoire, download, makeGrimoire, safeFilename } from '../../ui/grimoire.ts';
import { href, useFocusOnArrival, useLeaveWarning } from '../../ui/shell.tsx';
import { ApiError, jarHandoff, watchApi, watchAvailable } from '../../ui/watchApi.ts';

function combos(n: number, k: number): number {
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return Math.round(r);
}

export function Sealed({ result, onStartOver, replaces }: { result: SealResult; onStartOver: () => void; replaces?: string }) {
  const { jar, cards } = result;
  const heading = useFocusOnArrival();
  const buddies = useMemo(() => circleBuddies(cards[0]!.shard.jarId, cards.map((c) => c.x)), [cards]);
  const [check, setCheck] = useState<CircleCheck | null>(null);
  const grimoireOk = canMakeGrimoire();
  const base = safeFilename(`${jar.owner}'s jar`);
  const k = jar.threshold;
  const n = cards.length;
  // The cards and the jar exist only in this page's memory until they are printed and downloaded.
  const [printed, setPrinted] = useState(false);
  const [keyPrinted, setKeyPrinted] = useState(false);
  const [saved, setSaved] = useState(false);
  // The key is printed on its own, so it is never handed out with the cards.
  const [printing, setPrinting] = useState<'cards' | 'key'>('cards');
  // A cancelled print dialog looks the same as a finished one, so ask.
  const [checking, setChecking] = useState<'cards' | 'key' | null>(null);
  const print = (what: 'cards' | 'key') => {
    flushSync(() => setPrinting(what));
    window.print();
    setChecking(what);
  };
  const confirmPrinted = () => {
    if (checking === 'cards') setPrinted(true);
    if (checking === 'key') setKeyPrinted(true);
    setChecking(null);
  };
  const missing = [...(printed ? [] : ['print the cards']), ...(keyPrinted ? [] : ['print your key']), ...(saved ? [] : ['download the jar file'])];
  const list = (xs: string[], last = 'or') => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} ${last} ${xs[xs.length - 1]}` : xs[0]);
  useLeaveWarning(
    missing.length ? `You haven’t ${list(missing)} yet. Closing this page forgets them for good. Close anyway?` : null,
    { inApp: false },
  );

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
          <div className="sealed-candle">
            <Candle lit size={70} label="The candle lit for the sealing, still burning" />
          </div>
        </div>
        <h1 className="sealed-title" tabIndex={-1} ref={heading}>
          Sealed!
        </h1>
        <p className="lede">
          {capitalised(numberWord(n))} cards were made; any {numberWord(k)} open the jar. Print them now: it’s the only time you can.
        </p>
        <p className={`proof${check ? (check.ok ? ' ok' : ' bad') : ''}`} role="status">
          <EmblemIcon name="spark" size={18} title="" />
          {!check && `Checking all ${combos(n, k)} ways to gather…`}
          {check?.ok &&
            `Checked: all ${check.opened} groups of ${numberWord(k)} open it${k > 2 ? `, and none of the ${check.refused} groups of ${numberWord(k - 1)} can` : ', and no one can alone'}.`}
          {check && !check.ok && 'Something is wrong with these cards. Please seal the jar again.'}
        </p>
        <p className="still-to-do" role="status">
          {missing.length ? `Before you close this page: ${list(missing, 'and')}.` : 'All done. You can close this page.'}
        </p>
        {replaces && (
          <p className="faint replaces">
            This jar replaces your earlier one. Its cards still open the old jar file: ask for them back, and change any password in it that
            someone shouldn’t have.
          </p>
        )}
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
            <h3>Print the cards, then your key</h3>
            <p className="muted">
              One page per friend: cut on the line and give both halves. Your key prints on its own: it opens everything, so keep it apart.
            </p>
            <div className="print-buttons">
              <button type="button" className={`btn${printed ? '' : ' primary'}`} onClick={() => print('cards')}>
                {printed ? 'Print the cards again' : 'Print the cards'}
              </button>
              <button type="button" className={`btn${printed && !keyPrinted ? ' primary' : ''}`} onClick={() => print('key')}>
                {keyPrinted ? 'Print your key again' : 'Print your key'}
              </button>
            </div>
            {checking && (
              <div className="print-check" role="group" aria-label="Did it print?">
                <p>{checking === 'cards' ? `Did all ${numberWord(n)} pages come out?` : 'Did your key come out?'}</p>
                <div className="row centered">
                  <button type="button" className="btn small primary" onClick={confirmPrinted}>
                    Yes
                  </button>
                  <button type="button" className="btn small" onClick={() => print(checking)}>
                    Print again
                  </button>
                </div>
              </div>
            )}
          </div>
        </article>
        <article className="todo-item card">
          <span className="todo-num">2</span>
          <div>
            <h3>Give everyone their card and the jar file</h3>
            <p className="muted">
              Email everyone the jar file. It’s safe to send, and opens in any browser, even offline.
            </p>
            <button
              type="button"
              className="btn"
              disabled={!grimoireOk}
              onClick={() => {
                download(`${base}.html`, makeGrimoire(jar), 'text/html');
                setSaved(true);
              }}
            >
              Download the jar
            </button>
            {!grimoireOk && <p className="faint">The jar file can only be made from the built app.</p>}
          </div>
        </article>
        <article className="todo-item card">
          <span className="todo-num">3</span>
          <div>
            <h3>Turn on the watch</h3>
            <p className="muted">Now and then you’re asked if you’re still here. Go quiet, and your friends are asked to look in on you.</p>
            <a className="btn" href={href('watch')} onClick={() => jarHandoff.give(jar)}>
              Set the watch
            </a>
          </div>
        </article>
      </section>

      <p className="center start-over">
        <ConfirmButton
          label="Done? Seal another jar"
          question={`You haven’t ${list(missing)} yet. Seal a new jar and forget this one?`}
          yes="Forget this one"
          no="Stay"
          danger
          ask={missing.length > 0}
          onConfirm={onStartOver}
        />
      </p>

      <div className="print-area" aria-hidden="true">
        {printing === 'cards' ? (
          cards.map((c, i) => (
            <PrintableCard key={c.x} owner={jar.owner} circle={cards.map((x) => x.name)} card={c} buddy={buddies.get(c.x)!} index={i} total={n} threshold={k} />
          ))
        ) : (
          <PrintableKey owner={jar.owner} keyCard={result.key} />
        )}
      </div>
    </div>
  );
}

/** After the owner changed what is inside: the same cards, a new jar file. */
export function Updated({ jar }: { jar: JarFile }) {
  const grimoireOk = canMakeGrimoire();
  const heading = useFocusOnArrival();
  // The version and the day in the name, so the newest file is easy to tell apart.
  const base = safeFilename(`${jar.owner}'s jar, version ${jar.revision ?? 2} (${jar.sealedAt.slice(0, 10)})`);
  const [saved, setSaved] = useState(false);
  useLeaveWarning(saved ? null : 'You haven’t downloaded the new jar file yet. Leaving forgets it, and you would need to make the change again. Leave anyway?');
  const first = jar.owner.split(/\s+/)[0];
  const [service, setService] = useState<boolean | null>(null);
  useEffect(() => {
    void watchAvailable().then(setService);
  }, []);
  return (
    <div className="page sealed-page">
      <section className="narrow center sealed-hero">
        <div className="sealed-jar pop">
          <Jar initials={initialsOf(jar.owner)} size={250} warmth={0.6} />
          <Sparkles burst="updated" radius={150} count={18} />
          <div className="sealed-candle">
            <Candle lit size={70} label="The candle lit for the sealing, still burning" />
          </div>
        </div>
        <h1 className="sealed-title" tabIndex={-1} ref={heading}>
          Updated!
        </h1>
        <p className="lede">
          Version {jar.revision ?? 2} of {first}’s jar. Every card still opens it, and nothing new needs printing. Keep your key for next time.
        </p>
      </section>

      <section className={`todo wrap ${service ? 'todo-two' : 'todo-one'}`}>
        <article className="todo-item card">
          {service && <span className="todo-num">1</span>}
          <div>
            <h3>Send the new jar file</h3>
            <p className="muted">Email it to the same friends, and ask them to delete the old one: it still opens with the cards, but shows the old words.</p>
            <button
              type="button"
              className="btn primary"
              disabled={!grimoireOk}
              onClick={() => {
                download(`${base}.html`, makeGrimoire(jar), 'text/html');
                setSaved(true);
              }}
            >
              Download the jar
            </button>
            {!grimoireOk && <p className="faint">The jar file can only be made from the built app.</p>}
          </div>
        </article>
        {service && <WatchCopy jar={jar} />}
      </section>
    </div>
  );
}

/** If the watch keeps a copy of the jar, replace it with the new version here. */
function WatchCopy({ jar }: { jar: JarFile }) {
  const [link, setLink] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [error, setError] = useState('');
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
        {state === 'done' && <p className="muted">Done. Your friends’ links now open this version.</p>}
        {state !== 'done' && (
          <form className="watch-copy" onSubmit={give}>
            <p className="muted">Does a watch keep a copy of your jar? Paste its manage link to give it this version.</p>
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
