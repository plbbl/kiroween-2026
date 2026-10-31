import type { CSSProperties } from 'react';
import type { Costume, Emblem } from '../../core/buddy.ts';
import type { Account, AccountWish, DocumentPlace, JarContent } from '../../core/jar.ts';
import { Candle } from '../../ui/art/Candle.tsx';
import { EmblemIcon } from '../../ui/art/Emblem.tsx';
import { Ghost } from '../../ui/art/Ghost.tsx';
import { capitalised, numberWord } from '../../ui/text.ts';
import { sound } from '../../ui/sound.ts';

export interface HolderDraft {
  name: string;
  letter: string;
  writing: boolean;
}

export interface Draft {
  owner: string;
  content: JarContent;
  holders: HolderDraft[];
  threshold: number;
}

type Patch = (patch: Partial<JarContent>) => void;

/** Placeholder costumes for people before their cards exist. */
export const PREVIEW_COSTUMES: Costume[] = ['sheet', 'pumpkin', 'bat', 'franken', 'bow', 'witch', 'skeleton', 'mummy', 'sheet', 'pumpkin'];

export function StepName({ draft, setOwner }: { draft: Draft; setOwner: (s: string) => void }) {
  return (
    <>
      <label className="field">
        <span>Your name</span>
        <input type="text" autoFocus value={draft.owner} onChange={(e) => setOwner(e.target.value)} placeholder="As your people know you" autoComplete="name" />
      </label>
      <p className="note">
        <Ghost size={30} mood="wink" />
        <span>Nothing is saved until you seal the jar. If you close this page, your words vanish. That is on purpose.</span>
      </p>
    </>
  );
}

const STARTERS = ['If you are reading this, ', 'Thank you for ', 'Please don’t worry about ', 'I want you to know ', 'Be gentle with each other.'];

export function StepMessage({ content, setContent }: { content: JarContent; setContent: Patch }) {
  return (
    <>
      <label className="field">
        <span className="visually-hidden">Your note to everyone</span>
        <textarea rows={9} value={content.message} onChange={(e) => setContent({ message: e.target.value })} placeholder="Write anything. There is no wrong way." />
      </label>
      <div className="starters" aria-label="Ways to begin">
        <span className="faint">Stuck? Try</span>
        {STARTERS.map((s) => (
          <button key={s} type="button" className="chip" onClick={() => setContent({ message: (content.message ? content.message.trimEnd() + '\n\n' : '') + s })}>
            {s.trim()}
          </button>
        ))}
      </div>
    </>
  );
}

const WISHES: { value: AccountWish; label: string }[] = [
  { value: 'close', label: 'Close it' },
  { value: 'memorialize', label: 'Keep as a memorial' },
  { value: 'keep', label: 'Keep it running' },
  { value: 'hand-over', label: 'Hand it over' },
];

const QUICK_ACCOUNTS = ['Password manager', 'Email', 'Phone', 'Bank', 'Photos', 'Social media'];

