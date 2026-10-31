import { useEffect, useRef, useState, type FormEvent } from 'react';
import { JarError, type JarFile } from '../../core/jar.ts';
import type { WatchConfig } from '../../core/watch.ts';
import { Sparkles } from '../../ui/art/Decor.tsx';
import { Ghost, type Mood } from '../../ui/art/Ghost.tsx';
import { sound } from '../../ui/sound.ts';
import { firstName, numberWord, plural } from '../../ui/text.ts';
import { jarFromText } from '../../ui/grimoire.ts';
import { ConfirmButton } from '../../ui/components/Confirm.tsx';
import { ApiError, jarHandoff, watchApi, type WatchView } from '../../ui/watchApi.ts';

/** A button that reads a jar file chosen by the owner. */
function JarFileButton({ label, onJar, className = 'btn small' }: { label: string; onJar: (jar: JarFile) => void; className?: string }) {
  const [error, setError] = useState('');
  return (
    <span className="jar-file-button">
      <label className={className}>
        {label}
        <input
          type="file"
          accept=".html,.json,text/html,application/json"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (!f) return;
            try {
              setError('');
              onJar(jarFromText(await f.text()));
            } catch (err) {
              setError(err instanceof JarError ? err.message : 'That file isn’t a jar.');
            }
          }}
        />
      </label>
      {error && <span className="error">{error}</span>}
    </span>
  );
}

const versionOf = (j: { revision?: number }) => j.revision ?? 1;

const day = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : '';

/** Which emailed link, if any, opened this page. */
export const linkActionOf = (params: URLSearchParams) => (['confirm', 'here', 'manage', 'optout'] as const).find((a) => params.has(a));

