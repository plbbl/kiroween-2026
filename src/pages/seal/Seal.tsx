import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { circleBuddies, circleCostumes } from '../../core/buddy.ts';
import { fromBase32, randomBytes, toBase32 } from '../../core/bytes.ts';
import { JAR_ID_LENGTH, type KeyCard } from '../../core/cards.ts';
import { emptyContent, jarIdBytes, resealJar, sealJar, validateSealInput, type JarContent, type JarFile, type OwnedJar, type SealResult } from '../../core/jar.ts';
import { Candle } from '../../ui/art/Candle.tsx';
import { Pumpkin } from '../../ui/art/Spooky.tsx';
import { Sparkles } from '../../ui/art/Decor.tsx';
import { WatchingGhost } from '../../ui/art/WatchingGhost.tsx';
import { Jar } from '../../ui/art/Jar.tsx';
import { initialsOf, type WaxState } from '../../ui/art/WaxSeal.tsx';
import { capitalised, numberWord, plural } from '../../ui/text.ts';
import { useAtmosphere, useLeaveWarning, wait } from '../../ui/shell.tsx';
import { sound } from '../../ui/sound.ts';
import { Sealed, Updated } from './Sealed.tsx';
import { OpenForUpdate } from './Update.tsx';
import { StepCircle, StepLeave, StepMessage, StepName, StepWishes, type Draft } from './Steps.tsx';

const listNames = (names: string[]) => (names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : (names[0] ?? ''));

const STEPS: { label: string; title: (d: Draft) => string; sub: string }[] = [
  {
    label: 'You',
    title: () => 'Whose jar is this?',
    sub: 'Kept in this tab until you seal it. Never sent.',
  },
  {
    label: 'Note',
    title: () => 'A note for everyone',
    sub: 'Everyone in your circle will read this first.',
  },
  {
    label: 'Things',
    title: () => 'The things only you know',
    sub: 'Accounts, how to get in, where things are. Have your logins at hand.',
  },
  {
    label: 'Wishes',
    title: () => 'How you’d like things done',
    sub: 'Gentle instructions for the people left to do them.',
  },
  {
    label: 'Friends',
    title: () => 'Who keeps the cards?',
    sub: 'One card each, for people who would come.',
  },
  {
    label: 'Seal',
    title: (d) => `Ready, ${d.owner.trim().split(/\s+/)[0] || 'friend'}?`,
    sub: 'Once sealed, the cards are made. You will print them next.',
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
 * the watch, say). The draft (never the cards or the key) also outlives a
 * reload, in this tab's session storage: a phone that drops a tab while you
 * look up a login must not lose an hour of writing. Closing the tab, or
 * starting over, forgets it.
 */
interface Kept {
  /** Chosen at the start, so each friend's ghost on the circle step is the one on their card. */
  jarId: Uint8Array;
  draft: Draft;
  step: number;
  reached: number;
  result: SealResult | null;
  /** Started from an older jar, to change who holds the cards: whose it was. */
  replaces?: string;
}
let kept: Kept | null = null;

const DRAFT_KEY = 'phylactery:draft';

interface StoredDraft {
  jarId: string;
  draft: Draft;
  step: number;
  reached: number;
  /** A jar was sealed from this draft: sealing it again must make a different jar. */
  sealed: boolean;
}

function storeDraft(k: Kept): void {
  try {
    const stored: StoredDraft = { jarId: toBase32(k.jarId), draft: k.draft, step: k.step, reached: k.reached, sealed: !!k.result };
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(stored));
  } catch {
    /* no storage here: the draft lives in memory only */
  }
}

function forgetDraft(): void {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* nothing to forget */
  }
}

function restoredDraft(): Kept | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as StoredDraft;
    if (!s.draft?.content || !Array.isArray(s.draft.holders)) return null;
    // The cards of a jar already sealed are gone with the reload; a new seal is a new jar.
    const jarId = s.sealed ? randomBytes(JAR_ID_LENGTH) : fromBase32(s.jarId);
    return { jarId, draft: s.draft, step: s.sealed ? 5 : s.step, reached: s.reached, result: null };
  } catch {
    return null;
  }
}

/** Rows left empty are not sealed: the family would only see "An account" with nothing in it. */
function withoutEmptyRows(content: JarContent): JarContent {
  return {
    ...content,
    accounts: content.accounts.filter((a) => a.service.trim() || a.login.trim() || a.note.trim()),
    documents: content.documents.filter((d) => d.item.trim() || d.location.trim()),
  };
}

