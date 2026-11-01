import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Candle } from '../ui/art/Candle.tsx';
import { Ghost } from '../ui/art/Ghost.tsx';
import { Jar } from '../ui/art/Jar.tsx';
import { Lantern } from '../ui/art/Spooky.tsx';
import { prefersReducedMotion } from '../ui/shell.tsx';

// The whole idea in about twenty seconds, told by the cast: write, seal,
// hand out cards, keep watch, gather. Each scene plays its own little moves;
// the stage moves on by itself, and can be paused or stepped through.

interface Scene {
  title: string;
  line: string;
  ms: number;
}

const SCENES: Scene[] = [
  { title: 'Write', line: 'Write what your people will need: logins, where things are, a letter or two.', ms: 3600 },
  { title: 'Seal', line: 'Seal it in a jar. It’s locked in your browser: no one can read it, not even us.', ms: 3800 },
  { title: 'Share', line: 'Print a card for each friend. Any two of them, together, can open it.', ms: 3800 },
  { title: 'Watch', line: 'Now and then we ask if you’re still here. Go quiet, and your friends are asked to look in on you.', ms: 4200 },
  { title: 'Gather', line: 'When the time comes, they gather, light their candles, and the ghost hands over your words.', ms: 5200 },
];

const at = (left: number, top: number, extra?: CSSProperties) => ({ left: `${left}%`, top: `${top}%`, ...extra }) as CSSProperties;

/** Time since the scene began, in steps of a tenth of a second, so each scene can stage its beats. */
function useSceneClock(scene: number, running: boolean) {
  const [t, setT] = useState(0);
  const start = useRef(0);
  useEffect(() => {
    start.current = performance.now();
    const id = window.setInterval(() => setT(Math.round((performance.now() - start.current) / 100) * 100), 100);
    return () => {
      clearInterval(id);
      setT(0);
    };
  }, [scene]);
  return running ? t : 10000;
}

function Write({ t }: { t: number }) {
  const lines = ['Bank: blue notebook, p. 3', 'Photos: shared album “Us”', 'Biscuit eats at seven', 'Dear Ben: the engine’s yours'];
  return (
    <>
      <div className="hiw-actor" style={at(30, 58)}>
        <Ghost mood="open" size={120} float look={{ x: 1, y: 0.3 }} />
      </div>
      <div className="hiw-note" style={at(62, 52)}>
        {lines.map((l, i) => (
          <span key={l} className={t > 300 + i * 650 ? 'shown' : ''}>
            {l}
          </span>
        ))}
      </div>
    </>
  );
}

function Seal({ t }: { t: number }) {
  const corked = t > 1300;
  return (
    <>
      <div className={`hiw-note small${t > 300 ? ' into-jar' : ''}`} style={at(26, 40)}>
        <span className="shown">Bank: blue notebook…</span>
        <span className="shown">Dear Ben…</span>
      </div>
      <div className="hiw-actor" style={at(50, 56)}>
        <Jar initials="ME" size={170} corked={corked} wax={t > 2000 ? 'whole' : 'none'} state={corked ? 'sealed' : 'stirring'} mood={corked ? 'sleep' : 'happy'} warmth={0.5} label="" />
      </div>
      {t > 2000 && <span className="hiw-stamp" style={at(50, 30)}>sealed</span>}
    </>
  );
}

const FRIENDS = [
  { costume: 'witch', x: 60 },
  { costume: 'pumpkin', x: 75 },
  { costume: 'vampire', x: 90 },
] as const;

function Share({ t }: { t: number }) {
  return (
    <>
      <div className="hiw-actor" style={at(24, 56)}>
        <Jar initials="ME" size={150} mood="sleep" label="" />
      </div>
      {FRIENDS.map((f, i) => (
        <div key={f.costume} className="hiw-actor" style={at(f.x, 50)}>
          <Ghost costume={f.costume} mood={t > 900 + i * 450 ? 'happy' : 'open'} size={86} float phase={i} look={{ x: -1, y: 0 }} />
        </div>
      ))}
      {FRIENDS.map((f, i) => (
        <span
          key={f.costume}
          className={`hiw-card${t > 400 + i * 450 ? ' flown' : ''}`}
          style={{ ...at(f.x, 80), '--from': `${(24 - f.x) * 9}px` } as CSSProperties}
        >
          <i />
        </span>
      ))}
      {t > 2200 && (
        <span className="hiw-badge" style={at(75, 16)}>
          any 2 of 3
        </span>
      )}
    </>
  );
}