/** Handles the links in watch emails: #/watch?confirm=…, ?here=…, ?manage=…, ?optout=… */
export function LinkAction({ params }: { params: URLSearchParams }) {
  const action = linkActionOf(params);
  const token = action ? (params.get(action) ?? '') : '';
  const [view, setView] = useState<WatchView | null>(null);
  const [left, setLeft] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const ran = useRef('');

  useEffect(() => {
    if (!action || ran.current === `${action}:${token}`) return;
    ran.current = `${action}:${token}`;
    const run = async () => {
      try {
        if (action === 'confirm') setView(await watchApi.confirm(token));
        if (action === 'here') setView(await watchApi.checkin(token));
        if (action === 'manage') setView(await watchApi.status(token));
        if (action === 'optout') setLeft((await watchApi.optOut(token)).owner);
        if (action !== 'manage') sound.chime();
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'The watch service is not answering.');
      }
    };
    void run();
  }, [action, token]);

  if (!action) return null;

  const act = async (fn: () => Promise<WatchView>) => {
    setBusy(true);
    setError('');
    try {
      setView(await fn());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  let mood: Mood = 'open';
  let title = 'One moment…';
  let body = '';
  if (error) {
    mood = 'worried';
    title = 'Hmm, that didn’t work';
    body = error;
  } else if (deleted) {
    mood = 'sleep';
    title = 'Your watch is gone';
    body = 'Everything about it was deleted. You can start a new one any time.';
  } else if (left !== null) {
    mood = 'happy';
    title = `You’ve left ${left}’s watch`;
    body = 'You won’t get emails about them again. If we sent you a link to their jar, it still works. Thank you.';
  } else if (view) {
    if (action === 'confirm') {
      mood = 'happy';
      title = 'You’re all set!';
      body = `We’ll ask “still here?” about every ${view.config.cadenceDays === 1 ? 'day' : `${view.config.cadenceDays} days`}. The first time will be ${day(view.nextAsk)}. Keep the email we sent: its manage link is your way back here.`;
    } else if (action === 'here') {
      mood = 'happy';
      title = `Thank you, ${firstName(view.owner)}!`;
      body = `Glad you’re here. We’ll ask again ${view.nextAsk ? `on ${day(view.nextAsk)}` : 'soon'}.`;
    } else {
      mood = view.status === 'paused' ? 'sleep' : view.status === 'well' ? 'happy' : 'worried';
      title = `${firstName(view.owner)}’s watch`;
      body = view.status === 'paused' ? 'Paused. Nothing will be sent until you resume.' : view.nextAsk ? `Next “still here?” on ${day(view.nextAsk)}.` : 'We are waiting for a sign from you.';
    }
  }

  return (
    <section className="card link-result pop" aria-live="polite">
      <div className="link-ghost">
        <Ghost mood={mood} size={88} float />
        {(action === 'confirm' || action === 'here') && view && <Sparkles burst={`${action}-${view.lastSign}`} radius={90} />}
      </div>
      <h1>{title}</h1>
      {body && <p className="muted">{body}</p>}
      {error && action !== 'optout' && (
        <p className="faint">Each new email replaces the links in the one before. Try the newest email from us.</p>
      )}
      {error && action === 'manage' && <ResendManage open />}
      {action === 'manage' && view && !deleted && (
        <>
          <ul className="watch-facts">
            <li>
              <b>{view.holders.length}</b> {plural(view.holders.length, 'friend')} would be asked: {view.holders.join(', ')}
            </li>
            <li>
              Ask every <b>{view.config.cadenceDays}</b> {plural(view.config.cadenceDays, 'day')}, then wait <b>{view.config.graceDays}</b> days with{' '}
              <b>{numberWord(view.config.reminders)}</b> {plural(view.config.reminders, 'reminder')}
            </li>
            {view.lastSign && <li>Last sign from you: {day(view.lastSign)}</li>}
            <li>
              {view.jar
                ? `A locked copy of your jar is kept: version ${view.jar.revision}, given ${day(view.jar.keptAt)}. If your friends are asked, each gets a link to it.`
                : 'No copy of your jar is kept. If your friends are asked, they will need the jar file you gave them.'}
            </li>
          </ul>
          <KeptJarActions view={view} busy={busy} onKeep={(jar) => act(() => watchApi.keepJar(token, jar))} />
          <div className="row centered">
            <button type="button" className="btn primary small" disabled={busy} onClick={() => act(() => watchApi.checkin(token))}>
              I’m here
            </button>
            {view.status === 'paused' ? (
              <button type="button" className="btn small" disabled={busy} onClick={() => act(() => watchApi.resume(token))}>
                Resume
              </button>
            ) : (
              <button type="button" className="btn small" disabled={busy} onClick={() => act(() => watchApi.pause(token))}>
                Pause, I’m away
              </button>
            )}
          </div>
          <p className="center delete-watch">
            <ConfirmButton
              label="Delete the watch"
              question="Delete this watch and everything it knows, the copy of your jar too? This can’t be undone."
              yes="Yes, delete it"
              no="Keep it"
              danger
              disabled={busy}
              onConfirm={() =>
                void watchApi.remove(token).then(
                  () => setDeleted(true),
                  (e: unknown) => setError(e instanceof ApiError ? e.message : 'Something went wrong.'),
                )
              }
            />
          </p>
        </>
      )}
    </section>
  );
}

/** Give the watch the newest jar, or take the copy back. */
function KeptJarActions({ view, busy, onKeep }: { view: WatchView; busy: boolean; onKeep: (jar: JarFile | null) => void }) {
  const fresh = jarHandoff.peek();
  const newer = fresh && (!view.jar || versionOf(fresh) > view.jar.revision || fresh.sealedAt !== view.jar.sealedAt);
  return (
    <div className="row centered kept-jar-actions">
      {newer && (
        <button type="button" className="btn small primary" disabled={busy} onClick={() => onKeep(fresh)}>
          Keep the jar you just {versionOf(fresh) > 1 ? 'updated' : 'sealed'}
        </button>
      )}
      <JarFileButton label={view.jar ? 'Give a newer jar file' : 'Keep a copy of my jar file'} onJar={onKeep} />
      {view.jar && (
        <button type="button" className="text-btn quiet" disabled={busy} onClick={() => onKeep(null)}>
          Remove the copy
        </button>
      )}
    </div>
  );
}

interface PersonDraft {
  name: string;
  email: string;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NOT_EMAIL = 'That doesn’t look like an email address.';

/** "Rosa" and "Rosa Lopez" are the same person here. */
function sameName(a: string, b: string): boolean {
  const norm = (s: string) => s.trim().toLowerCase().split(/\s+/);
  const [x, y] = [norm(a), norm(b)];
  return x.join(' ') === y.join(' ') || ((x.length === 1 || y.length === 1) && x[0] === y[0]);
}

const listNames = (names: string[]) => (names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : (names[0] ?? ''));

/** A new manage link, sent to the owner's own address, for an owner who lost the email. */
export function ResendManage({ open = false }: { open?: boolean }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'sent'>('idle');
  const [error, setError] = useState('');
  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!EMAIL.test(email.trim())) {
      setError(NOT_EMAIL);
      return;
    }
    setState('busy');
    setError('');
    try {
      await watchApi.resendManage(email.trim());
      setState('sent');
    } catch (err) {
      setState('idle');
      setError(err instanceof ApiError ? err.message : 'The watch service is not answering.');
    }
  };
  const body =
    state === 'sent' ? (
      <p className="muted" role="status">
        If a watch belongs to {email.trim()}, a new manage link is on its way there. The old link stops working.
      </p>
    ) : (
      <form className="resend-form" onSubmit={send} noValidate>
        <p className="muted">Give the address your watch belongs to, and we send a new manage link there.</p>
        <div className="resend-row">
          <input type="email" aria-label="The email your watch belongs to" placeholder="you@email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          <button type="submit" className="btn small" disabled={state === 'busy'}>
            {state === 'busy' ? 'Sending…' : 'Send a new link'}
          </button>
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </form>
    );
  if (open) return <div className="resend">{body}</div>;
  return (
    <details className="resend">
      <summary>Have a watch, and lost its manage link?</summary>
      {body}
    </details>
  );
}

