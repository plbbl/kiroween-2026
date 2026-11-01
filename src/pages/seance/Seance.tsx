import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { circleBuddies, type Buddy } from '../../core/buddy.ts';
import { CardError, parseCard, type Shard } from '../../core/cards.ts';
import { checkShard, JarError, jarIdBytes, openJar, type JarFile, type JarHolder, type OpenedJar } from '../../core/jar.ts';
import { DEMO_CARDS, DEMO_JAR, isDemo } from '../../demo/demo.ts';
import { Candle } from '../../ui/art/Candle.tsx';
import { Bat, Pumpkin } from '../../ui/art/Spooky.tsx';
import { Sparkles } from '../../ui/art/Decor.tsx';
import { Ghost } from '../../ui/art/Ghost.tsx';
import { Jar, type JarState } from '../../ui/art/Jar.tsx';
import { initialsOf, type WaxState } from '../../ui/art/WaxSeal.tsx';
import { BuddyCard } from '../../ui/components/Cards.tsx';
import { capitalised, numberWord } from '../../ui/text.ts';
import { CardInput } from '../../ui/components/CardInput.tsx';
import { ConfirmButton } from '../../ui/components/Confirm.tsx';
import { jarFromText } from '../../ui/grimoire.ts';
import { href, useAtmosphere, useFocusOnArrival, useLeaveWarning, useShell, wait } from '../../ui/shell.tsx';
import { sound } from '../../ui/sound.ts';
import { watchApi } from '../../ui/watchApi.ts';
import { Reveal } from './Reveal.tsx';

const REFUSALS: Record<string, string> = {
  'other-jar': 'That card belongs to a different jar.',
  'unknown-holder': 'That card doesn’t match anyone in this circle.',
  duplicate: 'That card is already here.',
};

export function Seance({ embedded, params }: { embedded: JarFile | null; params: URLSearchParams }) {
  useAtmosphere('night', null);
  const shell = useShell();
  const [jar, setJar] = useState<JarFile | null>(embedded);
  // A friend's link from the watch's email: the jar the owner left with it.
  const token = embedded ? null : params.get('jar');
  const [fetching, setFetching] = useState(!!token);
  const [linkError, setLinkError] = useState('');
  useEffect(() => {
    if (!token) return;
    let live = true;
    watchApi
      .openJar(token)
      .then((j) => live && setJar(j))
      .catch((e) => live && setLinkError(e instanceof Error ? e.message : 'That link did not open a jar.'))
      .finally(() => live && setFetching(false));
    return () => {
      live = false;
    };
  }, [token]);

  useEffect(() => {
    sound.startDrone();
    return () => {
      sound.stopDrone();
      shell.setCandlelight(0);
    };
  }, [shell]);

  if (fetching) {
    return (
      <div className="page seance-page">
        <section className="narrow center">
          <Ghost mood="open" size={110} float />
          <p className="lede">Fetching the jar…</p>
        </section>
      </div>
    );
  }
  if (!jar) return <Choose onChoose={setJar} notice={linkError} />;
  return <Circle jar={jar} key={jar.jarId} onLeave={embedded ? undefined : () => setJar(null)} />;
}

