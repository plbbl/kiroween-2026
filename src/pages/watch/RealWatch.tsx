import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { WatchConfig } from '../../core/watch.ts';
import { Sparkles } from '../../ui/art/Decor.tsx';
import { Ghost, type Mood } from '../../ui/art/Ghost.tsx';
import { sound } from '../../ui/sound.ts';
import { firstName, numberWord, plural } from '../../ui/text.ts';
import { ApiError, watchApi, type WatchView } from '../../ui/watchApi.ts';

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
    body = 'You won’t be asked to check on them again. Thank you.';
  } else if (view) {
    if (action === 'confirm') {
      mood = 'happy';
      title = 'You’re all set!';
      body = `We’ll ask “still here?” about every ${view.config.cadenceDays === 1 ? 'day' : `${view.config.cadenceDays} days`}. The first time will be ${day(view.nextAsk)}.`;
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
          </ul>
          <div className="row centered">
            <button type="button" className="btn primary small" disabled={busy} onClick={() => act(() => watchApi.checkin(token))}>
              I’m here!
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
            <button
              type="button"
              className="text-btn quiet"
              disabled={busy}
              onClick={async () => {
                if (!window.confirm('Delete this watch and everything it knows? This cannot be undone.')) return;
                try {
                  await watchApi.remove(token);
                  setDeleted(true);
                } catch (e) {
                  setError(e instanceof ApiError ? e.message : 'Something went wrong.');
                }
              }}
            >
              Delete the watch
            </button>
          </div>
        </>
      )}
    </section>
  );
}

interface PersonDraft {
  name: string;
  email: string;
}

/** Start a real watch. Shown only where the service is running. */
export function StartWatch({ config }: { config: WatchConfig }) {
  const [owner, setOwner] = useState<PersonDraft>({ name: '', email: '' });
  const [friends, setFriends] = useState<PersonDraft[]>([
    { name: '', email: '' },
    { name: '', email: '' },
  ]);
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');

  const filled = friends.filter((f) => f.name.trim() || f.email.trim());
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setState('sending');
    try {
      await watchApi.start({ owner, holders: filled, config });
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
    <form className="card start-watch" onSubmit={submit} aria-labelledby="start-title">
      <p className="tag">for real</p>
      <h2 id="start-title">Start your watch</h2>
      <p className="muted">
        Uses the rhythm above. We keep only names, email addresses and times, never anything from your jar. You can pause or delete it from the link we
        send. Once a year, on the Day of the Dead, we also ask whether your jar is still up to date.
      </p>
      <div className="person-grid">
        <label className="field">
          <span>Your name</span>
          <input type="text" required value={owner.name} onChange={(e) => setOwner({ ...owner, name: e.target.value })} autoComplete="name" />
        </label>
        <label className="field">
          <span>Your email</span>
          <input type="email" required value={owner.email} onChange={(e) => setOwner({ ...owner, email: e.target.value })} autoComplete="email" />
        </label>
      </div>
      <p className="label friends-label">Friends to ask, if you go quiet</p>
      {friends.map((f, i) => (
        <div className="person-grid" key={i}>
          <label className="field">
            <span className="visually-hidden">Friend {i + 1} name</span>
            <input type="text" placeholder={`Friend ${i + 1}’s name`} value={f.name} onChange={(e) => setFriends(friends.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
          </label>
          <label className="field">
            <span className="visually-hidden">Friend {i + 1} email</span>
            <input type="email" placeholder="their@email" value={f.email} onChange={(e) => setFriends(friends.map((x, j) => (j === i ? { ...x, email: e.target.value } : x)))} />
          </label>
        </div>
      ))}
      <div className="spread">
        {friends.length < 10 ? (
          <button type="button" className="text-btn" onClick={() => setFriends([...friends, { name: '', email: '' }])}>
            + another friend
          </button>
        ) : (
          <span />
        )}
        <button type="submit" className="btn primary" disabled={state === 'sending' || filled.length === 0}>
          {state === 'sending' ? 'Sending…' : 'Start the watch'}
        </button>
      </div>
      {filled.length === 0 && <p className="faint start-hint">Add at least one friend to start.</p>}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
