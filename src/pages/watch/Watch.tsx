import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { DEFAULT_WATCH, holderMessage, ownerReminder, runWatch, type OwnerAction, type WatchConfig, type WatchEvent, type WatchStatus } from '../../core/watch.ts';
import { DEMO_JAR } from '../../demo/demo.ts';
import { Ghost, type Mood } from '../../ui/art/Ghost.tsx';
import { numberWord, plural } from '../../ui/text.ts';
import { useAtmosphere } from '../../ui/shell.tsx';
import { sound } from '../../ui/sound.ts';
import { watchAvailable } from '../../ui/watchApi.ts';
import { LinkAction, linkActionOf, ResendManage, StartWatch } from './RealWatch.tsx';

const OWNER = DEMO_JAR.owner;
const FIRST = OWNER.split(' ')[0]!;
const HOLDERS = DEMO_JAR.holders.map((h) => h.name);

const MOOD: Record<WatchStatus, { mood: Mood; say: string }> = {
  well: { mood: 'happy', say: 'All good! See you soon.' },
  paused: { mood: 'sleep', say: 'Resting while you’re away.' },
  due: { mood: 'curious', say: 'Still here?' },
  reminding: { mood: 'worried', say: 'Hello? Just tap to say you’re okay.' },
  notified: { mood: 'sad', say: 'I’ve asked your friends to check on you.' },
};