export function Seal({ params, embedded }: { params: URLSearchParams; embedded: JarFile | null }) {
  const [existing, setExisting] = useState<Existing | null>(null);
  const [fresh, setFresh] = useState(0);
  // Left an update for a new jar made from it: the address still says "update".
  const [leftUpdate, setLeftUpdate] = useState(false);
  if (params.has('update') && !existing && !leftUpdate) return <OpenForUpdate jar={embedded} onOpen={setExisting} />;
  const startOver = () => {
    kept = null;
    forgetDraft();
    setFresh((n) => n + 1);
  };
  // Everything written comes along; the circle can change, and the cards will be new.
  const newJarFrom = (draft: Draft, from: JarFile) => {
    kept = { jarId: randomBytes(JAR_ID_LENGTH), draft, step: 4, reached: 5, result: null, replaces: from.owner };
    history.replaceState(null, '', `#/seal`);
    setLeftUpdate(true);
    setExisting(null);
    setFresh((n) => n + 1);
    window.scrollTo({ top: 0 });
  };
  return <Wizard existing={existing} key={existing?.jar.jarId ?? `new-${fresh}`} onStartOver={startOver} onNewJar={newJarFrom} />;
}

function Wizard({
  existing,
  onStartOver,
  onNewJar,
}: {
  existing: Existing | null;
  onStartOver: () => void;
  onNewJar: (draft: Draft, from: JarFile) => void;
}) {
  const updating = existing !== null;
  // What this wizard starts from, read once: a draft kept in memory or in this tab.
  const [memory] = useState(() => (updating ? null : (kept ?? restoredDraft())));
  const replaces = memory?.replaces;
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
  // A new step is announced by moving focus to its title (not on the first one, whose field takes focus).
  const title = useRef<HTMLHeadingElement>(null);
  const firstStep = useRef(true);
  useEffect(() => {
    if (firstStep.current) {
      firstStep.current = false;
      return;
    }
    title.current?.focus({ preventScroll: true });
  }, [step]);
  const [wax, setWax] = useState<WaxState | 'none'>('none');
  // Sealing has begun (the button waits); the cork is in.
  const [corked, setCorked] = useState(false);
  const [corkIn, setCorkIn] = useState(false);
  const [burst, setBurst] = useState(0);
  const [result, setResult] = useState<SealResult | null>(memory?.result ?? null);
  const [updated, setUpdated] = useState<JarFile | null>(null);
  // You write by day. Sealing happens by candlelight, and the sealed jar sleeps under the night sky.
  const [dusk, setDusk] = useState(false);
  const [candleLit, setCandleLit] = useState(false);
  // The ghost says goodnight before the cork goes in.
  const [bedtime, setBedtime] = useState<'night' | 'zzz' | null>(null);
  useAtmosphere(dusk || result || updated ? 'night' : 'day', candleLit ? 0.9 : result || updated ? 0.5 : 0);
  useEffect(() => {
    if (updating) return;
    kept = { jarId, draft, step, reached, result, ...(replaces ? { replaces } : {}) };
    if (draft.owner.trim() || draft.content.message.trim() || draft.holders.some((h) => h.name.trim())) storeDraft(kept);
  }, [updating, jarId, draft, step, reached, result, replaces]);
  const [error, setError] = useState('');

  const input = useMemo(
    () => ({
      owner: draft.owner,
      content: withoutEmptyRows(draft.content),
      threshold: draft.threshold,
      holders: draft.holders.map((h) => ({ name: h.name, letter: h.writing ? h.letter : '' })),
      jarId,
    }),
    [draft, jarId],
  );
  const problems = validateSealInput(input);
  const letterNames = draft.holders.filter((h) => h.writing && h.letter.trim()).map((h) => h.name.trim().split(/\s+/)[0] || 'someone');

  // A new jar's draft survives a reload or a visit to another page, but not
  // closing the tab, so ask then. An update's draft is not kept at all (it
  // came from the key), so leaving an update asks too.
  const [original] = useState(() => JSON.stringify(draft));
  const unsaved = updating ? JSON.stringify(draft) !== original : !!(draft.owner || draft.content.message);
  useLeaveWarning(!result && !updated && unsaved ? 'What you wrote is not sealed yet. Closing this tab forgets it. Leave anyway?' : null, {
    inApp: updating,
  });

  const goTo = (n: number) => {
    if (corked) return;
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
    // Night falls and a candle wakes; then the cork drops in, the wax is
    // stamped, and the ghost falls asleep. The jar is sealed meanwhile.
    const sealing: Promise<SealResult | JarFile> = existing
      ? resealJar(existing.jar, existing.key, {
          content: draft.content,
          letters: Object.fromEntries(existing.jar.holders.map((h, i) => [h.x, draft.holders[i]!.writing ? draft.holders[i]!.letter : ''])),
        })
      : sealJar(input);
    sealing.catch(() => undefined); // handled below, once the wax is down
    setDusk(true);
    setCorked(true);
    sound.strike();
    await wait(520);
    setCandleLit(true);
    sound.ignite();
    setBedtime('night');
    await wait(900);
    setBedtime('zzz');
    setCorkIn(true);
    setTimeout(() => sound.cork(), 260);
    await wait(420);
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
      setCorkIn(false);
      setBedtime(null);
      setCandleLit(false);
      setDusk(false);
      setWax('none');
      setError(e instanceof Error ? e.message : 'The jar could not be sealed.');
    }
  };

  if (result) return <Sealed result={result} onStartOver={onStartOver} replaces={replaces} />;
  if (updated) return <Updated jar={updated} />;

  const current = updating ? (UPDATE_STEPS[step] ?? STEPS[step]!) : STEPS[step]!;
  const progress = step / (STEPS.length - 1);

  return (
    <div className="page seal-page">
      <div className="narrow">
        <div className={`trail${corked ? ' hushed' : ''}`} aria-label={`Step ${step + 1} of ${STEPS.length}`}>
          <div className="trail-track">
            <div className="trail-fill" style={{ width: `${progress * 100}%` }} />
          </div>
          <div className="trail-ghost" style={{ left: `${progress * 100}%` }} aria-hidden="true">
            {/* It keeps an eye on what you write. */}
            <WatchingGhost mood="open" size={52} float />
          </div>
          <ol className="trail-steps">
            {STEPS.map((s, i) => (
              <li key={s.label} style={{ left: `${(i / (STEPS.length - 1)) * 100}%` }}>
                {/* Each step is a jack-o'-lantern on the path: lit once you've been there. */}
                <button
                  type="button"
                  className={`trail-dot${i <= step ? ' done' : ''}${i === step ? ' current' : ''}`}
                  disabled={corked || i > reached || (updating && i === 0)}
                  onClick={() => goTo(i)}
                  aria-current={i === step ? 'step' : undefined}
                  aria-label={`Step ${i + 1}: ${s.label}`}
                >
                  <Pumpkin size={30} lit={i <= step} />
                </button>
                <span className="trail-label">{s.label}</span>
              </li>
            ))}
          </ol>
        </div>

        <section
          className={`step-card card ${direction > 0 ? 'enter-right' : 'enter-left'}${corked ? ' sealing' : ''}`}
          key={step}
          aria-labelledby="step-title"
        >
          <h1 id="step-title" className="step-title" tabIndex={-1} ref={title}>
            {!corked ? current.title(draft) : wax === 'pressing' ? 'Sealed.' : corkIn ? 'Corked…' : 'By candlelight…'}
          </h1>
          <p className="lede">{current.sub}</p>

          <div className="step-body stack" style={{ '--gap': '18px' } as CSSProperties}>
            {step === 0 && <StepName draft={draft} setOwner={(owner) => setDraft({ ...draft, owner })} />}
            {step === 1 && <StepMessage content={draft.content} setContent={setContent} />}
            {step === 2 && <StepLeave content={draft.content} setContent={setContent} />}
            {step === 3 && <StepWishes content={draft.content} setContent={setContent} />}
            {step === 4 && (
              <StepCircle draft={draft} setDraft={setDraft} locked={updating} costumes={costumes} onNewJar={existing ? () => onNewJar(draft, existing.jar) : undefined} />
            )}
            {step === 5 && (
              <div className="seal-stage">
                <ul className="summary" aria-label="What goes in the jar">
                  {[
                    [draft.content.message.trim() ? draft.content.message.trim().split(/\s+/).length : 0, 'word in your note', 'words in your note'],
                    [input.content.accounts.length, 'account'],
                    [input.content.documents.length, 'place'],
                    [Object.values(draft.content.wishes).filter((w) => w.trim()).length, 'wish', 'wishes'],
                  ]
                    .filter(([n]) => (n as number) > 0)
                    .map(([n, one, many]) => (
                      <li key={one as string}>
                        <b>{n}</b> {plural(n as number, one as string, many as string | undefined)}
                      </li>
                    ))}
                  {letterNames.length > 0 && (
                    <li>
                      {letterNames.length > 1 ? 'Letters' : 'A letter'} for <b>{listNames(letterNames)}</b>
                    </li>
                  )}
                  <li>
                    <b>{capitalised(numberWord(draft.threshold))}</b> of {numberWord(draft.holders.length)} to open
                  </li>
                </ul>
                <div className="seal-altar">
                  <div className="seal-jar">
                    <Jar
                      initials={initialsOf(draft.owner)}
                      wax={wax}
                      corked={corkIn}
                      state={wax === 'pressing' ? 'sealed' : 'stirring'}
                      warmth={candleLit ? 0.9 : 0.5}
                      size={180}
                      mood={bedtime === 'night' ? 'wink' : bedtime === 'zzz' ? 'sleep' : undefined}
                    />
                    {bedtime && (
                      <span className={`boo-bubble ${bedtime}`} key={bedtime}>
                        {bedtime === 'night' ? 'Night night!' : 'Zzz…'}
                      </span>
                    )}
                    <Sparkles burst={burst} radius={130} count={16} />
                  </div>
                  <div className="seal-candle">
                    <Candle lit={candleLit} justLit={candleLit} size={64} label={candleLit ? 'A candle, lit for the sealing' : 'A candle, waiting to be lit'} />
                  </div>
                </div>
                <button type="button" className="btn primary big drip" onClick={seal} disabled={corked}>
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
          {step === 5 && !corked && (
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
