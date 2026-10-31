import { useId, type CSSProperties } from 'react';
import { Ghost, type Mood } from './Ghost.tsx';
import { WaxSeal, type WaxState } from './WaxSeal.tsx';

export type JarState = 'sealed' | 'stirring' | 'open';

interface JarProps {
  state?: JarState;
  /** 0..1: how warm the light inside is; follows the candles. */
  warmth?: number;
  initials: string;
  wax?: WaxState;
  size?: number;
  label?: string;
}

/**
 * A little glass jar with a ghost asleep inside, a cork, and a wax seal.
 * When it opens, the cork pops, the seal falls away, and the ghost wakes
 * up and floats out.
 */
// A round-bellied jar with a short neck.
const GLASS = 'M66 86 C36 94 22 122 22 156 C22 198 48 226 100 226 C152 226 178 198 178 156 C178 122 164 94 134 86 Z';

export function Jar({ state = 'sealed', warmth = 0, initials, wax = 'whole', size = 220, label }: JarProps) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const mood: Mood = state === 'open' ? 'happy' : state === 'stirring' ? 'open' : 'sleep';
  const style = { width: size, height: (size * 240) / 200, '--warmth': warmth } as CSSProperties;

  const url = (n: string) => `url(#${n}${id})`;

  return (
    <div className={`jar jar-${state}`} style={style} role="img" aria-label={label ?? (state === 'open' ? 'The jar is open and the ghost is free' : 'A sealed jar with a ghost asleep inside')}>
      <svg className="jar-back" viewBox="0 0 200 240" aria-hidden="true">
        <defs>
          <radialGradient id={`inner${id}`} cx="50%" cy="62%" r="55%">
            <stop offset="0%" stopColor="#ffe08a" stopOpacity={0.15 + warmth * 0.8} />
            <stop offset="100%" stopColor="#ffb547" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`glass${id}`} cx="42%" cy="38%" r="70%">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.1" />
            <stop offset="0.7" stopColor="#e3d6ff" stopOpacity="0.22" />
            <stop offset="1" stopColor="#b9a0f2" stopOpacity="0.5" />
          </radialGradient>
          <radialGradient id={`floor${id}`}>
            <stop offset="0" stopColor="#2a1650" stopOpacity="0.3" />
            <stop offset="1" stopColor="#2a1650" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="100" cy="226" rx="84" ry="11" fill={url('floor')} />
        {/* Back of the glass, and the thick glass floor */}
        <path d={GLASS} fill={url('glass')} />
        <ellipse cx="100" cy="214" rx="56" ry="9" fill="#cdb8ff" opacity="0.4" />
        <ellipse className="jar-light" cx="100" cy="160" rx="70" ry="64" fill={`url(#inner${id})`} />
      </svg>

      <div className="jar-ghost">
        <Ghost mood={mood} size={size * 0.5} float phase={1.3} rim={0.15 + warmth * 0.5} />
        {state === 'sealed' && (
          <span className="jar-zzz" aria-hidden="true">
            <i>z</i>
            <i>z</i>
            <i>z</i>
          </span>
        )}
      </div>

      <svg className="jar-front" viewBox="0 0 200 240" aria-hidden="true">
        <defs>
          <linearGradient id={`edge${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="0.5" stopColor="#d6c4ff" stopOpacity="0.9" />
            <stop offset="1" stopColor="#a585f0" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id={`shine${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
            <stop offset="1" stopColor="#fff" stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id={`twine${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e2b77a" />
            <stop offset="1" stopColor="#a8743c" />
          </linearGradient>
          <linearGradient id={`lip${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f6f0ff" />
            <stop offset="0.5" stopColor="#d9c8ff" />
            <stop offset="1" stopColor="#b79cf5" />
          </linearGradient>
        </defs>
        {/* Front of the glass: a soft edge and its shine */}
        <path d={GLASS} fill="#f6f0ff" fillOpacity="0.1" stroke={url('edge')} strokeWidth="4.5" strokeLinejoin="round" />
        <path d="M46 128 C35 148 36 178 48 200" fill="none" stroke={url('shine')} strokeWidth="9" strokeLinecap="round" />
        <circle cx="58" cy="112" r="4.5" fill="#fff" opacity="0.85" />
        <path d="M58 104 C66 99 74 97 82 96" fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M160 136 C168 154 167 178 158 196" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="5" strokeLinecap="round" />
        <path d="M60 218 C82 224 118 224 140 218" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="3" strokeLinecap="round" />
        {/* The rim */}
        <rect x="54" y="64" width="92" height="24" rx="12" fill={url('lip')} />
        <rect x="54" y="64" width="92" height="24" rx="12" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.5" />
        <path d="M64 71 L96 71" stroke="#fff" strokeOpacity="0.85" strokeWidth="4" strokeLinecap="round" />
        {/* Twine round the neck */}
        <g fill="none" strokeLinecap="round">
          <path d="M60 92 Q100 100 140 92" stroke={url('twine')} strokeWidth="4.5" />
          <path d="M61 99 Q100 107 139 99" stroke={url('twine')} strokeWidth="4.5" />
          <path d="M70 94 L74 96 M86 97 L90 98 M110 98 L114 97 M126 96 L130 94" stroke="#7a4d22" strokeOpacity="0.5" strokeWidth="1.4" />
        </g>
      </svg>

      <svg className="jar-cork" viewBox="0 0 200 240" aria-hidden="true">
        <defs>
          <linearGradient id={`cork${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#efc28d" />
            <stop offset="0.45" stopColor="#d9a066" />
            <stop offset="1" stopColor="#aa7238" />
          </linearGradient>
          <radialGradient id={`corkTop${id}`} cx="45%" cy="40%" r="70%">
            <stop offset="0" stopColor="#f6d3a6" />
            <stop offset="1" stopColor="#d9a468" />
          </radialGradient>
        </defs>
        <path d="M66 70 L69 30 C69 26 75 24 83 24 L117 24 C125 24 131 26 131 30 L134 70 C120 75 80 75 66 70 Z" fill={url('cork')} />
        <ellipse cx="100" cy="27" rx="31" ry="7" fill={url('corkTop')} />
        <g fill="#9c6630" opacity="0.55">
          <circle cx="82" cy="46" r="2.2" />
          <circle cx="104" cy="56" r="1.8" />
          <circle cx="118" cy="42" r="2.2" />
          <circle cx="92" cy="62" r="1.6" />
          <circle cx="90" cy="27" r="1.6" />
          <circle cx="110" cy="26" r="1.3" />
        </g>
        <path d="M72 36 L70 64" stroke="#fff" strokeOpacity="0.35" strokeWidth="4" strokeLinecap="round" />
      </svg>

      <div className="jar-seal">
        <WaxSeal initials={initials} state={wax} size={size * 0.27} />
      </div>
    </div>
  );
}
