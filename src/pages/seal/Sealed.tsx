import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { circleBuddies } from '../../core/buddy.ts';
import { verifyCircle, type CircleCheck, type SealResult } from '../../core/jar.ts';
import { Sparkles } from '../../ui/art/Decor.tsx';
import { EmblemIcon } from '../../ui/art/Emblem.tsx';
import { Jar } from '../../ui/art/Jar.tsx';
import { initialsOf } from '../../ui/art/WaxSeal.tsx';
import { BuddyCard, EnvelopeMark, PrintableCard } from '../../ui/components/Cards.tsx';
import { capitalised, numberWord } from '../../ui/text.ts';
import { canMakeGrimoire, download, makeGrimoire, safeFilename } from '../../ui/grimoire.ts';
import { href } from '../../ui/shell.tsx';

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
            <p className="muted">One page per friend. Fold the bottom half in: that is their private seal.</p>
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
            <a className="btn" href={href('watch')}>
              Set the watch
            </a>
          </div>
        </article>
      </section>

      <div className="print-area" aria-hidden="true">
        {cards.map((c, i) => (
          <PrintableCard key={c.x} owner={jar.owner} card={c} buddy={buddies.get(c.x)!} index={i} total={n} threshold={k} />
        ))}
      </div>
    </div>
  );
}
