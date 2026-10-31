import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  DEFAULT_WATCH,
  holderMessage,
  ownerReminder,
  runWatch,
  validateWatch,
  type OwnerAction,
  type WatchConfig,
  type WatchEvent,
  type WatchStatus,
} from '../core/watch.ts';
import { DEMO_JAR } from '../demo/demo.ts';
import { numberWord } from '../ui/components/Cards.tsx';
import { useAtmosphere, useShell } from '../ui/shell.tsx';
import { sound } from '../ui/sound.ts';

const MOURNING: Record<WatchStatus, number> = { well: 3, paused: 3, due: 5, reminding: 9, notified: 18 };

const STATUS_TEXT: Record<WatchStatus, string> = {
  well: 'All is well.',
  paused: 'The watch is paused.',
  due: 'A sign is due.',
  reminding: 'Reminding you.',
  notified: 'Your circle has been asked to check on you.',
};

const owner = DEMO_JAR.owner;
const holders = DEMO_JAR.holders.map((h) => h.name);

export function Watch() {
  const shell = useShell();
  const [config, setConfig] = useState<WatchConfig>(DEFAULT_WATCH);
  const [actions, setActions] = useState<OwnerAction[]>([]);
  const [day, setDay] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  // Show a few weeks past the first moment the circle could be asked.
  const horizon = Math.max(21, Math.ceil((config.cadenceDays + config.graceDays + 7) / 7) * 7);
  const run = useMemo(() => runWatch(config, actions, day), [config, actions, day]);
  const full = useMemo(() => runWatch(config, actions, horizon), [config, actions, horizon]);
  const problems = validateWatch(config);
  const paused = run.status === 'paused';

  useAtmosphere('day', MOURNING[run.status]);

  useEffect(() => {
    shell.setMourning(MOURNING[run.status]);
  }, [shell, run.status]);

  useEffect(() => () => shell.setMourning(3), [shell]);

  useEffect(() => {
    if (!playing) return;
    timer.current = window.setInterval(() => {
      setDay((d) => {
        if (d >= horizon) {
          setPlaying(false);
          return d;
        }
        return Math.round((d + 0.125) * 1000) / 1000;
      });
    }, 70);
    return () => clearInterval(timer.current);
  }, [playing, horizon]);

  // A soft sound when a new letter goes out.
  const sentCount = run.events.filter((e) => e.kind === 'reminder' || e.kind === 'notify').length;
  const lastSent = useRef(0);
  useEffect(() => {
    if (sentCount > lastSent.current) sound.strike();
    lastSent.current = sentCount;
  }, [sentCount]);

  const act = (type: OwnerAction['type']) => {
    setActions((a) => [...a, { at: day, type }]);
    if (type === 'checkin') sound.chime();
  };

  const reset = () => {
    setPlaying(false);
    setActions([]);
    setDay(0);
  };

  const letters = run.events.filter((e) => e.kind === 'reminder' || e.kind === 'notify' || e.kind === 'checkin').reverse();

  return (
    <div className="page watch-page">
      <section className="column center">
        <p className="eyebrow ink">The second act</p>
        <h1 className="ink" style={{ '--d': '150ms' } as CSSProperties}>
          Are you still here?
        </h1>
        <p className="lede ink" style={{ margin: '0 auto', '--d': '300ms' } as CSSProperties}>
          The watch asks after you on a rhythm you choose. One tap answers. If you fall silent, it asks again, and only after a
          grace period does it ask your people to look in on you.
        </p>
      </section>

      <section className="wide watch-grid">
        <div className="panel watch-settings">
          <p className="label">The rhythm</p>
          <label className="field inline-field">
            <span>Ask me every</span>
            <select value={config.cadenceDays} onChange={(e) => setConfig({ ...config, cadenceDays: Number(e.target.value) })}>
              {[1, 3, 7, 14, 30].map((v) => (
                <option key={v} value={v}>
                  {v === 1 ? 'day' : `${v} days`}
                </option>
              ))}
            </select>
          </label>
          <label className="field inline-field">
            <span>Then wait</span>
            <select value={config.graceDays} onChange={(e) => setConfig({ ...config, graceDays: Number(e.target.value) })}>
              {[2, 4, 7, 10, 14].map((v) => (
                <option key={v} value={v}>
                  {v} more days
                </option>
              ))}
            </select>
          </label>
          <label className="field inline-field">
            <span>Reminding me</span>
            <select value={config.reminders} onChange={(e) => setConfig({ ...config, reminders: Number(e.target.value) })}>
              {[1, 2, 3, 5].map((v) => (
                <option key={v} value={v}>
                  {numberWord(v)} {v === 1 ? 'time' : 'times'}
                </option>
              ))}
            </select>
          </label>
          {problems.length > 0 && <p className="error">{problems[0]}</p>}
          <p className="faint watch-sentence">
            If {owner.split(' ')[0]} is silent for {config.cadenceDays + config.graceDays} days, {holders.length} people are asked
            to check on {owner.split(' ')[0]}. Never sooner.
          </p>
          <p className="notice">
            This is a preview of the schedule with the demonstration vessel. Nothing is sent: the watch service is not yet
            connected. It will store only addresses and times, never what is in a vessel.
          </p>
        </div>

        <div className="watch-main">
          <div className="almanac" aria-label={`Day ${Math.floor(day)} of ${horizon}`}>
            <div className="almanac-head spread">
              <p className="roman">Day {Math.floor(day)}</p>
              <p className={`watch-status s-${run.status}`} aria-live="polite">
                {STATUS_TEXT[run.status]}
                {run.status === 'reminding' && ` (${run.events.filter((e) => e.kind === 'reminder' && e.at > run.lastSign).length} of ${config.reminders})`}
              </p>
            </div>
            <Almanac events={full.events} day={day} horizon={horizon} />
            <div className="row almanac-controls">
              <button className="btn primary small" onClick={() => setPlaying(!playing)} disabled={day >= horizon}>
                {playing ? 'Hold time' : day >= horizon ? 'The end of the almanac' : 'Let time pass'}
              </button>
              <button className="btn small" onClick={() => act('checkin')} disabled={paused}>
                {run.status === 'notified' ? 'Knock thrice: I am here' : 'I am still here'}
              </button>
              <button className="btn small quiet" onClick={() => act(paused ? 'resume' : 'pause')}>
                {paused ? 'Resume the watch' : 'Pause, I am travelling'}
              </button>
              <button className="link-btn" onClick={reset}>
                Begin again
              </button>
            </div>
          </div>

          <div className="letters-sent">
            <p className="label">Letters sent</p>
            {letters.length === 0 && <p className="faint">None yet. Let time pass, and stay silent.</p>}
            {letters.map((e) => (
              <SentLetter key={`${e.kind}-${e.at}-${e.n ?? 0}`} event={e} of={config.reminders} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Almanac({ events, day, horizon }: { events: WatchEvent[]; day: number; horizon: number }) {
  const days = Array.from({ length: horizon + 1 }, (_, i) => i);
  const pct = (at: number) => `${(Math.min(at, horizon) / horizon) * 100}%`;
  return (
    <div className="almanac-strip">
      <div className="almanac-days">
        {days.map((d) => (
          <span key={d} className={`tick${d % 7 === 0 ? ' week' : ''}`} style={{ left: pct(d) }}>
            {d % 7 === 0 && <span className="tick-label">{d}</span>}
          </span>
        ))}
      </div>
      <div className="almanac-past" style={{ width: pct(day) }} />
      {events.filter((e) => e.at <= horizon).map((e, i) => (
        <span
          key={i}
          className={`almanac-mark m-${e.kind}${e.at <= day ? ' passed' : ''}`}
          style={{ left: pct(e.at) }}
          title={`${e.kind} on day ${e.at.toFixed(1)}`}
        />
      ))}
      <span className="almanac-now" style={{ left: pct(day) }} />
      <div className="almanac-legend">
        <span><i className="m-checkin" /> a sign from you</span>
        <span><i className="m-due" /> a sign is due</span>
        <span><i className="m-reminder" /> a reminder to you</span>
        <span><i className="m-notify" /> your circle is asked</span>
      </div>
    </div>
  );
}

function SentLetter({ event, of }: { event: WatchEvent; of: number }) {
  const when = `Day ${Math.floor(event.at)}`;
  if (event.kind === 'checkin') {
    return (
      <article className="sent sent-sign ink">
        <p className="sent-meta">{when} · from {owner}</p>
        <p className="sent-subject">“I am still here.”</p>
      </article>
    );
  }
  if (event.kind === 'reminder') {
    const m = ownerReminder(owner.split(' ')[0]!, event.n ?? 1, of);
    return (
      <article className="sent ink">
        <p className="sent-meta">{when} · to {owner}</p>
        <p className="sent-subject">{m.subject}</p>
        <p className="sent-body">{m.body}</p>
      </article>
    );
  }
  const m = holderMessage(owner, holders[0]!);
  return (
    <article className="sent sent-notify ink">
      <p className="sent-meta">
        {when} · to {holders.join(', ')}
      </p>
      <p className="sent-subject">{m.subject}</p>
      <p className="sent-body">{m.body.split('\n\n').slice(1, 3).join(' ')}</p>
    </article>
  );
}
