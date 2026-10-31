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
export function Jar({ state = 'sealed', warmth = 0, initials, wax = 'whole', size = 220, label }: JarProps) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const mood: Mood = state === 'open' ? 'happy' : state === 'stirring' ? 'open' : 'sleep';
  const style = { width: size, height: (size * 240) / 200, '--warmth': warmth } as CSSProperties;

  return (
    <div className={`jar jar-${state}`} style={style} role="img" aria-label={label ?? (state === 'open' ? 'The jar is open and the ghost is free' : 'A sealed jar with a ghost asleep inside')}>
      <svg className="jar-back" viewBox="0 0 200 240" aria-hidden="true">
        <defs>
          <radialGradient id={`inner${id}`} cx="50%" cy="62%" r="55%">
            <stop offset="0%" stopColor="#ffe08a" stopOpacity={0.15 + warmth * 0.8} />
            <stop offset="100%" stopColor="#ffb547" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="100" cy="226" rx="70" ry="9" fill="#000" opacity="0.18" />
        {/* Back of the glass */}
        <path
          d="M58 84 C32 90 22 110 22 134 L22 190 C22 210 38 222 62 222 L138 222 C162 222 178 210 178 190 L178 134 C178 110 168 90 142 84 Z"
          fill="#e9ddff"
          opacity="0.28"
        />
        <ellipse className="jar-light" cx="100" cy="160" rx="70" ry="64" fill={`url(#inner${id})`} />
      </svg>

      <div className="jar-ghost">
        <Ghost mood={mood} size={size * 0.42} float phase={1.3} />
        {state === 'sealed' && (
          <span className="jar-zzz" aria-hidden="true">
            <i>z</i>
            <i>z</i>
            <i>z</i>
          </span>
        )}
      </div>

      <svg className="jar-front" viewBox="0 0 200 240" aria-hidden="true">
        {/* Front of the glass: outline and shine */}
        <path
          d="M58 84 C32 90 22 110 22 134 L22 190 C22 210 38 222 62 222 L138 222 C162 222 178 210 178 190 L178 134 C178 110 168 90 142 84 Z"
          fill="#f4eeff"
          fillOpacity="0.16"
          stroke="#cdb8ff"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path d="M44 128 L44 186" stroke="#fff" strokeOpacity="0.75" strokeWidth="7" strokeLinecap="round" />
        <circle cx="44" cy="112" r="4" fill="#fff" opacity="0.75" />
        <path d="M156 150 L156 190" stroke="#fff" strokeOpacity="0.3" strokeWidth="5" strokeLinecap="round" />
        {/* Rim */}
        <rect x="50" y="66" width="100" height="22" rx="11" fill="#dccbff" stroke="#cdb8ff" strokeWidth="4" />
        <path d="M62 72 L92 72" stroke="#fff" strokeOpacity="0.7" strokeWidth="4" strokeLinecap="round" />
      </svg>

      <svg className="jar-cork" viewBox="0 0 200 240" aria-hidden="true">
        <path d="M64 70 L68 34 C69 26 75 22 82 22 L118 22 C125 22 131 26 132 34 L136 70 Z" fill="#d9a066" />
        <path d="M68 34 C69 26 75 22 82 22 L118 22 C125 22 131 26 132 34 Z" fill="#e8b781" />
        <circle cx="84" cy="48" r="2.4" fill="#b8803f" />
        <circle cx="104" cy="56" r="2" fill="#b8803f" />
        <circle cx="116" cy="42" r="2.4" fill="#b8803f" />
        <circle cx="94" cy="36" r="1.8" fill="#b8803f" />
      </svg>

      <div className="jar-seal">
        <WaxSeal initials={initials} state={wax} size={size * 0.27} />
      </div>
    </div>
  );
}
