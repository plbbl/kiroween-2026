import { useId, type CSSProperties } from 'react';

interface CandleProps {
  lit: boolean;
  /** Plays the little burst once, right after lighting. */
  justLit?: boolean;
  /** Seconds; staggers the wobble so candles never move together. */
  phase?: number;
  size?: number;
  label?: string;
}

const INK = '#261d3a';

/**
 * A chubby wax candle with a face, on a little purple saucer. Unlit, it
 * dozes and dreams small z's. Lit, it wakes up and smiles, and its flame
 * warms the wax from above.
 */
export function Candle({ lit, justLit = false, phase = 0, size = 80, label }: CandleProps) {
  const u = useId().replace(/[^a-zA-Z0-9]/g, '');
  const id = (n: string) => `c${u}${n}`;
  const url = (n: string) => `url(#${id(n)})`;
  const style = { '--phase': `${-phase}s`, width: size, height: (size * 156) / 80 } as CSSProperties;
  return (
    <svg
      className={`candle${lit ? ' lit' : ''}${justLit ? ' just-lit' : ''}`}
      viewBox="0 -6 80 156"
      style={style}
      role="img"
      aria-label={label ?? (lit ? 'A candle, awake and lit' : 'A candle, asleep')}
    >
      <defs>
        <radialGradient id={id('glow')}>
          <stop offset="0" stopColor="#ffd77a" stopOpacity="0.75" />
          <stop offset="0.4" stopColor="#ffb547" stopOpacity="0.28" />
          <stop offset="1" stopColor="#ffb547" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('wax')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fffaf0" />
          <stop offset="0.45" stopColor="#fff2da" />
          <stop offset="1" stopColor="#e9cf9f" />
        </linearGradient>
        <linearGradient id={id('waxShade')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.55" stopColor="#c99b5e" stopOpacity="0" />
          <stop offset="1" stopColor="#c99b5e" stopOpacity="0.28" />
        </linearGradient>
        <radialGradient id={id('warm')} cx="50%" cy="0%" r="70%">
          <stop offset="0" stopColor="#ffc46b" stopOpacity={lit ? 0.55 : 0} />
          <stop offset="1" stopColor="#ffc46b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('drip')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fffdf6" />
          <stop offset="1" stopColor="#f6e6c6" />
        </linearGradient>
        <radialGradient id={id('dish')} cx="40%" cy="30%" r="80%">
          <stop offset="0" stopColor="#c6a6ff" />
          <stop offset="0.55" stopColor="#9a68ff" />
          <stop offset="1" stopColor="#6a35d6" />
        </radialGradient>
        <radialGradient id={id('eye')} cx="38%" cy="30%" r="78%">
          <stop offset="0" stopColor="#5d5180" />
          <stop offset="0.55" stopColor="#2a2142" />
          <stop offset="1" stopColor="#120c1e" />
        </radialGradient>
        <radialGradient id={id('blush')}>
          <stop offset="0" stopColor="#ff86ab" stopOpacity="0.8" />
          <stop offset="1" stopColor="#ff86ab" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('flame')} cx="50%" cy="72%" r="70%">
          <stop offset="0" stopColor="#fff6c8" />
          <stop offset="0.35" stopColor="#ffd25c" />
          <stop offset="0.75" stopColor="#ff9a2e" />
          <stop offset="1" stopColor="#ff7a1f" stopOpacity="0.85" />
        </radialGradient>
        <clipPath id={id('body')}>
          <rect x="16" y="66" width="48" height="70" rx="16" />
        </clipPath>
      </defs>

      {lit && <circle className="candle-glow" cx="40" cy="46" r="46" fill={url('glow')} />}

      {/* Saucer, with a little ring handle */}
      <circle cx="73" cy="131" r="5.5" fill="none" stroke={url('dish')} strokeWidth="3.6" />
      <ellipse cx="40" cy="138" rx="32" ry="9" fill={url('dish')} />
      <ellipse cx="40" cy="135" rx="27" ry="6" fill="#7c45e6" />
      <ellipse cx="34" cy="133.6" rx="16" ry="2" fill="#fff" opacity="0.18" />

      {/* Wax */}
      <rect x="16" y="66" width="48" height="70" rx="16" fill={url('wax')} />
      <g clipPath={url('body')}>
        <rect x="16" y="66" width="48" height="70" fill={url('waxShade')} />
        <rect x="16" y="66" width="48" height="70" fill={url('warm')} />
        <rect x="21" y="86" width="5" height="40" rx="2.5" fill="#fff" opacity="0.5" />
      </g>
      {/* The melted top and its drips */}
      <path
        d="M16 82 C16 72 23 66 33 66 L47 66 C57 66 64 72 64 82 L64 92 C64 98 57 98 57 92 L57 86 C56 83 53 83 52 86 L52 99 C52 105 45 105 45 99 L45 84 C44 81 40 81 39 84 L39 89 C39 94 32 94 32 89 L32 84 C31 82 28 82 27 84 L27 95 C27 101 20 101 20 95 L20 88 C19 86 17 86 16 88 Z"
        fill={url('drip')}
      />
      <ellipse cx="40" cy="70.5" rx="20" ry="4" fill="#ead2a6" opacity="0.7" />
      <path d="M22 77 C23 74 26 72 31 71.5" fill="none" stroke="#fff" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round" />

      {/* Face */}
      <g className="candle-face">
        <ellipse cx="24" cy="117" rx="5" ry="3" fill={url('blush')} />
        <ellipse cx="56" cy="117" rx="5" ry="3" fill={url('blush')} />
        {lit ? (
          <>
            <ellipse cx="31" cy="109" rx="4.2" ry="5.4" fill={url('eye')} />
            <ellipse cx="49" cy="109" rx="4.2" ry="5.4" fill={url('eye')} />
            <circle cx="32.4" cy="106.5" r="1.6" fill="#fff" />
            <circle cx="50.4" cy="106.5" r="1.6" fill="#fff" />
            <path d="M36.5 116 Q40 119.5 43.5 116" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
          </>
        ) : (
          <>
            <path d="M26.5 109 Q31 113 35.5 109 M44.5 109 Q49 113 53.5 109" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
            <ellipse cx="40" cy="118" rx="1.8" ry="2" fill={INK} opacity="0.75" />
          </>
        )}
      </g>

      {/* Wick */}
      <path d="M40 68 Q39 63 40.5 58" fill="none" stroke="#3a2a33" strokeWidth="2.6" strokeLinecap="round" />

      {lit ? (
        <g transform="translate(0 12)">
          <g className="flame">
            <circle className="flame-burst" cx="40" cy="34" r="16" fill="#ffe08a" />
            <path d="M40 6 C50 19 55 31 51 41 C48 48 32 48 29 41 C25 31 30 19 40 6 Z" fill={url('flame')} />
            <path d="M40 22 C44 28 46 34 44.5 39.5 C43.5 43 36.5 43 35.5 39.5 C34 34 36 28 40 22 Z" fill="#fffbe8" opacity="0.9" />
            <ellipse cx="40" cy="44" rx="3.2" ry="2" fill="#7fb6ff" opacity="0.55" />
          </g>
        </g>
      ) : (
        <g className="dream" aria-hidden="true" transform="translate(0 12)">
          <text x="46" y="40" className="z z1">
            z
          </text>
          <text x="54" y="28" className="z z2">
            z
          </text>
          <text x="61" y="14" className="z z3">
            z
          </text>
        </g>
      )}
    </svg>
  );
}
