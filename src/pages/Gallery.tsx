import { useState } from 'react';
import { COSTUMES, EMBLEMS } from '../core/buddy.ts';
import { Candle } from '../ui/art/Candle.tsx';
import { Sparkles, Stars } from '../ui/art/Decor.tsx';
import { Ghost, type Mood } from '../ui/art/Ghost.tsx';
import { Jar, type JarState } from '../ui/art/Jar.tsx';
import { WaxSeal, type WaxState } from '../ui/art/WaxSeal.tsx';
import { useAtmosphere } from '../ui/shell.tsx';

const MOODS: Mood[] = ['open', 'curious', 'happy', 'sleep', 'wow', 'worried', 'sad', 'wink', 'boo', 'laugh'];

/** The cast, for design review. Not linked from the app: open #/gallery. */
export function Gallery() {
  const [night, setNight] = useState(false);
  useAtmosphere(night ? 'night' : 'day');
  const [jar, setJar] = useState<JarState>('sealed');
  const [wax, setWax] = useState<WaxState>('whole');
  const [burst, setBurst] = useState(0);
  return (
    <div className="page gallery">
      {night && <Stars />}
      <div className="wrap stack" style={{ '--gap': '40px' } as React.CSSProperties}>
        <div className="row">
          <h1>The cast</h1>
          <button className="btn small" onClick={() => setNight(!night)}>
            {night ? 'Day' : 'Night'}
          </button>
        </div>
        <div className="row" style={{ gap: 24 }}>
          {COSTUMES.map((c, i) => (
            <div key={c} className="center">
              <Ghost costume={c} emblem={EMBLEMS[i]} size={110} float phase={i * 0.7} shadow />
              <p className="faint">{c}</p>
            </div>
          ))}
        </div>
        <div className="row" style={{ gap: 24 }}>
          {MOODS.map((m, i) => (
            <div key={m} className="center">
              <Ghost mood={m} size={96} float phase={i} />
              <p className="faint">{m}</p>
            </div>
          ))}
        </div>
        <div className="row" style={{ gap: 24 }}>
          <Ghost mood="sleep" nightcap size={96} />
          <Ghost look={{ x: -1, y: 0 }} size={96} />
          <Ghost look={{ x: 1, y: 0 }} size={96} />
          <Ghost look={{ x: 0, y: -1 }} size={96} />
          <Ghost look={{ x: 0.7, y: 1 }} size={96} />
          <Ghost mood="boo" costume="vampire" size={96} />
          <Ghost mood="laugh" costume="pumpkin" size={96} />
        </div>
        <div className="row" style={{ gap: 24, background: '#fff', padding: 20, borderRadius: 24 }}>
          {COSTUMES.map((c, i) => (
            <Ghost key={c} costume={c} emblem={EMBLEMS[i + 2]} size={90} line />
          ))}
        </div>
        <div className="row" style={{ gap: 30, alignItems: 'flex-end' }}>
          <Candle lit={false} size={70} />
          <Candle lit size={70} phase={0.4} />
          <Candle lit justLit size={70} phase={0.8} key={burst} />
          <div style={{ position: 'relative' }}>
            <Jar initials="JA" state={jar} wax={wax} warmth={jar === 'sealed' ? 0.2 : 1} size={240} />
            <Sparkles burst={burst} />
          </div>
          <WaxSeal initials="JA" size={90} state={wax} />
        </div>
        <div className="row">
          {(['sealed', 'stirring', 'open'] as const).map((s) => (
            <button key={s} className="btn small" onClick={() => setJar(s)}>
              {s}
            </button>
          ))}
          {(['whole', 'pressing', 'cracking', 'broken'] as const).map((s) => (
            <button key={s} className="btn small" onClick={() => setWax(s)}>
              {s}
            </button>
          ))}
          <button className="btn small primary" onClick={() => setBurst((b) => b + 1)}>
            Sparkle
          </button>
        </div>
      </div>
    </div>
  );
}