function Segmented<T extends number>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="segmented-field">
      <span className="label">{label}</span>
      <div className="segmented" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button key={o.value} type="button" role="radio" aria-checked={value === o.value} className={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Watch({ params }: { params: URLSearchParams }) {
  useAtmosphere('day');
  const [service, setService] = useState<boolean | null>(null);
  useEffect(() => {
    void watchAvailable().then(setService);
  }, []);
  const [config, setConfig] = useState<WatchConfig>(DEFAULT_WATCH);
  const [actions, setActions] = useState<OwnerAction[]>([]);
  const [day, setDay] = useState(0);
  const [playing, setPlaying] = useState(false);

  const horizon = Math.max(21, Math.ceil((config.cadenceDays + config.graceDays + 7) / 7) * 7);
  const run = useMemo(() => runWatch(config, actions, day), [config, actions, day]);
  const full = useMemo(() => runWatch(config, actions, horizon), [config, actions, horizon]);
  const paused = run.status === 'paused';
  // Back after friends were asked: they are told all is well.
  const relieved = run.status === 'well' && run.events.some((e) => e.kind === 'notify' && e.at < run.lastSign);
  const face = relieved ? { mood: 'happy' as Mood, say: 'Phew! I told your friends you’re okay.' } : MOOD[run.status];

  useEffect(() => {
    if (!playing) return;
    const t = window.setInterval(() => {
      setDay((d) => {
        if (d >= horizon) {
          setPlaying(false);
          return d;
        }
        return Math.round((d + 0.125) * 1000) / 1000;
      });
    }, 70);
    return () => clearInterval(t);
  }, [playing, horizon]);

  // A soft sound whenever a new message goes out.
  const sent = run.events.filter((e) => e.kind === 'reminder' || e.kind === 'notify').length;
  const lastSent = useRef(0);
  useEffect(() => {
    if (sent > lastSent.current) sound.strike();
    lastSent.current = sent;
  }, [sent]);

  const act = (type: OwnerAction['type']) => {
    setActions((a) => [...a, { at: day, type }]);
    if (type === 'checkin') sound.chime();
  };

  const reset = () => {
    setPlaying(false);
    setActions([]);
    setDay(0);
  };

  const messages = run.events.filter((e) => e.kind === 'reminder' || e.kind === 'notify' || e.kind === 'checkin' || e.kind === 'pause' || e.kind === 'resume');
  // Like a chat: the newest message is always in view.
  const inbox = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const el = inbox.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);
  const pct = (at: number) => `${(Math.min(at, horizon) / horizon) * 100}%`;
  const remindersNow = run.events.filter((e) => e.kind === 'reminder' && e.at > run.lastSign).length;

  // Opened from an emailed link: that link is the page; the preview follows.
  const linked = !!linkActionOf(params);
  // Where the watch service runs, starting a real watch comes first, beside the rhythm it will use.
  const realFirst = service === true && !linked;

  return (
    <div className="page watch-page">
      {linked ? (
        <div className="narrow">
          <LinkAction params={params} />
          <h2 className="center section-title how-it-works">How the watch works</h2>
        </div>
      ) : (
        <section className="narrow center watch-head">
          <div className="watch-hero">
            <div className="speech pop" key={relieved ? 'relieved' : run.status}>
              {face.say}
            </div>
            <Ghost mood={face.mood} size={130} float shadow />
          </div>
          <p className="tag">watch</p>
          <h1>Still here?</h1>
          <p className="lede">
            One gentle question now and then. Go quiet, and your friends are asked to look in on you.
          </p>
        </section>
      )}

      <section className="wrap watch-grid">
        <div className="card rhythm">
          <h2 className="card-title">Your rhythm</h2>
          <Segmented
            label="Ask me every"
            value={config.cadenceDays}
            options={[
              { value: 1, label: 'day' },
              { value: 3, label: '3 days' },
              { value: 7, label: 'week' },
              { value: 14, label: '2 weeks' },
              { value: 30, label: 'month' },
            ]}
            onChange={(cadenceDays) => setConfig({ ...config, cadenceDays })}
          />
          <Segmented
            label="Wait for my answer"
            value={config.graceDays}
            options={[2, 4, 7, 14].map((v) => ({ value: v, label: `${v}d` }))}
            onChange={(graceDays) => setConfig({ ...config, graceDays })}
          />
          <Segmented
            label="Remind me"
            value={config.reminders}
            options={[1, 2, 3, 5].map((v) => ({ value: v, label: `${v}×` }))}
            onChange={(reminders) => setConfig({ ...config, reminders })}
          />
          <p className="rhythm-sum">
            Friends are asked only after <b>{config.cadenceDays + config.graceDays} days</b> of silence and <b>{numberWord(config.reminders)}</b>{' '}
            reminder{config.reminders > 1 ? 's' : ''}. Never sooner.
          </p>
        </div>

        <div className="watch-main">
          {realFirst && (
            <>
              <StartWatch config={config} />
              <ResendManage />
              <h2 className="section-title how-title">See how it works</h2>
            </>
          )}
          <div className="card timeline">
            <div className="spread">
              <h2 className="card-title">
                <span className="tag try-tag">try it</span> Day <span className="day-num">{Math.floor(day)}</span>
              </h2>
              <span className={`status-pill s-${run.status}`}>
                {run.status === 'reminding' ? `reminder ${remindersNow} of ${config.reminders}` : run.status === 'notified' ? 'friends asked' : run.status}
              </span>
            </div>

            <div className="track" aria-label={`Day ${Math.floor(day)} of ${horizon}`}>
              <div className="track-line" />
              <div className="track-past" style={{ width: pct(day) }} />
              {Array.from({ length: horizon + 1 }, (_, d) => (
                <span key={d} className={`day${d % 7 === 0 ? ' week' : ''}`} style={{ left: pct(d) }}>
                  {d % 7 === 0 && <i>{d}</i>}
                </span>
              ))}
              {full.events
                .filter((e) => e.at <= horizon)
                .map((e, i) => (
                  <span key={i} className={`mark m-${e.kind}${e.at <= day ? ' passed' : ''}`} style={{ left: pct(e.at) }} title={`${e.kind}, day ${e.at.toFixed(1)}`} />
                ))}
              <span className="walker" style={{ left: pct(day) } as CSSProperties} aria-hidden="true">
                <Ghost mood={face.mood} size={54} float />
              </span>
            </div>

            <div className="legend">
              <span>
                <i className="m-checkin" /> you said hi
              </span>
              <span>
                <i className="m-due" /> a hello is due
              </span>
              <span>
                <i className="m-reminder" /> a reminder
              </span>
              <span>
                <i className="m-notify" /> friends asked
              </span>
            </div>

            <div className="row controls">
              <button type="button" className="btn primary small" onClick={() => setPlaying(!playing)} disabled={day >= horizon}>
                {playing ? 'Pause time' : day >= horizon ? 'That’s all' : 'Let time pass'}
              </button>
              <button type="button" className="btn small" onClick={() => act('checkin')} disabled={paused}>
                I’m here
              </button>
              <button type="button" className="btn small" onClick={() => act(paused ? 'resume' : 'pause')}>
                {paused ? 'Resume' : 'Pause, I’m away'}
              </button>
              <button type="button" className="text-btn quiet" onClick={reset}>
                Start over
              </button>
            </div>
          </div>

          <section className="card inbox" aria-labelledby="inbox-title">
            <div className="spread">
              <h2 id="inbox-title" className="card-title">
                What would be sent
              </h2>
              <span className="faint">{messages.length > 0 && `${messages.length} ${plural(messages.length, 'message')}`}</span>
            </div>
            {messages.length === 0 ? (
              <div className="inbox-empty">
                <Ghost mood="sleep" size={56} float />
                <p className="faint">Quiet so far. Let time pass, and don’t answer.</p>
              </div>
            ) : (
              <ol className="inbox-list" ref={inbox} tabIndex={0} aria-label="Messages, oldest first">
                {messages.map((e, i) => (
                  <Message key={`${e.kind}-${e.at}-${e.n ?? 0}`} event={e} of={config.reminders} silentDays={config.cadenceDays + config.graceDays} afterNotify={e.kind === 'checkin' && messages[i - 1]?.kind === 'notify'} />
                ))}
              </ol>
            )}
            <p className="inbox-foot faint">
              A preview with June’s demo jar: nothing here is really sent. A real watch knows names, email addresses and times, never what your jar
              says.
            </p>
          </section>
        </div>
      </section>

      <div className="narrow service">
        {service === false && (
          <p className="note">
            <Ghost size={30} mood="sleep" />
            <span>
              This copy of Phylactery has no watch service (the offline jar file never does), so here you can only try the rhythm. Everything else works.
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

const friendsLine = HOLDERS.map((h) => h.split(' ')[0]).join(', ');

function Message({ event, of, silentDays, afterNotify = false }: { event: WatchEvent; of: number; silentDays: number; afterNotify?: boolean }) {
  const when = `day ${Math.floor(event.at)}`;
  if (event.kind === 'checkin' || event.kind === 'pause' || event.kind === 'resume') {
    const text = event.kind === 'checkin' ? 'I’m here!' : event.kind === 'pause' ? 'Away for a while.' : 'Back again!';
    return (
      <>
        <li className="msg from-owner pop">
          <span className="msg-meta">
            {FIRST} · {when}
          </span>
          <p>{text}</p>
        </li>
        {afterNotify && (
          <li className="msg to-friends relief pop">
            <span className="msg-meta">
              to {friendsLine} · {when}
            </span>
            <p className="msg-title">{OWNER} is okay</p>
            <p>Good news: {OWNER} just answered us. All is well, and there is nothing more to do. Thank you for caring.</p>
          </li>
        )}
      </>
    );
  }
  if (event.kind === 'reminder') {
    const m = ownerReminder(FIRST, event.n ?? 1, of);
    return (
      <li className="msg to-owner pop">
        <span className="msg-meta">to {FIRST} · {when}</span>
        <p className="msg-title">{m.subject}</p>
        <p>{m.body}</p>
      </li>
    );
  }
  const m = holderMessage(OWNER, HOLDERS[0]!, { days: silentDays, asked: of + 1 });
  return (
    <li className="msg to-friends pop">
      <span className="msg-meta">
        to {friendsLine} · {when}
      </span>
      <p className="msg-title">{m.subject}</p>
      <p>{m.body.split('\n\n').slice(1, 3).join(' ')}</p>
    </li>
  );
}
