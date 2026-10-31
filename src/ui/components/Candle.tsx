import { useId, type CSSProperties } from 'react';

interface CandleProps {
  lit: boolean;
  /** Plays the flare once, right after lighting. */
  justLit?: boolean;
  /** Seconds; staggers flicker so candles never move in unison. */
  delay?: number;
  height?: number;
  label?: string;
}

export function Candle({ lit, justLit = false, delay = 0, height = 170, label }: CandleProps) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const style = {
    '--delay': `${-delay}s`,
    '--flicker': `${2 + ((delay * 7.3) % 1.1)}s`,
    height,
    width: (height * 64) / 170,
  } as CSSProperties;

  return (
    <svg
      className={`candle${lit ? ' lit' : ''}${justLit ? ' just-lit' : ''}`}
      viewBox="0 0 64 170"
      style={style}
      role="img"
      aria-label={label ?? (lit ? 'A lit candle' : 'An unlit candle')}
    >
      <defs>
        <radialGradient id={`halo${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffd98a" stopOpacity="0.55" />
          <stop offset="35%" stopColor="#f2a54a" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#e8a64a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`flame${id}`} cx="50%" cy="78%" r="62%">
          <stop offset="0%" stopColor="#fffbea" />
          <stop offset="28%" stopColor="#ffe3a0" />
          <stop offset="58%" stopColor="#f6a43f" />
          <stop offset="86%" stopColor="#d9561f" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#b8320f" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`wax${id}`} x1="0" x2="1">
          <stop offset="0%" stopColor="#a39276" />
          <stop offset="22%" stopColor="#d9ccaf" />
          <stop offset="42%" stopColor="#f6efdc" />
          <stop offset="64%" stopColor="#e3d6ba" />
          <stop offset="100%" stopColor="#8f7f63" />
        </linearGradient>
        <linearGradient id={`brass${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#e6cd94" />
          <stop offset="45%" stopColor="#b08d57" />
          <stop offset="100%" stopColor="#5d4626" />
        </linearGradient>
        <radialGradient id={`pool${id}`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#fff6dd" />
          <stop offset="100%" stopColor="#d8c8a5" />
        </radialGradient>
        <filter id={`blur${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
      </defs>

      {lit && <circle className="halo" cx="32" cy="48" r="40" fill={`url(#halo${id})`} />}

      {/* Wax body with drips and a melted pool. */}
      <path
        d="M19 70 L19 160 Q32 164 45 160 L45 70 Z"
        fill={`url(#wax${id})`}
      />
      <path
        d="M19 70 Q19 66 23 66 L41 66 Q45 66 45 70 L45 84 Q43.5 92 42 84 L42 76 Q40 74 38 77 L38 98 Q36.5 104 35 98 L35 75 Q32 73 29 75 L29 88 Q27.5 93 26 88 L26 76 Q23 74 22 77 L22 90 Q20.5 96 19 90 Z"
        fill={`url(#wax${id})`}
        opacity="0.92"
      />
      <ellipse cx="32" cy="68" rx="13" ry="3.6" fill={`url(#pool${id})`} />
      {lit && <ellipse cx="32" cy="68" rx="11" ry="2.8" fill="#ffc46b" opacity="0.38" />}

      {/* Brass dish. */}
      <ellipse cx="32" cy="162" rx="25" ry="6" fill={`url(#brass${id})`} />
      <ellipse cx="32" cy="160.5" rx="21" ry="4" fill="#3d2d18" opacity="0.5" />
      <path d="M7 162 Q32 172 57 162" stroke="#e6cd94" strokeWidth="0.8" fill="none" opacity="0.6" />

      {/* Wick. */}
      <path d="M32 67 Q31.6 62 32.6 58.5" stroke="#1b130e" strokeWidth="1.7" strokeLinecap="round" fill="none" />
      {lit && <circle cx="32.6" cy="58.8" r="1.3" fill="#ff8a3d" />}

      {!lit && (
        <path
          className="smoke"
          d="M32.6 58 C28 51 37 45 31 37 C26 30 35 24 30.5 16"
          stroke="#c9bfb2"
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
          filter={`url(#blur${id})`}
        />
      )}

      {lit && (
        <g className="flame-group">
          <circle className="flare" cx="32" cy="52" r="9" fill="#ffd98a" />
          <g className="flame">
            <path
              d="M32 20 C37.5 32 42.5 44 39.6 55 C37.8 61.6 26.2 61.6 24.4 55 C21.5 44 26.5 32 32 20 Z"
              fill={`url(#flame${id})`}
              filter={`url(#blur${id})`}
              opacity="0.9"
            />
            <path
              d="M32 24 C36.2 34 39.6 44 37.6 53.5 C36.2 59 27.8 59 26.4 53.5 C24.4 44 27.8 34 32 24 Z"
              fill={`url(#flame${id})`}
            />
          </g>
          <path
            className="flame-core"
            d="M32 39 C34.6 45 35.9 50.5 34.6 54.6 C33.8 57.4 30.2 57.4 29.4 54.6 C28.1 50.5 29.4 45 32 39 Z"
            fill="#fffdf2"
            opacity="0.95"
          />
          <ellipse cx="32" cy="58.6" rx="3.1" ry="1.8" fill="#7aa6ff" opacity="0.45" />
        </g>
      )}
    </svg>
  );
}