function Choose({ onChoose, notice = '' }: { onChoose: (jar: JarFile) => void; notice?: string }) {
  const [error, setError] = useState(notice);
  const [over, setOver] = useState(false);

  const readFile = async (file: File) => {
    setError('');
    try {
      onChoose(jarFromText(await file.text()));
    } catch (e) {
      setError(e instanceof JarError ? e.message : 'That file isn’t a jar.');
    }
  };

  return (
    <div className="page seance-page">
      <section className="narrow center">
        <p className="tag pop">séance</p>
        <h1 className="pop" style={{ '--d': '100ms' } as CSSProperties}>
          Gather around
        </h1>
        <p className="lede rise" style={{ '--d': '200ms' } as CSSProperties}>
          Each friend’s card lights a candle. Enough candles, and the little ghost wakes up.
        </p>
      </section>

      <section className="choose wrap">
        <button type="button" className="choose-card card pop" style={{ '--d': '300ms' } as CSSProperties} onClick={() => onChoose(DEMO_JAR)}>
          <span className="choose-art">
            <Jar initials="JA" size={130} warmth={0.4} />
          </span>
          <span className="tag">try it</span>
          <span className="choose-title">June’s jar</span>
          <span className="muted">June sealed hers with five cards. They’re on the table. Any three open it.</span>
        </button>

        <label
          className={`choose-card card drop pop${over ? ' over' : ''}`}
          style={{ '--d': '420ms' } as CSSProperties}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            const f = e.dataTransfer.files[0];
            if (f) void readFile(f);
          }}
        >
          <input
            type="file"
            accept=".html,.json,text/html,application/json"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void readFile(f);
              e.target.value = '';
            }}
          />
          <span className="choose-art">
            <Ghost costume="witch" mood="wow" size={92} float />
          </span>
          <span className="tag">your circle</span>
          <span className="choose-title">A jar you were given</span>
          <span className="muted">Drop the jar file here, or tap to choose it. It is read on this device and nowhere else.</span>
        </label>
      </section>
      {error && (
        <p className="error center" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

interface Offered {
  shard: Shard;
  holder: JarHolder;
}

type Phase = 'gathering' | 'waking' | 'open' | 'revealed';

/**
 * Candles stand evenly around the rug. 90° is the front, nearest the
 * viewer; no candle stands right behind the jar.
 */
function candleAngles(k: number): number[] {
  const start = k % 2 === 1 ? 90 : 90 + 180 / k;
  return Array.from({ length: k }, (_, i) => (start + (i * 360) / k) % 360);
}

interface Flight {
  buddy: Buddy;
  from: DOMRect;
  to: DOMRect;
  id: number;
}

/** A buddy flying from a card on the table to its candle. */
function FlyingBuddy({ flight, onDone }: { flight: Flight; onDone: () => void }) {
  const [arrived, setArrived] = useState(false);
  useLayoutEffect(() => {
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setArrived(true)));
    const t = setTimeout(onDone, 720);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [onDone]);
  const size = 70;
  const at = arrived ? flight.to : flight.from;
  const style = {
    left: at.left + at.width / 2 - size / 2,
    top: at.top + at.height / 2 - size / 2,
    transform: arrived ? 'scale(0.7) rotate(-8deg)' : 'scale(1.1)',
  } as CSSProperties;
  return (
    <div className="flying" style={style} aria-hidden="true">
      <Ghost costume={flight.buddy.costume} emblem={flight.buddy.emblem} mood="happy" size={size} />
    </div>
  );
}

function Circle({ jar, onLeave }: { jar: JarFile; onLeave?: () => void }) {
  const shell = useShell();
  const [offered, setOffered] = useState<Offered[]>([]);
  const [justLit, setJustLit] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('gathering');
  const [wax, setWax] = useState<WaxState>('whole');
  const [opened, setOpened] = useState<OpenedJar | null>(null);
  const [announce, setAnnounce] = useState('');
  const [failure, setFailure] = useState('');
  const [burst, setBurst] = useState(0);
  const [flight, setFlight] = useState<Flight | null>(null);
  const candleRefs = useRef<(HTMLDivElement | null)[]>([]);
  // The latest circle, readable from callbacks without re-creating them.
  const offeredRef = useRef<Offered[]>([]);
  useEffect(() => {
    offeredRef.current = offered;
  }, [offered]);

  const k = jar.threshold;
  const demo = isDemo(jar);
  const heading = useFocusOnArrival();
  const angles = useMemo(() => candleAngles(k), [k]);
  const buddies = useMemo(() => circleBuddies(jarIdBytes(jar), jar.holders.map((h) => h.x)), [jar]);
  const first = jar.owner.split(/\s+/)[0] ?? jar.owner;
  const sealed = new Date(jar.sealedAt);
  const sealedOn = Number.isNaN(sealed.getTime()) ? '' : sealed.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  useEffect(() => {
    shell.setCandlelight(phase === 'gathering' ? offered.length / k : 1);
  }, [shell, offered.length, k, phase]);

  // Cards offered so far live only in this page.
  useLeaveWarning(
    !demo && phase === 'gathering' && offered.length > 0 ? 'Leaving puts the candles out, and the cards offered so far would be needed again. Leave anyway?' : null,
  );

  const open = useCallback(
    async (circle: Offered[]) => {
      setPhase('waking');
      setAnnounce('Every candle is lit. The jar is waking up.');
      try {
        const [result] = await Promise.all([openJar(jar, circle.map((o) => o.shard)), wait(1500)]);
        setWax('cracking');
        sound.crack();
        await wait(600);
        setWax('broken');
        setOpened(result);
        setPhase('open');
        setBurst((b) => b + 1);
        sound.pop();
        setTimeout(() => sound.chime(), 180);
        setAnnounce('The seal is broken. The jar is open.');
        await wait(2600);
        setPhase('revealed');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (e) {
        setPhase('gathering');
        setFailure(e instanceof Error ? e.message : 'The jar would not open.');
      }
    },
    [jar],
  );

  const offer = useCallback(
    (text: string, from?: DOMRect): string | null => {
      setFailure('');
      let card;
      try {
        card = parseCard(text);
      } catch (e) {
        return e instanceof CardError ? e.message : 'That card could not be read.';
      }
      if (card.kind === 'seal') return 'That’s a private seal, the smaller half cut from a card. Keep it for the letters.';
      if (card.kind === 'key') return `That’s ${first}’s own key. It opens the jar without the cards: choose Seal, then “Change what’s inside”.`;
      const current = offeredRef.current;
      if (current.length >= k) return 'Every candle is already lit.';
      const check = checkShard(jar, card, current.map((o) => o.shard));
      if (!check.ok) return REFUSALS[check.reason] ?? 'That card was refused.';
      const next = [...current, { shard: card, holder: check.holder }];
      offeredRef.current = next;
      const light = () => {
        setOffered(next);
        setJustLit(next.length - 1);
        sound.strike();
        setTimeout(() => sound.ignite(), 80);
        setAnnounce(`${check.holder.name} is here. ${next.length} of ${k} candles lit.`);
        if (next.length === k) void open(next);
      };
      const target = candleRefs.current[next.length - 1];
      const buddy = buddies.get(check.holder.x);
      if (from && target && buddy) {
        setFlight({ buddy, from, to: target.getBoundingClientRect(), id: Date.now() });
        setTimeout(light, 620);
      } else {
        light();
      }
      return null;
    },
    [jar, k, open, buddies, first],
  );

  const endFlight = useCallback(() => setFlight(null), []);

  if (phase === 'revealed' && opened) {
    return <Reveal jar={jar} opened={opened} circle={offered.map((o) => o.holder)} buddies={buddies} />;
  }

  const jarState: JarState = phase === 'open' ? 'open' : phase === 'waking' || offered.length > 0 ? 'stirring' : 'sealed';
  const remaining = k - offered.length;
  const here = new Set(offered.map((o) => o.holder.x));

  return (
    <div className={`page seance-page phase-${phase}`}>
      <p className="visually-hidden" aria-live="assertive">
        {announce}
      </p>
      {flight && <FlyingBuddy key={flight.id} flight={flight} onDone={endFlight} />}

      <section className="narrow center circle-head">
        <p className="tag pop">
          {sealedOn ? `sealed ${sealedOn}` : 'séance'}
          {jar.revision && jar.revision > 1 ? ` · version ${jar.revision}` : ''}
        </p>
        <h1 className="pop" style={{ '--d': '80ms' } as CSSProperties} tabIndex={-1} ref={heading}>
          {first}’s jar
        </h1>
        <p className="lede rise" style={{ '--d': '180ms' } as CSSProperties}>
          Any {numberWord(k)} of {numberWord(jar.total)} friends can open it.
        </p>
      </section>

      <div className="altar" style={{ '--lit': offered.length / k } as CSSProperties}>
        <svg className="rug" viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <radialGradient id="rug-fill" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3b2470" />
              <stop offset="100%" stopColor="#24163f" />
            </radialGradient>
          </defs>
          <ellipse cx="500" cy="150" rx="470" ry="138" fill="url(#rug-fill)" />
          <ellipse cx="500" cy="150" rx="440" ry="122" fill="none" stroke="#9b6dff" strokeOpacity="0.55" strokeWidth="3" strokeDasharray="1 12" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          {/* The ring warms to amber as the circle gathers. */}
          <ellipse className="rug-ring" cx="500" cy="150" rx="440" ry="122" fill="none" strokeWidth="4" strokeDasharray="1 12" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="altar-glow" />
        <Pumpkin lit size={58} className="altar-pumpkin left" />
        <Pumpkin lit size={46} className="altar-pumpkin right" />

        {angles.map((deg, i) => {
          const a = (deg * Math.PI) / 180;
          const x = 50 + Math.cos(a) * 40;
          const y = 62 + Math.sin(a) * 20;
          const o = offered[i];
          const buddy = o ? buddies.get(o.holder.x) : undefined;
          return (
            <div
              key={i}
              ref={(el) => {
                candleRefs.current[i] = el;
              }}
              className="spot"
              style={{ left: `${x}%`, top: `${y}%`, zIndex: Math.round(y * 10) } as CSSProperties}
            >
              {buddy && (
                <div className={`spot-buddy${Math.cos(a) < -0.2 ? ' left' : ''}${Math.abs(Math.cos(a)) <= 0.2 ? ' front' : ''}`}>
                  <Ghost costume={buddy.costume} emblem={buddy.emblem} tilt={buddy.tilt} mood={phase === 'open' ? 'happy' : 'open'} size={72} float phase={i * 0.7} rim={0.6} />
                </div>
              )}
              <Candle lit={!!o} justLit={justLit === i} phase={i * 0.83} size={74} label={o ? `${o.holder.name}'s candle, lit` : 'A sleeping candle'} />
              <span className={`spot-name${o ? ' shown' : ''}`}>{o?.holder.name ?? ''}</span>
            </div>
          );
        })}

        <div className="altar-jar" style={{ zIndex: 600 }}>
          <Jar initials={initialsOf(jar.owner)} state={jarState} wax={wax} warmth={phase === 'gathering' ? offered.length / k : 1} size={210} />
          <Sparkles burst={burst} radius={200} count={22} />
          {/* When the cork pops, a few bats that were sleeping in the jar fly out. */}
          {phase === 'open' && (
            <span className="jar-bats" aria-hidden="true">
              <Bat size={46} color="#1d0f38" className="jar-bat b1" />
              <Bat size={34} color="#24133f" className="jar-bat b2" />
              <Bat size={28} color="#1d0f38" className="jar-bat b3" />
            </span>
          )}
        </div>
      </div>

      <section className="narrow offering">
        {phase === 'gathering' ? (
          <>
            {!demo && (
              <ul className="roster" aria-label="Who is here">
                {jar.holders.map((h) => {
                  const b = buddies.get(h.x)!;
                  return (
                    <li key={h.x} className={here.has(h.x) ? 'here' : ''}>
                      <Ghost costume={b.costume} emblem={b.emblem} mood={here.has(h.x) ? 'happy' : 'sleep'} size={30} />
                      <span>{h.name}</span>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="card offer-card">
              <h2 className="center">{offered.length === 0 ? 'Who’s here first?' : `${capitalised(numberWord(remaining))} more to go`}</h2>
              {demo && <DemoTable jar={jar} offered={offered} buddies={buddies} onOffer={offer} />}
              <CardInput kind="shard" onCard={(t) => offer(t)} />
              <p className="faint far-away">Someone far away? They can read you the 30 words on their card over the phone.</p>
              {failure && (
                <p className="error" role="alert">
                  {failure}
                </p>
              )}
            </div>
            {!demo && (
              <p className="note circle-note">
                <Ghost size={30} mood="wink" />
                <span>
                  {first} gave each of you a card. The jar opens only when {numberWord(k)} of you offer yours here, so if a card is lost, any{' '}
                  {numberWord(k)} of the {numberWord(jar.total)} still do. What you type stays on this device, and this page works without the internet.
                </span>
              </p>
            )}

            {!demo && !onLeave && (
              <p className="center faint owner-link">
                Sealed this jar yourself? <a href={`${href('seal')}?update`}>Update it with your key</a>.
              </p>
            )}
            {onLeave && (
              <p className="center">
                <ConfirmButton
                  label="Choose another jar"
                  question="Choosing another jar puts these candles out."
                  yes="Choose another"
                  no="Stay"
                  ask={offered.length > 0}
                  onConfirm={onLeave}
                />
              </p>
            )}
          </>
        ) : (
          <p className="center waking-text pop" key={phase}>
            {phase === 'waking' ? 'Wake up, little ghost…' : 'It’s open!'}
          </p>
        )}
      </section>
    </div>
  );
}

function DemoTable({
  jar,
  offered,
  buddies,
  onOffer,
}: {
  jar: JarFile;
  offered: Offered[];
  buddies: Map<number, Buddy>;
  onOffer: (text: string, from?: DOMRect) => string | null;
}) {
  const [note, setNote] = useState('');
  const [picked, setPicked] = useState<string | null>(null);
  const used = new Set(offered.map((o) => o.holder.name));
  return (
    <div className="demo-table">
      <p className="faint center">
        The cards are on the table.{' '}
        {offered.length === 0 ? `Tap any ${numberWord(jar.threshold)}.` : `Tap ${numberWord(jar.threshold - offered.length)} more.`}
      </p>
      <div className="demo-cards">
        {DEMO_CARDS.map((c, i) => {
          const holder = jar.holders.find((h) => h.name === c.name)!;
          return (
            <BuddyCard
              key={c.name}
              name={c.name}
              buddy={buddies.get(holder.x)!}
              index={i}
              total={DEMO_CARDS.length}
              className={`demo-card${used.has(c.name) ? ' used' : ''}${picked === c.name ? ' picked' : ''}`}
              disabled={used.has(c.name)}
              style={{ '--rot': `${[-4, 3, -2, 4, -3][i]}deg` } as CSSProperties}
              onClick={(e) => {
                const refused = onOffer(c.shard, e.currentTarget.getBoundingClientRect());
                setNote(refused ?? '');
                if (!refused) setPicked(c.name);
              }}
            />
          );
        })}
      </div>
      {note && <p className="error center">{note}</p>}
      <p className="faint center">or offer a real card below</p>
    </div>
  );
}
