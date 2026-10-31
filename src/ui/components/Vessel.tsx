import { useId, type CSSProperties, type ReactNode } from 'react';

interface VesselProps {
  open?: boolean;
  /** 0..1, how brightly the soul inside glows. */
  glow?: number;
  width?: number;
  /** Rendered over the neck of the jar, e.g. the wax seal. */
  seal?: ReactNode;
}

const MOTES = [
  { x: 82, y: 190, t: 7.5, d: 0, dx: 8 },
  { x: 112, y: 200, t: 9, d: 2.1, dx: -6 },
  { x: 96, y: 176, t: 6.4, d: 3.7, dx: 4 },
  { x: 124, y: 168, t: 8.2, d: 1.2, dx: -9 },
  { x: 74, y: 160, t: 10, d: 4.4, dx: 7 },
  { x: 104, y: 206, t: 7.1, d: 5.3, dx: -3 },
  { x: 90, y: 150, t: 8.8, d: 0.6, dx: 5 },
];

const RELEASED = Array.from({ length: 12 }, (_, i) => ({
  x: 88 + ((i * 37) % 24),
  r: 1 + (i % 3) * 0.6,
  t: 3.2 + ((i * 1.7) % 2.6),
  d: (i * 0.53) % 3.4,
  dx: ((i * 29) % 90) - 45,
}));

export function Vessel({ open = false, glow = 0.3, width = 200, seal }: VesselProps) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const height = (width * 260) / 200;

  return (
    <div className="vessel-wrap" style={{ position: 'relative', width, height }}>
      <svg className={`vessel${open ? ' open' : ''}`} viewBox="0 0 200 260" width={width} height={height} role="img" aria-label={open ? 'An open jar, glowing' : 'A sealed glass jar'}>
        <defs>
          <linearGradient id={`glass${id}`} x1="0" x2="1">
            <stop offset="0%" stopColor="#cfd8d2" stopOpacity="0.16" />
            <stop offset="28%" stopColor="#ffffff" stopOpacity="0.04" />
            <stop offset="36%" stopColor="#ffffff" stopOpacity="0.2" />
            <stop offset="44%" stopColor="#ffffff" stopOpacity="0.03" />
            <stop offset="82%" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#b9c4bd" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id={`gold${id}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#efd9a4" />
            <stop offset="50%" stopColor="#b08d57" />
            <stop offset="100%" stopColor="#5d4626" />
          </linearGradient>
          <linearGradient id={`goldH${id}`} x1="0" x2="1">
            <stop offset="0%" stopColor="#6a522d" />
            <stop offset="35%" stopColor="#e6cd94" />
            <stop offset="60%" stopColor="#b08d57" />
            <stop offset="100%" stopColor="#4d3a1f" />
          </linearGradient>
          <radialGradient id={`soul${id}`} cx="50%" cy="55%" r="50%">
            <stop offset="0%" stopColor="#fff3cf" stopOpacity="0.95" />
            <stop offset="30%" stopColor="#f6c46e" stopOpacity="0.6" />
            <stop offset="70%" stopColor="#e8a64a" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#e8a64a" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`beam${id}`} x1="0" x2="0" y1="1" y2="0">
            <stop offset="0%" stopColor="#ffe6b0" stopOpacity="0.75" />
            <stop offset="55%" stopColor="#f2b35a" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#f2b35a" stopOpacity="0" />
          </linearGradient>
          <filter id={`soft${id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <filter id={`softer${id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="12" />
          </filter>
          <clipPath id={`inside${id}`}>
            <path d="M80 86 C80 98 42 106 40 136 C38 170 42 200 54 213 C66 224 134 224 146 213 C158 200 162 170 160 136 C158 106 120 98 120 86 Z" />
          </clipPath>
        </defs>

        <polygon className="beam" points="80,64 120,64 196,-160 4,-160" fill={`url(#beam${id})`} filter={`url(#soft${id})`} />

        {/* Plinth */}
        <ellipse cx="100" cy="232" rx="66" ry="10" fill="#000" opacity="0.35" filter={`url(#soft${id})`} />
        <path d="M44 222 Q100 236 156 222 L152 230 Q100 244 48 230 Z" fill={`url(#goldH${id})`} />
        <ellipse cx="100" cy="222" rx="56" ry="7" fill={`url(#gold${id})`} />

        {/* The light inside */}
        <g clipPath={`url(#inside${id})`}>
          <ellipse
            className="soul"
            cx="100"
            cy="158"
            rx="58"
            ry="66"
            fill={`url(#soul${id})`}
            style={{ opacity: open ? 1 : 0.25 + glow * 0.75 } as CSSProperties}
            filter={`url(#softer${id})`}
          />
          {MOTES.map((m, i) => (
            <circle
              key={i}
              className="mote"
              cx={m.x}
              cy={m.y}
              r={1.4 + (i % 3) * 0.5}
              fill="#ffe7b0"
              style={{ '--t': `${m.t}s`, '--d': `${-m.d}s`, '--dx': `${m.dx}px`, opacity: 0.3 + glow * 0.7 } as CSSProperties}
            />
          ))}
        </g>

        {/* What the vessel releases when it opens */}
        {RELEASED.map((m, i) => (
          <circle
            key={i}
            className="released"
            cx={m.x}
            cy={70}
            r={m.r}
            fill="#ffe7b0"
            style={{ '--t': `${m.t}s`, '--d': `${m.d}s`, '--dx': `${m.dx}px` } as CSSProperties}
          />
        ))}

        {/* Glass */}
        <path
          d="M78 84 C78 96 40 104 38 136 C36 170 40 200 52 214 C64 226 136 226 148 214 C160 200 164 170 162 136 C160 104 122 96 122 84 Z"
          fill={`url(#glass${id})`}
          stroke="#e9e1cf"
          strokeOpacity="0.45"
          strokeWidth="1.2"
        />
        <path d="M58 126 C52 150 52 182 62 204" stroke="#fff" strokeOpacity="0.32" strokeWidth="3.2" strokeLinecap="round" fill="none" />
        <path d="M66 118 C64 122 63 126 62 130" stroke="#fff" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M146 140 C148 160 147 182 140 200" stroke="#fff" strokeOpacity="0.1" strokeWidth="2" strokeLinecap="round" fill="none" />

        {/* Neck band */}
        <rect x="76" y="66" width="48" height="18" rx="2" fill="#e9e1cf" fillOpacity="0.06" stroke="#e9e1cf" strokeOpacity="0.35" />
        <rect x="74" y="80" width="52" height="5" rx="1.5" fill={`url(#goldH${id})`} />

        {/* Lid */}
        <g className="lid">
          <rect x="70" y="56" width="60" height="11" rx="3" fill={`url(#goldH${id})`} />
          <path d="M75 56 C75 38 125 38 125 56 Z" fill={`url(#gold${id})`} />
          <path d="M82 50 C88 44 112 44 118 50" stroke="#fff3cf" strokeOpacity="0.5" strokeWidth="1" fill="none" />
          <rect x="96" y="30" width="8" height="10" rx="1" fill={`url(#goldH${id})`} />
          <circle cx="100" cy="27" r="6.5" fill={`url(#gold${id})`} />
          <circle cx="98" cy="25" r="1.8" fill="#fff6dc" opacity="0.6" />
        </g>
      </svg>
      {seal && (
        <div style={{ position: 'absolute', left: '50%', top: `${(70 / 260) * 100}%`, transform: 'translate(-50%, -50%)' }}>{seal}</div>
      )}
    </div>
  );
}
