import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { circleBuddies, circleCostumes } from '../../core/buddy.ts';
import { randomBytes } from '../../core/bytes.ts';
import { JAR_ID_LENGTH, type KeyCard } from '../../core/cards.ts';
import { emptyContent, jarIdBytes, resealJar, sealJar, validateSealInput, type JarContent, type JarFile, type OwnedJar, type SealResult } from '../../core/jar.ts';
import { Sparkles } from '../../ui/art/Decor.tsx';
import { Ghost } from '../../ui/art/Ghost.tsx';
import { Jar } from '../../ui/art/Jar.tsx';
import { initialsOf, type WaxState } from '../../ui/art/WaxSeal.tsx';
import { capitalised, numberWord, plural } from '../../ui/text.ts';
import { useAtmosphere, useLeaveWarning, wait } from '../../ui/shell.tsx';
import { sound } from '../../ui/sound.ts';
import { Sealed, Updated } from './Sealed.tsx';
import { OpenForUpdate } from './Update.tsx';
import { StepCircle, StepLeave, StepMessage, StepName, StepWishes, type Draft } from './Steps.tsx';

const STEPS: { label: string; title: (d: Draft) => string; sub: string; art: ReactNode }[] = [
  {
    label: 'You',
    title: () => 'Hi! Whose jar is this?',
    sub: 'A little ghost will keep what you write here, safe in a jar.',
    art: <Ghost mood="happy" size={86} float />,
  },
  {
    label: 'Note',
    title: () => 'A note for everyone',
    sub: 'Everyone in your circle will read this first.',
    art: <Ghost mood="wink" costume="bow" size={86} float />,
  },
  {
    label: 'Things',
    title: () => 'The things only you know',
    sub: 'Accounts, how to get in, and where things are kept.',
    art: <Ghost mood="open" costume="witch" size={86} float emblem="key" />,
  },
  {
    label: 'Wishes',
    title: () => 'How you’d like things done',
    sub: 'Gentle instructions for the people left to do them.',
    art: <Ghost mood="happy" costume="pumpkin" size={86} float />,
  },
  {
    label: 'Circle',
    title: () => 'Who keeps the cards?',
    sub: 'One card each, for people who would come if you needed them.',
    art: <Ghost mood="happy" size={86} float emblem="heart" />,
  },
  {
    label: 'Seal',
    title: (d) => `Ready, ${d.owner.trim().split(/\s+/)[0] || 'friend'}?`,
    sub: 'Once sealed, the cards are made. You will print them next.',
    art: null,
  },
];

// When updating, the circle and the name are fixed: only these two steps read differently.
const UPDATE_STEPS: Partial<Record<number, (typeof STEPS)[number]>> = {
  4: {
    ...STEPS[4]!,
    title: () => 'Letters for your circle',
    sub: 'The circle stays the same, so every card still works. To change who holds one, seal a new jar.',
  },
  5: {
    ...STEPS[5]!,
    title: (d) => `Ready, ${d.owner.trim().split(/\s+/)[0] || 'friend'}?`,
    sub: 'The same cards will open the new words. Nothing new to print.',
  },
};

/** A jar opened by its owner with their key, to seal new words into it. */
export interface Existing {
  jar: JarFile;
  key: KeyCard;
  owned: OwnedJar;
}

function draftFrom({ jar, owned }: Existing): Draft {
  return {
    owner: jar.owner,
    content: owned.content,
    holders: jar.holders.map((h) => ({ name: h.name, letter: owned.letters[h.x] ?? '', writing: !!owned.letters[h.x] })),
    threshold: jar.threshold,
  };
}

function initialDraft(): Draft {
  return {
    owner: '',
    content: emptyContent(),
    holders: [
      { name: '', letter: '', writing: false },
      { name: '', letter: '', writing: false },
      { name: '', letter: '', writing: false },
    ],
    threshold: 2,
  };
}

/**
 * A new jar's draft and result outlive a visit to another page (to look at
 * the watch, say), but only in this page's memory: nothing is stored, and
 * closing the tab still forgets everything.
 */
interface Kept {
  /** Chosen at the start, so each friend's ghost on the circle step is the one on their card. */
  jarId: Uint8Array;
  draft: Draft;
  step: number;
  reached: number;
  result: SealResult | null;
}
let kept: Kept | null = null;