function Watch({ t }: { t: number }) {
  return (
    <>
      <div className="hiw-actor" style={at(34, 56)}>
        <Ghost mood={t > 1800 ? 'happy' : 'curious'} size={120} float />
        <Lantern size={30} className="hiw-lantern" />
      </div>
      {t > 300 && (
        <span className="hiw-bubble" style={at(34, 18)}>
          Still here?
        </span>
      )}
      <div className="hiw-actor" style={at(70, 58)}>
        <Ghost costume="franken" mood={t > 1200 ? 'laugh' : 'sleep'} size={104} float phase={1} />
      </div>
      <span className="hiw-badge you" style={at(70, 88)}>
        you
      </span>
      {t > 1200 && (
        <span className="hiw-bubble right" style={at(72, 22)}>
          Yes! I’m here!
        </span>
      )}
    </>
  );
}

function Gather({ t }: { t: number }) {
  const lit = [t > 300, t > 900, t > 1500];
  const open = t > 2300;
  const seats: [number, number, 'witch' | 'pumpkin' | 'vampire'][] = [
    [24, 62, 'witch'],
    [76, 62, 'pumpkin'],
    [50, 86, 'vampire'],
  ];
  return (
    <>
      <div className="hiw-rug" />
      <div className="hiw-actor" style={at(50, 50)}>
        <Jar
          initials="ME"
          size={150}
          state={open ? 'open' : lit.some(Boolean) ? 'stirring' : 'sealed'}
          wax={open ? 'broken' : 'whole'}
          warmth={lit.filter(Boolean).length / 3}
          mood={open ? (t > 3300 ? 'laugh' : 'boo') : undefined}
          rattle={t > 1700 && !open}
          notes={false}
          label=""
        />
      </div>
      {open && (
        <span className="hiw-bubble right" style={at(66, 10)}>
          {t > 3300 ? 'Hello, friends!' : 'BOO!'}
        </span>
      )}
      {seats.map(([x, y, costume], i) => (
        <div key={costume} className="hiw-seat" style={at(x, y)}>
          {lit[i] && <Ghost costume={costume} mood="happy" size={52} float phase={i} className="hiw-seat-ghost" />}
          <Candle lit={lit[i]!} justLit={lit[i]} size={42} phase={i * 0.6} />
        </div>
      ))}
    </>
  );
}

export function HowItWorks() {
  const reduced = prefersReducedMotion();
  const [scene, setScene] = useState(0);
  const [playing, setPlaying] = useState(!reduced);
  const [visible, setVisible] = useState(false);
  const stage = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const running = playing && visible;

  // The scenes are drawn on an 860 × 430 canvas, scaled to fit the stage.
  useEffect(() => {
    const el = canvas.current?.parentElement;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => el.style.setProperty('--hiw-scale', String((e?.contentRect.width ?? 860) / 860)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const t = useSceneClock(scene, !reduced);

  // Only play while on screen.
  useEffect(() => {
    const el = stage.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setVisible(!!e?.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = window.setTimeout(() => setScene((s) => (s + 1) % SCENES.length), SCENES[scene]!.ms);
    return () => clearTimeout(id);
  }, [running, scene]);

  const views: ReactNode[] = [<Write t={t} />, <Seal t={t} />, <Share t={t} />, <Watch t={t} />, <Gather t={t} />];

  return (
    <section className="hiw wrap" ref={stage} aria-labelledby="hiw-title">
      <h2 id="hiw-title" className="center">
        How it works
      </h2>
      <div className="hiw-stage" aria-hidden="true">
        <div className="hiw-canvas" ref={canvas}>
          <div className="hiw-scene" key={scene}>
            {views[scene]}
          </div>
        </div>
      </div>
      <p className="hiw-line center" aria-live="off">
        <b>
          {scene + 1}. {SCENES[scene]!.title}.
        </b>{' '}
        {SCENES[scene]!.line}
      </p>
      <div className="hiw-controls">
        <ol className="hiw-dots" aria-label="Scenes">
          {SCENES.map((s, i) => (
            <li key={s.title}>
              <button type="button" className={i === scene ? 'on' : ''} aria-current={i === scene ? 'step' : undefined} onClick={() => setScene(i)}>
                {s.title}
              </button>
            </li>
          ))}
        </ol>
        <button type="button" className="text-btn quiet hiw-play" onClick={() => setPlaying(!playing)}>
          {playing ? 'Pause' : 'Play'}
        </button>
      </div>
    </section>
  );
}
