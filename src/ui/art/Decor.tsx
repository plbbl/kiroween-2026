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
          style={{ '--x': `${b.x}px`, '--y': `${b.y}px`, width: b.s, height: b.s, animationDelay: `${b.d}ms` } as CSSProperties}
        >
          <path d="M10 0 C11 7 13 9 20 10 C13 11 11 13 10 20 C9 13 7 11 0 10 C7 9 9 7 10 0 Z" fill={b.c} />
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
