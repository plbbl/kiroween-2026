import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { emptyContent, sealJar, validateSealInput, type JarContent, type SealResult } from '../../core/jar.ts';
import { Sparkles } from '../../ui/art/Decor.tsx';
import { Ghost } from '../../ui/art/Ghost.tsx';
import { Jar } from '../../ui/art/Jar.tsx';
import { initialsOf, type WaxState } from '../../ui/art/WaxSeal.tsx';
import { capitalised, numberWord, plural } from '../../ui/text.ts';
import { useAtmosphere, wait } from '../../ui/shell.tsx';
import { sound } from '../../ui/sound.ts';
import { Sealed } from './Sealed.tsx';
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
    art: (
      <span className="art-trio">
        <Ghost costume="bat" size={56} float phase={0.3} />
        <Ghost costume="sheet" mood="happy" size={70} float phase={1} />
        <Ghost costume="franken" size={56} float phase={1.7} />
      </span>
    ),
  },
  {
    label: 'Seal',
    title: (d) => `Ready, ${d.owner.trim().split(/\s+/)[0] || 'friend'}?`,
    sub: 'Once sealed, the cards are made. You will print them next.',
    art: null,
  },
];

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

export function Seal() {
  useAtmosphere('day');
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [step, setStep] = useState(0);
  const [reached, setReached] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [wax, setWax] = useState<WaxState | 'none'>('none');
  const [corked, setCorked] = useState(false);
  const [burst, setBurst] = useState(0);
  const [result, setResult] = useState<SealResult | null>(null);
  const [error, setError] = useState('');

  const input = useMemo(
    () => ({
      owner: draft.owner,
      content: draft.content,
      threshold: draft.threshold,
      holders: draft.holders.map((h) => ({ name: h.name, letter: h.writing ? h.letter : '' })),
    }),
    [draft],
  );
  const problems = validateSealInput(input);

  // Nothing is stored anywhere, so ask before the page is closed.
  useEffect(() => {
    if (result || !(draft.owner || draft.content.message)) return;
    const on = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', on);
    return () => window.removeEventListener('beforeunload', on);
  }, [draft, result]);

  const goTo = (n: number) => {
    setDirection(n >= step ? 1 : -1);
    setStep(n);
    setReached((r) => Math.max(r, n));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const canContinue = step === 0 ? draft.owner.trim().length > 0 : step === 4 ? problems.length === 0 : true;
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
    const sealing = sealJar(input);
    sealing.catch(() => undefined); // handled below, once the wax is down
    await wait(380);
    setWax('pressing');
    sound.thud();
    setTimeout(() => setBurst((b) => b + 1), 420);
    try {
      const [sealed] = await Promise.all([sealing, wait(1700)]);
      setResult(sealed);
      window.scrollTo({ top: 0 });
    } catch (e) {
      setCorked(false);
      setWax('none');
      setError(e instanceof Error ? e.message : 'The jar could not be sealed.');
    }
  };

  if (result) return <Sealed result={result} />;

  const current = STEPS[step]!;
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
                  disabled={i > reached}
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
            {step === 4 && <StepCircle draft={draft} setDraft={setDraft} />}
            {step === 5 && (
              <div className="seal-stage">
                <ul className="summary" aria-label="What goes in the jar">
                  {[
                    [draft.content.message.trim() ? draft.content.message.trim().split(/\s+/).length : 0, 'word for everyone', 'words for everyone'],
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
                  <Jar initials={initialsOf(draft.owner)} wax={wax} corked={corked} state={wax === 'pressing' ? 'sealed' : 'stirring'} warmth={0.5} size={220} />
                  <Sparkles burst={burst} radius={130} count={16} />
                </div>
                <button type="button" className="btn primary big" onClick={seal} disabled={corked}>
                  {corked ? 'Sealing…' : 'Seal the jar'}
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
          {step === 4 && problems.length > 0 && !problems[0]!.includes('same name') && (
            <p className="error" role="status">
              {problems[0]}
            </p>
          )}

          {step < 5 && (
            <div className="step-nav">
              {step > 0 ? (
                <button type="button" className="text-btn quiet" onClick={() => goTo(step - 1)}>
                  ← Back
                </button>
              ) : (
                <span />
              )}
              <button type="button" className="btn primary" onClick={() => goTo(step + 1)} disabled={!canContinue}>
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
