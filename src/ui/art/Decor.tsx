import { useMemo, type CSSProperties } from 'react';

/** A burst of little sparkles. Change `burst` to play it again. */
export function Sparkles({ burst, count = 12, radius = 90, colors = ['#ffe27a', '#ffffff', '#cdb8ff', '#ff8fb8'] }: { burst: number | string; count?: number; radius?: number; colors?: string[] }) {
  const bits = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2 + (i % 2) * 0.3;
        const r = radius * (0.65 + ((i * 37) % 10) / 28);
        return { x: Math.cos(a) * r, y: Math.sin(a) * r, s: 8 + ((i * 13) % 9), c: colors[i % colors.length]!, d: (i % 4) * 40 };
      }),
    [count, radius, colors],
  );
  return (
    <span className="sparkles" key={burst} aria-hidden="true">
      {bits.map((b, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className="sparkle"
          style={{ '--x': `${b.x}px`, '--y': `${b.y}px`, width: b.s + (i % 4 ? 4 : 0), height: b.s + (i % 4 ? 4 : 0), animationDelay: `${b.d}ms` } as CSSProperties}
        >
          {/* Halloween confetti: a star, a bat, a candy corn, a little pumpkin. */}
          {i % 4 === 0 && <path d="M10 0 C11 7 13 9 20 10 C13 11 11 13 10 20 C9 13 7 11 0 10 C7 9 9 7 10 0 Z" fill={b.c} />}
          {i % 4 === 1 && (
            <path
              d="M10 8 C8 5 4 4 0 6 C2 7 2 9 1 11 C3 10 5 11 5 13 C7 11 8 12 9 13 C9 11 9.5 9.5 10 8 C10.5 9.5 11 11 11 13 C12 12 13 11 15 13 C15 11 17 10 19 11 C18 9 18 7 20 6 C16 4 12 5 10 8 Z"
              fill="#3a2366"
            />
          )}
          {i % 4 === 2 && (
            <g>
              <path d="M3 18 Q10 20 17 18 L14.3 11.5 Q10 12.6 5.7 11.5 Z" fill="#ffcf3a" />
              <path d="M5.7 11.5 Q10 12.6 14.3 11.5 L11.8 5.5 Q10 6.2 8.2 5.5 Z" fill="#ff8a2a" />
              <path d="M8.2 5.5 Q10 6.2 11.8 5.5 L10 1 Z" fill="#fff" />
            </g>
          )}
          {i % 4 === 3 && (
            <g>
              <path d="M10 5 C15.5 5 18.5 8.5 18.5 12.5 C18.5 16.5 15 18.5 10 18.5 C5 18.5 1.5 16.5 1.5 12.5 C1.5 8.5 4.5 5 10 5 Z" fill="#ff8a2a" />
              <path d="M9 5.5 C9 3.5 10 2 12 1.5" fill="none" stroke="#6b4a2b" strokeWidth="2" strokeLinecap="round" />
            </g>
          )}
        </svg>
      ))}
    </span>
  );
}

/** A quiet night sky: tiny stars that twinkle out of step. */
export function Stars({ count = 60 }: { count?: number }) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: (i * 61.8) % 100,
        y: (i * 37.3) % 100,
        s: 1 + (i % 3) * 0.7,
        d: (i * 0.73) % 5,
        t: 2.5 + (i % 5) * 0.8,
      })),
    [count],
  );
  return (
    <div className="stars" aria-hidden="true">
      {stars.map((s, i) => (
        <i key={i} style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, animationDelay: `${-s.d}s`, animationDuration: `${s.t}s` }} />
      ))}
    </div>
  );
}