export function StepLeave({ content, setContent }: { content: JarContent; setContent: Patch }) {
  const accounts = content.accounts;
  const documents = content.documents;
  const setAccounts = (a: Account[]) => setContent({ accounts: a });
  const setDocuments = (d: DocumentPlace[]) => setContent({ documents: d });
  const updateAccount = (i: number, patch: Partial<Account>) => setAccounts(accounts.map((a, j) => (j === i ? { ...a, ...patch } : a)));
  const updateDoc = (i: number, patch: Partial<DocumentPlace>) => setDocuments(documents.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  const addAccount = (service = '') => setAccounts([...accounts, { service, login: '', wish: 'close', note: '' }]);

  return (
    <>
      <div className="sub-head">
        <h3>Accounts</h3>
        <span className="faint">You can write passwords here. The jar is locked.</span>
      </div>
      <div className="starters">
        {QUICK_ACCOUNTS.filter((q) => !accounts.some((a) => a.service === q)).map((q) => (
          <button key={q} type="button" className="chip" onClick={() => addAccount(q)}>
            + {q}
          </button>
        ))}
      </div>
      {accounts.length > 0 && (
        <ul className="rows" aria-label="Accounts">
          {accounts.map((a, i) => (
            <li key={i} className="row-card pop">
              <div className="row-grid">
                <label className="field">
                  <span>Service</span>
                  <input type="text" value={a.service} placeholder="Email, bank, photos…" onChange={(e) => updateAccount(i, { service: e.target.value })} />
                </label>
                <label className="field">
                  <span>How to get in</span>
                  <input type="text" value={a.login} placeholder="Login, and where the password is" onChange={(e) => updateAccount(i, { login: e.target.value })} />
                </label>
                <label className="field">
                  <span>What should happen</span>
                  <select value={a.wish} onChange={(e) => updateAccount(i, { wish: e.target.value as AccountWish })}>
                    {WISHES.map((w) => (
                      <option key={w.value} value={w.value}>
                        {w.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>A note</span>
                  <input type="text" value={a.note} placeholder="Anything they should know" onChange={(e) => updateAccount(i, { note: e.target.value })} />
                </label>
              </div>
              <button type="button" className="text-btn quiet remove" onClick={() => setAccounts(accounts.filter((_, j) => j !== i))} aria-label={`Remove ${a.service || 'this account'}`}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="btn small" onClick={() => addAccount()}>
        + Add an account
      </button>

      <div className="sub-head spaced">
        <h3>Where things are</h3>
        <span className="faint">The will, the deed, the spare key.</span>
      </div>
      {documents.length > 0 && (
        <ul className="rows" aria-label="Places">
          {documents.map((d, i) => (
            <li key={i} className="row-card pop">
              <div className="row-grid two">
                <label className="field">
                  <span>What</span>
                  <input type="text" value={d.item} placeholder="Will, deed, insurance, spare key…" onChange={(e) => updateDoc(i, { item: e.target.value })} />
                </label>
                <label className="field">
                  <span>Where</span>
                  <input type="text" value={d.location} placeholder="Blue folder, top drawer of the desk" onChange={(e) => updateDoc(i, { location: e.target.value })} />
                </label>
              </div>
              <button type="button" className="text-btn quiet remove" onClick={() => setDocuments(documents.filter((_, j) => j !== i))} aria-label={`Remove ${d.item || 'this place'}`}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="btn small" onClick={() => setDocuments([...documents, { item: '', location: '' }])}>
        + Add a place
      </button>
    </>
  );
}

const WISH_FIELDS: [key: keyof JarContent['wishes'], label: string, placeholder: string, icon: Emblem, color: string][] = [
  ['farewell', 'The farewell', 'A gathering or none, music, a place…', 'flower', '#e0457a'],
  ['body', 'Your body', 'Organ donation, burial or cremation…', 'heart', '#8e47ff'],
  ['dependents', 'Who depends on you', 'Children, parents, pets, plants…', 'bone', '#d0832a'],
  ['other', 'Anything else', 'A promise to keep, a thing to return…', 'spark', '#2f9e7a'],
];

export function StepWishes({ content, setContent }: { content: JarContent; setContent: Patch }) {
  return (
    <>
      <div className="wish-grid">
        {WISH_FIELDS.map(([key, label, placeholder, icon, color]) => (
          <label className="field wish-tile" key={key}>
            <span className="wish-label">
              <EmblemIcon name={icon} size={18} color={color} title="" /> {label}
            </span>
            <textarea rows={4} value={content.wishes[key]} placeholder={placeholder} onChange={(e) => setContent({ wishes: { ...content.wishes, [key]: e.target.value } })} />
          </label>
        ))}
      </div>
      <p className="note">
        <EmblemIcon name="key" size={22} color="#8e47ff" title="" />
        <span>These are wishes, not a legal will. If you have a will, say where it is in the previous step.</span>
      </p>
    </>
  );
}

export function StepCircle({ draft, setDraft }: { draft: Draft; setDraft: (d: Draft) => void }) {
  const n = draft.holders.length;
  const update = (i: number, patch: Partial<HolderDraft>) => setDraft({ ...draft, holders: draft.holders.map((h, j) => (j === i ? { ...h, ...patch } : h)) });
  const setHolders = (holders: HolderDraft[]) => setDraft({ ...draft, holders, threshold: Math.min(Math.max(2, draft.threshold), Math.max(2, holders.length)) });

  return (
    <>
      <ul className="people" aria-label="Your circle">
        {draft.holders.map((h, i) => (
          <li key={i} className="person pop" style={{ '--d': `${i * 60}ms` } as CSSProperties}>
            <div className="person-row">
              <span className="person-ghost" aria-hidden="true">
                <Ghost costume={PREVIEW_COSTUMES[i]} mood={h.name.trim() ? 'happy' : 'open'} size={46} float phase={i * 0.5} />
              </span>
              <label className="field">
                <span className="visually-hidden">Name of person {i + 1}</span>
                <input type="text" value={h.name} placeholder={`Friend ${i + 1}`} onChange={(e) => update(i, { name: e.target.value })} />
              </label>
              <button type="button" className={`chip${h.writing ? ' on' : ''}`} onClick={() => update(i, { writing: !h.writing })} aria-expanded={h.writing}>
                {h.writing ? '✓ Letter' : '+ Letter'}
              </button>
              {n > 2 && (
                <button type="button" className="icon-btn small" onClick={() => setHolders(draft.holders.filter((_, j) => j !== i))} aria-label={`Remove ${h.name || `friend ${i + 1}`}`}>
                  ×
                </button>
              )}
            </div>
            {h.writing && (
              <label className="field letter-field pop">
                <span>A letter only {h.name.trim() || 'they'} can open</span>
                <textarea rows={6} value={h.letter} placeholder={`Dear ${h.name.trim() || '…'},`} onChange={(e) => update(i, { letter: e.target.value })} />
              </label>
            )}
          </li>
        ))}
      </ul>
      {n < 10 && (
        <button type="button" className="btn small" onClick={() => setHolders([...draft.holders, { name: '', letter: '', writing: false }])}>
          + Add a friend
        </button>
      )}

      <div className="threshold" data-theme="night">
        <h3>How many must gather?</h3>
        <p className="faint">Tap a candle. Fewer is easier to gather; more is safer if a card goes missing.</p>
        <div className="threshold-candles" role="radiogroup" aria-label="Cards needed to open the jar">
          {draft.holders.map((h, i) => {
            const k = i + 1;
            return (
              <button
                key={i}
                type="button"
                className="threshold-candle"
                role="radio"
                aria-checked={draft.threshold === k}
                aria-label={`${k} cards`}
                disabled={k < 2}
                onClick={() => {
                  setDraft({ ...draft, threshold: k });
                  sound.strike();
                }}
              >
                <Candle lit={i < draft.threshold} justLit={i === draft.threshold - 1} size={64} phase={i * 0.6} key={`${i}-${i < draft.threshold}`} />
                <span>{h.name.trim() || `Friend ${k}`}</span>
              </button>
            );
          })}
        </div>
        <p className="threshold-text">
          {capitalised(numberWord(draft.threshold))} of {numberWord(n)} can open it
        </p>
      </div>
    </>
  );
}
