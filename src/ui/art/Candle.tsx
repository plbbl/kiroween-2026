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

/**
 * A chubby candle with a face. Unlit, it dozes and dreams small z's.
 * Lit, it wakes up and smiles.
 */
export function Candle({ lit, justLit = false, phase = 0, size = 80, label }: CandleProps) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
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
        <radialGradient id={`glow${id}`}>
          <stop offset="0%" stopColor="#ffd76b" stopOpacity="0.7" />
          <stop offset="45%" stopColor="#ffb547" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#ffb547" stopOpacity="0" />
        </radialGradient>
      </defs>

      {lit && <circle className="candle-glow" cx="40" cy="34" r="40" fill={`url(#glow${id})`} />}

      {/* Dish */}
      <ellipse cx="40" cy="138" rx="31" ry="8.5" fill="#9f7cf0" />
      <ellipse cx="40" cy="135.5" rx="27" ry="6.5" fill="#b89cff" />

      {/* Body */}
      <rect x="20" y="56" width="40" height="80" rx="15" fill="#fff3dc" />
      <path d="M46 58 L60 70 L60 122 C60 130 54 136 46 136 Z" fill="#f2dfbd" opacity="0.65" />
      <path
        d="M20 72 C20 62 27 56 34 56 L46 56 C53 56 60 62 60 72 L60 80 C60 85 54 85 54 80 L54 74 C53 71 50 71 49 74 L49 88 C49 94 43 94 43 88 L43 72 C42 69 38 69 37 72 L37 77 C37 82 31 82 31 77 L31 72 C30 70 27 70 26 72 L26 83 C26 88 20 88 20 83 Z"
        fill="#fffaf0"
      />

      {/* Face */}
      <g className="candle-face">
        {lit ? (
          <>
            <ellipse cx="32" cy="104" rx="3.6" ry="5" fill="#1a1420" />
            <ellipse cx="48" cy="104" rx="3.6" ry="5" fill="#1a1420" />
            <circle cx="33.2" cy="101.8" r="1.1" fill="#fff" />
            <circle cx="49.2" cy="101.8" r="1.1" fill="#fff" />
            <path d="M37 112 Q40 115.5 43 112" fill="none" stroke="#1a1420" strokeWidth="2.2" strokeLinecap="round" />
            <ellipse cx="26" cy="112" rx="4.2" ry="2.4" fill="#ff8fb8" opacity="0.6" />
            <ellipse cx="54" cy="112" rx="4.2" ry="2.4" fill="#ff8fb8" opacity="0.6" />
          </>
        ) : (
          <>
            <path d="M28 104 Q32 108 36 104 M44 104 Q48 108 52 104" fill="none" stroke="#1a1420" strokeWidth="2.6" strokeLinecap="round" />
            <ellipse cx="40" cy="113" rx="2.4" ry="1.6" fill="#1a1420" opacity="0.5" />
          </>
        )}
      </g>

      {/* Wick */}
      <path d="M40 57 Q39 52 40.5 47" fill="none" stroke="#3a2a33" strokeWidth="3" strokeLinecap="round" />

      {lit ? (
        <g className="flame">
          <circle className="flame-burst" cx="40" cy="34" r="16" fill="#ffe08a" />
          <path d="M40 8 C49 20 54 31 50 41 C48 47 32 47 30 41 C26 31 31 20 40 8 Z" fill="#ffad33" />
          <path d="M40 20 C45 27 47 34 45 40 C44 44 36 44 35 40 C33 34 35 27 40 20 Z" fill="#ffe27a" />
          <ellipse cx="40" cy="39" rx="3.6" ry="4.6" fill="#fffbe8" />
        </g>
      ) : (
        <g className="dream" aria-hidden="true">
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
