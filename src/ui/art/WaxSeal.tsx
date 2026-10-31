import { useId, useMemo } from 'react';

export type WaxState = 'whole' | 'pressing' | 'cracking' | 'broken';

interface WaxSealProps {
  initials: string;
  state?: WaxState;
  size?: number;
}

function hash(text: string): number {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

/** A soft blob of poured wax: a circle with a few gentle bumps. */
function blobPath(seed: number, radius: number): string {
  let s = seed || 1;
  const rand = () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 10000) / 10000;
  };
  const n = 9;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const r = radius * (1 + (rand() - 0.5) * 0.12);
    return [Math.cos(a) * r, Math.sin(a) * r] as const;
  });
  let d = `M${pts[0]![0].toFixed(2)} ${pts[0]![1].toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]!;
    const p1 = pts[i]!;
    const p2 = pts[(i + 1) % n]!;
    const p3 = pts[(i + 2) % n]!;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]!.toFixed(2)} ${c1[1]!.toFixed(2)} ${c2[0]!.toFixed(2)} ${c2[1]!.toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return d + ' Z';
}

const CRACK = '-2,-60 4,-30 -5,-12 5,4 -3,22 4,40 -1,60';

/** A purple wax seal with the owner's initials. It presses in, and cracks in two. */
export function WaxSeal({ initials, state = 'whole', size = 60 }: WaxSealProps) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const blob = useMemo(() => blobPath(hash(initials || 'P'), 46), [initials]);
  const face = (
    <>
      <path d={blob} fill="#7b3fe4" />
      <path d={blob} fill="none" stroke="#5a24b8" strokeWidth="4" />
      <circle r="32" fill="#6a31cf" />
      <circle r="32" fill="none" stroke="#9b6dff" strokeOpacity="0.6" strokeWidth="2.5" />
      <path d="M-30 -18 C-24 -32 -10 -38 4 -37" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="5" strokeLinecap="round" />
      <text y="10" textAnchor="middle" fontFamily="Fredoka, Nunito, sans-serif" fontWeight="600" fontSize="28" fill="#efe6ff">
        {initials}
      </text>
    </>
  );
  return (
    <svg className={`wax ${state}`} viewBox="-60 -60 120 120" width={size} height={size} role="img" aria-label={state === 'broken' ? 'A cracked wax seal' : 'A wax seal'}>
      <defs>
        <clipPath id={`l${id}`}>
          <polygon points={`-70,-70 ${CRACK} -70,70`} />
        </clipPath>
        <clipPath id={`r${id}`}>
          <polygon points={`70,-70 ${CRACK} 70,70`} />
        </clipPath>
      </defs>
      <g className="half left" clipPath={`url(#l${id})`}>
        {face}
      </g>
      <g className="half right" clipPath={`url(#r${id})`}>
        {face}
      </g>
      <polyline className="crack" points={CRACK} fill="none" stroke="#2a0f5c" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  const first = parts[0]![0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]![0] ?? '') : '';
  return (first + last).toUpperCase();
}