export function Seal({ params, embedded }: { params: URLSearchParams; embedded: JarFile | null }) {
  useAtmosphere('day');
  const [existing, setExisting] = useState<Existing | null>(null);
  const [fresh, setFresh] = useState(0);
  if (params.has('update') && !existing) return <OpenForUpdate jar={embedded} onOpen={setExisting} />;
  const startOver = () => {
    kept = null;
    setFresh((n) => n + 1);
  };
  return <Wizard existing={existing} key={existing?.jar.jarId ?? `new-${fresh}`} onStartOver={startOver} />;
}

function Wizard({ existing, onStartOver }: { existing: Existing | null; onStartOver: () => void }) {
  const updating = existing !== null;
  const memory = updating ? null : kept;
  const [jarId] = useState(() => (existing ? jarIdBytes(existing.jar) : (memory?.jarId ?? randomBytes(JAR_ID_LENGTH))));
  const costumes = useMemo(() => {
    if (!existing) return circleCostumes(jarId);
    const buddies = circleBuddies(jarId, existing.jar.holders.map((h) => h.x));
    return existing.jar.holders.map((h) => buddies.get(h.x)!.costume);
  }, [existing, jarId]);
  const [draft, setDraft] = useState<Draft>(() => (existing ? draftFrom(existing) : (memory?.draft ?? initialDraft())));
  const [step, setStep] = useState(updating ? 1 : (memory?.step ?? 0));
  const [reached, setReached] = useState(updating ? STEPS.length - 1 : (memory?.reached ?? 0));
  const [direction, setDirection] = useState<1 | -1>(1);
  const [wax, setWax] = useState<WaxState | 'none'>('none');
  const [corked, setCorked] = useState(false);
  const [burst, setBurst] = useState(0);
  const [result, setResult] = useState<SealResult | null>(memory?.result ?? null);
  const [updated, setUpdated] = useState<JarFile | null>(null);
  useEffect(() => {
    if (!updating) kept = { jarId, draft, step, reached, result };
  }, [updating, jarId, draft, step, reached, result]);
  const [error, setError] = useState('');

  const input = useMemo(
    () => ({
      owner: draft.owner,
      content: draft.content,
      threshold: draft.threshold,
      holders: draft.holders.map((h) => ({ name: h.name, letter: h.writing ? h.letter : '' })),
      jarId,
    }),
    [draft, jarId],
  );
  const problems = validateSealInput(input);

  // Nothing is stored anywhere, so ask before the tab is closed. Moving to
  // another page is safe: a new jar's draft is kept in memory (an update's
  // is not, so leaving an update asks too).
  const [original] = useState(() => JSON.stringify(draft));
  const unsaved = updating ? JSON.stringify(draft) !== original : !!(draft.owner || draft.content.message);
  useLeaveWarning(!result && !updated && unsaved ? 'What you wrote is not sealed yet, and is not saved anywhere. Leave anyway?' : null, {
    inApp: updating,
  });

  const goTo = (n: number) => {
    setDirection(n >= step ? 1 : -1);
    setStep(n);
    setReached((r) => Math.max(r, n));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // On the circle step, Next stays available and explains what is missing only when pressed.
  const [tried, setTried] = useState(false);
  const canContinue = step === 0 ? draft.owner.trim().length > 0 : true;
  const next = () => {
    if (step === 4 && problems.length) {
      setTried(true);
      return;
    }
    goTo(step + 1);
  };
  const setContent = (patch: Partial<JarContent>) => setDraft((d) => ({ ...d, content: { ...d.content, ...patch } }));

  const seal = async () => {
    setError('');
    if (problems.length) {
      setError(problems[0]!);
      return;
    }
    // The cork drops in, the wax is stamped, the ghost falls asleep.
    setCorked(true);
    setTimeout(() => sound.cork(), 260);
    const sealing: Promise<SealResult | JarFile> = existing
      ? resealJar(existing.jar, existing.key, {
          content: draft.content,
          letters: Object.fromEntries(existing.jar.holders.map((h, i) => [h.x, draft.holders[i]!.writing ? draft.holders[i]!.letter : ''])),
        })
      : sealJar(input);
    sealing.catch(() => undefined); // handled below, once the wax is down
    await wait(380);
    setWax('pressing');
    sound.thud();
    setTimeout(() => setBurst((b) => b + 1), 420);
    try {
      const [sealed] = await Promise.all([sealing, wait(1700)]);
      if ('cards' in sealed) setResult(sealed);
      else setUpdated(sealed);
      window.scrollTo({ top: 0 });
    } catch (e) {
      setCorked(false);
      setWax('none');
      setError(e instanceof Error ? e.message : 'The jar could not be sealed.');
    }
  };

  if (result) return <Sealed result={result} onStartOver={onStartOver} />;
  if (updated) return <Updated jar={updated} />;

  const current = updating ? (UPDATE_STEPS[step] ?? STEPS[step]!) : STEPS[step]!;
  const progress = step / (STEPS.length - 1);

  return (
    <div className="page seal-page">
      <div className="narrow">
        <div className="trail" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
          <div className="trail-track">
            <div className="trail-fill" style={{ width: `${progress * 100}%` }} />
          </div>
          <div className="trail-ghost" style={{ left: `${progress * 100}%` }} aria-hidden="true">
            <Ghost mood="happy" size={52} float />
          </div>
          <ol className="trail-steps">
            {STEPS.map((s, i) => (
              <li key={s.label} style={{ left: `${(i / (STEPS.length - 1)) * 100}%` }}>
                <button
                  type="button"
                  className={`trail-dot${i <= step ? ' done' : ''}${i === step ? ' current' : ''}`}
                  disabled={i > reached || (updating && i === 0)}
                  onClick={() => goTo(i)}
                  aria-current={i === step ? 'step' : undefined}
                  aria-label={`Step ${i + 1}: ${s.label}`}
                />
                <span className="trail-label">{s.label}</span>
              </li>
            ))}
          </ol>
        </div>

        <section className={`step-card card ${direction > 0 ? 'enter-right' : 'enter-left'}`} key={step} aria-labelledby="step-title">
          {current.art && <div className="step-art">{current.art}</div>}
          <p className="tag">
            step {step + 1} of {STEPS.length}
          </p>
          <h1 id="step-title" className="step-title">
            {current.title(draft)}
          </h1>
          <p className="lede">{current.sub}</p>

          <div className="step-body stack" style={{ '--gap': '18px' } as CSSProperties}>
            {step === 0 && <StepName draft={draft} setOwner={(owner) => setDraft({ ...draft, owner })} />}
            {step === 1 && <StepMessage content={draft.content} setContent={setContent} />}
            {step === 2 && <StepLeave content={draft.content} setContent={setContent} />}
            {step === 3 && <StepWishes content={draft.content} setContent={setContent} />}
            {step === 4 && <StepCircle draft={draft} setDraft={setDraft} locked={updating} costumes={costumes} />}
            {step === 5 && (
              <div className="seal-stage">
                <ul className="summary" aria-label="What goes in the jar">
                  {[
                    [draft.content.message.trim() ? draft.content.message.trim().split(/\s+/).length : 0, 'word in your note', 'words in your note'],
                    [draft.content.accounts.length, 'account'],
                    [draft.content.documents.length, 'place'],
                    [Object.values(draft.content.wishes).filter((w) => w.trim()).length, 'wish', 'wishes'],
                    [draft.holders.filter((h) => h.writing && h.letter.trim()).length, 'private letter'],
                  ]
                    .filter(([n]) => (n as number) > 0)
                    .map(([n, one, many]) => (
                      <li key={one as string}>
                        <b>{n}</b> {plural(n as number, one as string, many as string | undefined)}
                      </li>
                    ))}
                  <li>
                    <b>{capitalised(numberWord(draft.threshold))}</b> of {numberWord(draft.holders.length)} to open
                  </li>
                </ul>
                <div className="seal-jar">
                  <Jar initials={initialsOf(draft.owner)} wax={wax} corked={corked} state={wax === 'pressing' ? 'sealed' : 'stirring'} warmth={0.5} size={180} />
                  <Sparkles burst={burst} radius={130} count={16} />
                </div>
                <button type="button" className="btn primary big" onClick={seal} disabled={corked}>
                  {corked ? 'Sealing…' : updating ? 'Seal the new words' : 'Seal the jar'}
                </button>
                {error && (
                  <p className="error" role="alert">
                    {error}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* A repeated name is pointed out next to the name itself. */}
          {step === 4 && tried && problems.length > 0 && !problems[0]!.includes('same name') && (
            <p className="error" role="status">
              {problems[0]}
            </p>
          )}

          {step < 5 && (
            <div className="step-nav">
              {step > (updating ? 1 : 0) ? (
                <button type="button" className="text-btn quiet" onClick={() => goTo(step - 1)}>
                  ← Back
                </button>
              ) : (
                <span />
              )}
              <button type="button" className="btn primary" onClick={next} disabled={!canContinue}>
                {step === 4 ? 'Almost done →' : 'Next →'}
              </button>
            </div>
          )}
          {step === 5 && (
            <div className="step-nav">
              <button type="button" className="text-btn quiet" onClick={() => goTo(4)}>
                ← Back
              </button>
              <span />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
