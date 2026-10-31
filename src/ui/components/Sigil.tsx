import { useMemo, type CSSProperties } from 'react';
import { sigilShape } from '../../core/sigil.ts';

interface SigilProps {
  seed: Uint8Array;
  size?: number;
  draw?: boolean;
  strokeWidth?: number;
  title?: string;
}

const rad = (deg: number) => (deg * Math.PI) / 180;
const pt = (r: number, deg: number): [number, number] => [50 + r * Math.cos(rad(deg - 90)), 50 + r * Math.sin(rad(deg - 90))];

export function Sigil({ seed, size = 96, draw = false, strokeWidth = 1.2, title }: SigilProps) {
  const s = useMemo(() => sigilShape(seed), [seed]);

  const starPath = useMemo(() => {
    const { points, step, rotation } = s.star;
    const verts = Array.from({ length: points }, (_, i) => pt(33, rotation + (i * 360) / points));
    let i = 0;
    let d = `M${verts[0]![0].toFixed(2)} ${verts[0]![1].toFixed(2)}`;
    const visited = new Set<number>([0]);
    for (let k = 0; k < points; k++) {
      i = (i + step) % points;
      d += ` L${verts[i]![0].toFixed(2)} ${verts[i]![1].toFixed(2)}`;
      if (visited.has(i) && i !== 0) {
        // step shares a factor with points: start a new loop
        const next = [...Array(points).keys()].find((v) => !visited.has(v));
        if (next === undefined) break;
        i = next;
        d += ` M${verts[i]![0].toFixed(2)} ${verts[i]![1].toFixed(2)}`;
      }
      visited.add(i);
    }
    return d;
  }, [s]);

  const ticks = Array.from({ length: s.ticks.count }, (_, t) => {
    const deg = s.ticks.rotation + (t * 360) / s.ticks.count;
    const long = s.ticks.long.includes(t);
    const [x1, y1] = pt(long ? 37.5 : 41, deg);
    const [x2, y2] = pt(44, deg);
    return { x1, y1, x2, y2, key: t };
  });

  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    pathLength: 1,
  };

  return (
    <svg className={`sigil${draw ? ' draw' : ''}`} viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={title ?? 'Sigil'}>
      {title && <title>{title}</title>}
      <circle cx="50" cy="50" r="46.5" {...common} style={{ '--d': '0s' } as CSSProperties} />
      <circle cx="50" cy="50" r="44" {...common} strokeWidth={strokeWidth * 0.5} style={{ '--d': '0.15s' } as CSSProperties} />
      {ticks.map((t) => (
        <line key={t.key} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} {...common} strokeWidth={strokeWidth * 0.8} style={{ '--d': `${0.3 + t.key * 0.02}s` } as CSSProperties} />
      ))}
      <path d={starPath} {...common} style={{ '--d': '0.6s' } as CSSProperties} />
      {s.innerRing && <circle cx="50" cy="50" r="15" {...common} style={{ '--d': '1s' } as CSSProperties} />}
      {s.glyph.map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} {...common} strokeWidth={strokeWidth * 1.5} style={{ '--d': `${1.2 + i * 0.12}s` } as CSSProperties} />
      ))}
      {s.dots.map((d, i) => {
        const [x, y] = pt(d.radius, d.angle);
        return <circle key={i} cx={x} cy={y} r={d.size} fill="currentColor" />;
      })}
    </svg>
  );
}
