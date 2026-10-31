import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  emptyContent,
  sealJar,
  validateSealInput,
  type Account,
  type AccountWish,
  type DocumentPlace,
  type JarContent,
  type SealResult,
} from '../core/jar.ts';
import { sigilSeed } from '../core/sigil.ts';
import { Candle } from '../ui/components/Candle.tsx';
import { numberWord, PrintableCard, roman } from '../ui/components/Cards.tsx';
import { Ornament } from '../ui/components/Ornaments.tsx';
import { Sigil } from '../ui/components/Sigil.tsx';
import { Vessel } from '../ui/components/Vessel.tsx';
import { initialsOf, WaxSeal, type WaxState } from '../ui/components/WaxSeal.tsx';
import { canMakeGrimoire, download, makeGrimoire, safeFilename } from '../ui/grimoire.ts';
import { href, useAtmosphere, wait } from '../ui/shell.tsx';
import { sound } from '../ui/sound.ts';

interface HolderDraft {
  name: string;
  letter: string;
  writing: boolean;
}

interface Draft {
  owner: string;
  content: JarContent;
  holders: HolderDraft[];
  threshold: number;
}

const STEPS = ['Whose vessel', 'To all of them', 'What you leave', 'Your wishes', 'Your circle', 'The seal'] as const;

const WISHES: { value: AccountWish; label: string }[] = [
  { value: 'close', label: 'Close it' },
  { value: 'memorialize', label: 'Keep it as a memorial' },
  { value: 'keep', label: 'Keep it running' },
  { value: 'hand-over', label: 'Hand it to someone' },
];

const blankHolder = (): HolderDraft => ({ name: '', letter: '', writing: false });

function initialDraft(): Draft {
  return {
    owner: '',
    content: emptyContent(),
    holders: [blankHolder(), blankHolder(), blankHolder()],
    threshold: 2,
  };
}

