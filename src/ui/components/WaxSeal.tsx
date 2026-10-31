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

function rng(seed: number) {
  let s = seed || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 10000) / 10000;
  };
}

/** An irregular blob of poured wax, smoothed with Catmull-Rom curves. */
function blobPath(seed: number, radius: number): string {
  const rand = rng(seed);
  const n = 26;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const r = radius * (1 + (rand() - 0.5) * 0.09 + (i % 5 === 0 ? rand() * 0.07 : 0));
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

const CRACK: [number, number][] = [
  [-3, -62],
  [3, -40],
  [-5, -24],
  [5, -9],
  [-3, 4],
  [6, 18],
  [-2, 33],
  [4, 47],
  [-1, 62],
];

export function WaxSeal({ initials, state = 'whole', size = 120 }: WaxSealProps) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const seed = hash(initials || 'P');
  const blob = useMemo(() => blobPath(seed, 46), [seed]);
  const crack = CRACK.map(([x, y]) => `${x},${y}`).join(' ');
  const leftClip = `-80,-80 ${crack} -80,80`;
  const rightClip = `80,-80 ${crack} 80,80`;
  const beads = Array.from({ length: 24 }, (_, i) => (i / 24) * Math.PI * 2);

  const face = (
    <>
      <path d={blob} fill={`url(#wax${id})`} />
      <path d={blob} fill="none" stroke="#2a0606" strokeOpacity="0.35" strokeWidth="1" />
      <circle r="31" fill={`url(#inner${id})`} />
      <circle r="31" fill="none" stroke="#260505" strokeOpacity="0.55" strokeWidth="1.6" />
      <circle r="32.4" fill="none" stroke="#ffb7a8" strokeOpacity="0.14" strokeWidth="1" />
      {beads.map((a, i) => (
        <circle key={i} cx={Math.cos(a) * 26} cy={Math.sin(a) * 26} r="1.05" fill="#3a0a0a" opacity="0.75" />
      ))}
      <g fontFamily="'Cormorant Garamond', Georgia, serif" fontWeight="600" fontSize="24" textAnchor="middle">
        <text x="0.9" y="9.6" fill="#1d0404" opacity="0.6">
          {initials}
        </text>
        <text x="-0.6" y="7.6" fill="#ffc9bd" opacity="0.2">
          {initials}
        </text>
        <text x="0" y="8.6" fill="#5c1616">
          {initials}
        </text>
      </g>
      <path d="M-38 -14 C-34 -30 -20 -40 -4 -42" fill="none" stroke="#ffd2c4" strokeOpacity="0.16" strokeWidth="2.4" strokeLinecap="round" />
    </>
  );

  return (
    <svg className={`wax ${state}`} viewBox="-64 -64 128 128" width={size} height={size} role="img" aria-label={state === 'broken' ? 'A broken wax seal' : 'A wax seal'}>
      <defs>
        <radialGradient id={`wax${id}`} cx="44%" cy="40%" r="68%">
          <stop offset="0%" stopColor="#8e2c29" />
          <stop offset="62%" stopColor="#742320" />
          <stop offset="88%" stopColor="#5c1816" />
          <stop offset="100%" stopColor="#3f0e0d" />
        </radialGradient>
        <radialGradient id={`inner${id}`} cx="55%" cy="60%" r="70%">
          <stop offset="0%" stopColor="#5a1616" />
          <stop offset="100%" stopColor="#7d2623" />
        </radialGradient>
        <clipPath id={`l${id}`}>
          <polygon points={leftClip} />
        </clipPath>
        <clipPath id={`r${id}`}>
          <polygon points={rightClip} />
        </clipPath>
      </defs>
      <g className="half left" clipPath={`url(#l${id})`}>
        {face}
      </g>
      <g className="half right" clipPath={`url(#r${id})`}>
        {face}
      </g>
      <polyline className="crack" points={crack} fill="none" stroke="#120202" strokeWidth="2.2" strokeLinejoin="round" />
    </svg>
  );
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'P';
  const first = parts[0]![0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1]![0] ?? '' : '';
  return (first + last).toUpperCase();
}