/** Start a real watch. Shown only where the service is running. */
export function StartWatch({ config }: { config: WatchConfig }) {
  // Coming from a jar just sealed: its names are already known; only the emails are new.
  const handed = jarHandoff.peek();
  const [owner, setOwner] = useState<PersonDraft>({ name: handed?.owner ?? '', email: '' });
  const [friends, setFriends] = useState<PersonDraft[]>(() =>
    handed ? handed.holders.slice(0, 10).map((h) => ({ name: h.name, email: '' })) : [
      { name: '', email: '' },
      { name: '', email: '' },
    ],
  );
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');
  const [jar, setJar] = useState<JarFile | null>(handed);
  const [keep, setKeep] = useState(true);
  // Problems show once a field is left, or when the form is sent.
  const [tried, setTried] = useState(false);
  const [left, setLeft] = useState<Set<string>>(() => new Set());
  const leave = (key: string) => setLeft((s) => new Set(s).add(key));
  const shown = (key: string) => tried || left.has(key);

  const filled = friends.filter((f) => f.name.trim() || f.email.trim());
  const ownerNameError = owner.name.trim() ? '' : 'Add your name.';
  const ownerEmailError = !owner.email.trim() ? 'Add your email.' : EMAIL.test(owner.email.trim()) ? '' : NOT_EMAIL;
  const friendErrors = friends.map((f) => {
    const name = f.name.trim();
    const email = f.email.trim();
    if (!name && !email) return '';
    if (!name) return 'Add their name.';
    if (!email) return `Add ${firstName(name)}’s email.`;
    if (email.toLowerCase() === owner.email.trim().toLowerCase()) return 'That’s your own address.';
    return EMAIL.test(email) ? '' : NOT_EMAIL;
  });
  const noFriends = filled.length === 0;
  // Card holders the watch would never write to.
  const missing = jar ? jar.holders.filter((h) => !friends.some((f) => f.name.trim() && sameName(f.name, h.name))).map((h) => h.name) : [];

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (ownerNameError || ownerEmailError || noFriends || friendErrors.some(Boolean)) {
      const form = e.currentTarget as HTMLFormElement;
      requestAnimationFrame(() => form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    setError('');
    setState('sending');
    try {
      await watchApi.start({ owner, holders: filled, config, ...(jar && keep ? { jar: JSON.stringify(jar) } : {}) });
      setState('sent');
      sound.chime();
    } catch (err) {
      setState('idle');
      setError(err instanceof ApiError ? err.message : 'The watch service is not answering.');
    }
  };

  if (state === 'sent') {
    return (
      <section className="card start-watch sent pop" aria-live="polite">
        <div className="link-ghost">
          <Ghost mood="happy" size={88} float />
          <Sparkles burst="sent" radius={90} />
        </div>
        <h2>Check your inbox</h2>
        <p className="muted">
          We sent a link to <b>{owner.email}</b>. Nothing happens until you tap it. If it isn’t there in a few minutes, look in spam.
        </p>
      </section>
    );
  }

  return (
    <form className="card start-watch" onSubmit={submit} aria-labelledby="start-title" noValidate>
      <p className="tag">for real</p>
      <h2 id="start-title">Start your watch</h2>
      <p className="muted">
        It uses your rhythm<span className="rhythm-where"> (beside this)</span>. We keep names, emails and times, and a locked copy of your jar only if you choose. Pause
        or delete it any time from the link we send.
      </p>
      <div className="person-grid">
        <label className="field">
          <span>Your name</span>
          <input
            type="text"
            required
            value={owner.name}
            onChange={(e) => setOwner({ ...owner, name: e.target.value })}
            onBlur={() => leave('owner-name')}
            aria-invalid={shown('owner-name') && !!ownerNameError}
            autoComplete="name"
          />
          {shown('owner-name') && ownerNameError && <small className="error">{ownerNameError}</small>}
        </label>
        <label className="field">
          <span>Your email</span>
          <input
            type="email"
            required
            value={owner.email}
            onChange={(e) => setOwner({ ...owner, email: e.target.value })}
            onBlur={() => leave('owner-email')}
            aria-invalid={shown('owner-email') && !!ownerEmailError}
            autoComplete="email"
          />
          {shown('owner-email') && ownerEmailError && <small className="error">{ownerEmailError}</small>}
        </label>
      </div>
      <p className="label friends-label">Friends to ask, if you go quiet</p>
      <p className="faint friends-hint">Each one will see the others’ names and emails, so they can find each other.</p>
      {friends.map((f, i) => {
        const problem = shown(`friend-${i}`) ? friendErrors[i] : '';
        return (
          <div className="friend-row" key={i}>
            <div className="person-grid">
              <label className="field">
                <span className="visually-hidden">Friend {i + 1} name</span>
                <input
                  type="text"
                  placeholder={`Friend ${i + 1}’s name`}
                  value={f.name}
                  aria-invalid={!!problem && !f.name.trim()}
                  onChange={(e) => setFriends(friends.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                />
              </label>
              <label className="field">
                <span className="visually-hidden">Friend {i + 1} email</span>
                <input
                  type="email"
                  placeholder="their@email"
                  value={f.email}
                  aria-invalid={!!problem && !!f.name.trim()}
                  onBlur={() => leave(`friend-${i}`)}
                  onChange={(e) => setFriends(friends.map((x, j) => (j === i ? { ...x, email: e.target.value } : x)))}
                />
              </label>
            </div>
            {problem && <p className="error">{problem}</p>}
          </div>
        );
      })}
      {tried && noFriends && (
        <p className="error" role="alert">
          Add at least one friend, with their email.
        </p>
      )}
      {missing.length > 0 && (
        <p className="faint missing-holders">
          {listNames(missing)} {missing.length > 1 ? 'hold cards but are' : 'holds a card but is'} not on this list, so the watch would never write to{' '}
          {missing.length > 1 ? 'them' : firstName(missing[0]!)}.
        </p>
      )}
      <div className="keep-jar">
        <p className="label">Your jar, for your friends</p>
        {jar ? (
          <label className="keep-jar-check">
            <input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} />
            <span>
              Keep a locked copy of {jar.owner}’s jar{versionOf(jar) > 1 ? ` (version ${versionOf(jar)})` : ''}. If your friends are ever asked, each
              gets a link to it, so no one has to keep the file for years. Without their cards (or your key) it can’t be read, by us or anyone.
            </span>
          </label>
        ) : (
          <p className="muted keep-jar-none">
            Optional: <JarFileButton label="choose your jar file" onJar={setJar} className="text-btn" /> and we keep a locked copy, so no one has to
            keep the file for years.
          </p>
        )}
      </div>
      <div className="spread">
        {friends.length < 10 ? (
          <button type="button" className="text-btn" onClick={() => setFriends([...friends, { name: '', email: '' }])}>
            + another friend
          </button>
        ) : (
          <span />
        )}
        <button type="submit" className="btn primary" disabled={state === 'sending'}>
          {state === 'sending' ? 'Sending…' : 'Start the watch'}
        </button>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