export function Seal() {
  useAtmosphere('day', 3);
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [step, setStep] = useState(0);
  const [reached, setReached] = useState(0);
  const [wax, setWax] = useState<WaxState>('whole');
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

  // Warn before leaving with unsaved words: nothing is stored anywhere.
  useEffect(() => {
    if (result) return;
    const dirty = draft.owner || draft.content.message;
    if (!dirty) return;
    const on = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', on);
    return () => window.removeEventListener('beforeunload', on);
  }, [draft, result]);

  const goTo = (n: number) => {
    setStep(n);
    setReached((r) => Math.max(r, n));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const canContinue = step === 0 ? draft.owner.trim().length > 0 : step === 4 ? problems.length === 0 : true;

  const setContent = (patch: Partial<JarContent>) => setDraft((d) => ({ ...d, content: { ...d.content, ...patch } }));

  const press = async () => {
    setError('');
    if (problems.length) {
      setError(problems.join(' '));
      return;
    }
    setWax('pressing');
    sound.thud();
    try {
      const [sealed] = await Promise.all([sealJar(input), wait(1200)]);
      setResult(sealed);
      window.scrollTo({ top: 0 });
    } catch (e) {
      setWax('whole');
      setError(e instanceof Error ? e.message : 'The vessel could not be sealed.');
    }
  };

  if (result) return <Sealed result={result} />;

  return (
    <div className="page seal-page">
      <div className="seal-layout wide">
        <aside className="steps" aria-label="Steps">
          <ol>
            {STEPS.map((label, i) => (
              <li key={label}>
                <button
                  className={`step${i === step ? ' current' : ''}${i < step ? ' done' : ''}`}
                  disabled={i > reached}
                  aria-current={i === step ? 'step' : undefined}
                  onClick={() => goTo(i)}
                >
                  <span className="roman">{roman(i + 1)}</span>
                  <span>{label}</span>
                </button>
              </li>
            ))}
          </ol>
        </aside>

        <section className="seal-step" key={step}>
          {step === 0 && (
            <div className="stack ink">
              <p className="eyebrow">The first act</p>
              <h1>Whose vessel is this?</h1>
              <p className="lede">
                Everything you write here stays in this browser. It is locked before anything can be saved, and the key is
                broken into cards for the people you choose.
              </p>
              <label className="field">
                <span>Your name</span>
                <input
                  type="text"
                  autoFocus
                  value={draft.owner}
                  onChange={(e) => setDraft({ ...draft, owner: e.target.value })}
                  placeholder="As your people know you"
                  autoComplete="name"
                />
              </label>
              <p className="notice">
                This page keeps nothing. If you close it before sealing, what you wrote is gone. That is on purpose.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="stack ink">
              <p className="eyebrow">To all of them</p>
              <h1>What should they all read first?</h1>
              <p className="lede">This is opened when your circle gathers. Everyone at the circle will see it.</p>
              <label className="field">
                <span className="visually-hidden">Your message to everyone</span>
                <textarea
                  className="ruled"
                  rows={10}
                  value={draft.content.message}
                  onChange={(e) => setContent({ message: e.target.value })}
                  placeholder="If you are reading this, …"
                />
              </label>
              <p className="faint">
                Some people begin with thanks. Some say what they would want the next days to feel like. There is no wrong way.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="stack ink">
              <p className="eyebrow">What you leave</p>
              <h1>The things only you know</h1>
              <p className="lede">
                The accounts you keep, how to get into them, and what should happen to each. Where the papers are.
              </p>
              <AccountsEditor accounts={draft.content.accounts} onChange={(accounts) => setContent({ accounts })} />
              <DocumentsEditor documents={draft.content.documents} onChange={(documents) => setContent({ documents })} />
              <p className="faint">
                You may write a password here: the vessel is encrypted. Many people write the master password of their
                password manager and nothing else.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="stack ink">
              <p className="eyebrow">Your wishes</p>
              <h1>How you would like it done</h1>
              <p className="lede">
                These are wishes, not a legal will. If you need a will, make one with your state's proper forms and say here
                where it is.
              </p>
              {(
                [
                  ['farewell', 'The farewell', 'A service or none, music, a place, who should speak…'],
                  ['body', 'Your body', 'Organ donation, burial or cremation, a place to rest…'],
                  ['dependents', 'Those who depend on you', 'Children, parents, pets, plants: who and how…'],
                  ['other', 'Anything else', 'A promise to keep, a thing to return, a debt to forgive…'],
                ] as const
              ).map(([key, label, placeholder]) => (
                <label className="field" key={key}>
                  <span>{label}</span>
                  <textarea
                    className="ruled short"
                    rows={4}
                    value={draft.content.wishes[key]}
                    placeholder={placeholder}
                    onChange={(e) => setContent({ wishes: { ...draft.content.wishes, [key]: e.target.value } })}
                  />
                </label>
              ))}
            </div>
          )}

          {step === 4 && <CircleStep draft={draft} setDraft={setDraft} problems={problems} />}

          {step === 5 && (
            <div className="stack seal-final ink">
              <p className="eyebrow">The seal</p>
              <h1>Press the seal</h1>
              <p className="lede">
                Once pressed, the vessel is locked and the cards are made. You will print them next. They cannot be made
                again.
              </p>
              <Summary draft={draft} />
              <div className="press-area">
                <div className="vessel-plate">
                  <Vessel width={190} glow={0.35} seal={<WaxSeal initials={initialsOf(draft.owner)} size={66} state={wax} />} />
                </div>
                <button className="btn primary" onClick={press} disabled={wax === 'pressing'}>
                  {wax === 'pressing' ? 'Sealing…' : 'Press the seal'}
                </button>
                {error && (
                  <p className="error" role="alert">
                    {error}
                  </p>
                )}
              </div>
            </div>
          )}

          {step < 5 && (
            <div className="step-nav spread">
              {step > 0 ? (
                <button className="btn quiet" onClick={() => goTo(step - 1)}>
                  Back
                </button>
              ) : (
                <span />
              )}
              <button className="btn primary" onClick={() => goTo(step + 1)} disabled={!canContinue}>
                Continue
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function AccountsEditor({ accounts, onChange }: { accounts: Account[]; onChange: (a: Account[]) => void }) {
  const update = (i: number, patch: Partial<Account>) => onChange(accounts.map((a, j) => (j === i ? { ...a, ...patch } : a)));
  return (
    <fieldset className="ledger">
      <legend className="label">Accounts</legend>
      {accounts.length === 0 && <p className="faint">None yet.</p>}
      {accounts.map((a, i) => (
        <div className="ledger-row" key={i}>
          <label className="field">
            <span>Service</span>
            <input type="text" value={a.service} placeholder="Email, bank, photos…" onChange={(e) => update(i, { service: e.target.value })} />
          </label>
          <label className="field">
            <span>How to get in</span>
            <input type="text" value={a.login} placeholder="Login, where the password is" onChange={(e) => update(i, { login: e.target.value })} />
          </label>
          <label className="field">
            <span>Wish</span>
            <select value={a.wish} onChange={(e) => update(i, { wish: e.target.value as AccountWish })}>
              {WISHES.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field wide-field">
            <span>Note</span>
            <input type="text" value={a.note} placeholder="Anything they should know" onChange={(e) => update(i, { note: e.target.value })} />
          </label>
          <button className="link-btn remove" onClick={() => onChange(accounts.filter((_, j) => j !== i))} aria-label={`Remove account ${i + 1}`}>
            Remove
          </button>
        </div>
      ))}
      <button className="btn small quiet" onClick={() => onChange([...accounts, { service: '', login: '', wish: 'close', note: '' }])}>
        Add an account
      </button>
    </fieldset>
  );
}

function DocumentsEditor({ documents, onChange }: { documents: DocumentPlace[]; onChange: (d: DocumentPlace[]) => void }) {
  const update = (i: number, patch: Partial<DocumentPlace>) => onChange(documents.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  return (
    <fieldset className="ledger">
      <legend className="label">Where things are</legend>
      {documents.length === 0 && <p className="faint">None yet.</p>}
      {documents.map((d, i) => (
        <div className="ledger-row two" key={i}>
          <label className="field">
            <span>What</span>
            <input type="text" value={d.item} placeholder="Will, deed, insurance, spare key…" onChange={(e) => update(i, { item: e.target.value })} />
          </label>
          <label className="field">
            <span>Where</span>
            <input type="text" value={d.location} placeholder="Blue folder, top drawer of the desk" onChange={(e) => update(i, { location: e.target.value })} />
          </label>
          <button className="link-btn remove" onClick={() => onChange(documents.filter((_, j) => j !== i))} aria-label={`Remove item ${i + 1}`}>
            Remove
          </button>
        </div>
      ))}
      <button className="btn small quiet" onClick={() => onChange([...documents, { item: '', location: '' }])}>
        Add a place
      </button>
    </fieldset>
  );
}

function CircleStep({ draft, setDraft, problems }: { draft: Draft; setDraft: (d: Draft) => void; problems: string[] }) {
  const n = draft.holders.length;
  const update = (i: number, patch: Partial<HolderDraft>) =>
    setDraft({ ...draft, holders: draft.holders.map((h, j) => (j === i ? { ...h, ...patch } : h)) });
  const setHolders = (holders: HolderDraft[]) =>
    setDraft({ ...draft, holders, threshold: Math.min(Math.max(2, draft.threshold), Math.max(2, holders.length)) });
  const first = draft.owner.trim().split(/\s+/)[0] || 'you';

  return (
    <div className="stack ink">
      <p className="eyebrow">Your circle</p>
      <h1>Who will keep the cards?</h1>
      <p className="lede">
        Each person gets one card. Choose people who will outlive {first === 'you' ? 'you' : 'you, ' + first}, who can be
        reached, and who would come.
      </p>

      <ol className="holders">
        {draft.holders.map((h, i) => (
          <li key={i} className="holder">
            <div className="holder-row">
              <span className="roman holder-num">{roman(i + 1)}</span>
              <label className="field">
                <span className="visually-hidden">Name of person {i + 1}</span>
                <input type="text" value={h.name} placeholder="Their name" onChange={(e) => update(i, { name: e.target.value })} />
              </label>
              <button className={`link-btn${h.writing ? ' active' : ''}`} onClick={() => update(i, { writing: !h.writing })} aria-expanded={h.writing}>
                {h.writing ? 'No letter' : 'Write them a letter'}
              </button>
              {n > 2 && (
                <button className="link-btn remove" onClick={() => setHolders(draft.holders.filter((_, j) => j !== i))} aria-label={`Remove person ${i + 1}`}>
                  Remove
                </button>
              )}
            </div>
            {h.writing && (
              <label className="field letter-field">
                <span>
                  A letter to {h.name.trim() || 'them'}, opened only with their own card
                </span>
                <textarea className="ruled" rows={7} value={h.letter} placeholder={`Dear ${h.name.trim() || '…'},`} onChange={(e) => update(i, { letter: e.target.value })} />
              </label>
            )}
          </li>
        ))}
      </ol>
      {n < 10 && (
        <button className="btn small quiet" onClick={() => setHolders([...draft.holders, blankHolder()])}>
          Add a person
        </button>
      )}

      <div className="threshold panel">
        <p className="label">How many must gather</p>
        <div className="threshold-candles" role="radiogroup" aria-label="Number of cards needed to open the vessel">
          {draft.holders.map((h, i) => {
            const k = i + 1;
            const disabled = k < 2;
            return (
              <button
                key={i}
                className="threshold-candle"
                role="radio"
                aria-checked={draft.threshold === k}
                aria-label={`${k} cards`}
                disabled={disabled}
                onClick={() => {
                  setDraft({ ...draft, threshold: k });
                  sound.strike();
                }}
              >
                <Candle lit={i < draft.threshold} delay={i * 0.7} height={92} label={h.name || `Card ${k}`} />
                <span className="faint">{h.name.trim() || roman(k)}</span>
              </button>
            );
          })}
        </div>
        <p className="threshold-text">
          Any <strong>{numberWord(draft.threshold)}</strong> of the {numberWord(n)} cards will open it.
        </p>
        <p className="faint">
          Fewer is easier to gather. More is safer if a card is lost or someone is careless. Most people choose a little more
          than half.
        </p>
      </div>
      {problems.length > 0 && (
        <p className="error" role="status">
          {problems[0]}
        </p>
      )}
    </div>
  );
}

function Summary({ draft }: { draft: Draft }) {
  const c = draft.content;
  const wishes = Object.values(c.wishes).filter((w) => w.trim()).length;
  const letters = draft.holders.filter((h) => h.writing && h.letter.trim()).length;
  const rows: [string, string][] = [
    ['Message to all', c.message.trim() ? `${c.message.trim().split(/\s+/).length} words` : 'None'],
    ['Accounts', String(c.accounts.length)],
    ['Places', String(c.documents.length)],
    ['Wishes', String(wishes)],
    ['Circle', draft.holders.map((h) => h.name.trim()).join(', ')],
    ['Letters', letters ? `${letters}, each opened only by its reader` : 'None'],
    ['To open', `Any ${numberWord(draft.threshold)} of ${numberWord(draft.holders.length)} cards`],
  ];
  return (
    <dl className="summary">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Sealed({ result }: { result: SealResult }) {
  const { jar, cards } = result;
  const grimoireOk = canMakeGrimoire();
  const base = safeFilename(`The Phylactery of ${jar.owner}`);

  return (
    <div className="page sealed-page">
      <section className="column center stack">
        <div className="sealed-vessel rise">
          <div className="vessel-plate">
            <p className="plate-inscription" aria-hidden="true">
              Sealed
            </p>
            <Vessel width={180} glow={0.6} seal={<WaxSeal initials={initialsOf(jar.owner)} size={62} />} />
          </div>
        </div>
        <p className="eyebrow ink">It is sealed</p>
        <h1 className="ink" style={{ '--d': '200ms' } as CSSProperties}>
          {cards.length} cards were made
        </h1>
        <p className="lede ink" style={{ margin: '0 auto', '--d': '400ms' } as CSSProperties}>
          Any {numberWord(jar.threshold)} of them will open the vessel. This is the only time they can be printed.
        </p>
      </section>

      <section className="column">
        <ol className="instructions">
          <li>
            <h3>Print the cards</h3>
            <p>One page per person. The top half is their shard. The bottom half is their personal seal: fold it inward.</p>
            <button className="btn primary" onClick={() => window.print()}>
              Print the cards
            </button>
          </li>
          <li>
            <h3>Give each person the Grimoire</h3>
            <p>
              The Grimoire is this app and your sealed vessel in a single file. It opens without the internet. It is
              encrypted, so it is safe to email or keep in the cloud.
            </p>
            <div className="row">
              <button
                className="btn"
                disabled={!grimoireOk}
                onClick={() => download(`${base}.html`, makeGrimoire(jar), 'text/html')}
              >
                Download the Grimoire
              </button>
              <button className="btn quiet" onClick={() => download(`${base}.json`, JSON.stringify(jar, null, 2), 'application/json')}>
                Only the vessel file
              </button>
            </div>
            {!grimoireOk && <p className="faint">The Grimoire can only be made from the built app, not the development server.</p>}
          </li>
          <li>
            <h3>Keep watch</h3>
            <p>
              Choose how often you will be asked if you are still here, and who should be asked to check on you if you fall
              silent.
            </p>
            <a className="btn quiet" href={href('watch')}>
              Set the watch
            </a>
          </li>
        </ol>
      </section>

      <Ornament />

      <section className="wide">
        <div className="card-previews">
          {cards.map((c, i) => (
            <div className="card-preview rise" key={c.x} style={{ '--d': `${i * 120}ms` } as CSSProperties}>
              <Sigil seed={sigilSeed(c.shard.jarId, c.x)} size={72} draw />
              <p className="roman">
                {roman(i + 1)} of {roman(cards.length)}
              </p>
              <p className="card-preview-name">{c.name}</p>
              <p className="faint">{c.hasLetter ? 'With a letter' : 'No letter'}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="print-area" aria-hidden="true">
        {cards.map((c, i) => (
          <PrintableCard key={c.x} owner={jar.owner} card={c} index={i} total={cards.length} threshold={jar.threshold} />
        ))}
      </div>
    </div>
  );
}
