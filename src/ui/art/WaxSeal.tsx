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

const CRACK = '-2,-60 4,-30 -5,-12 5,4 -3,22 4,40 -1,70';

// Two runs of wax that slid down before it set, and a few stray drops.
const DRIPS = 'M18 38 C20 50 22 58 18 64 C14 69 8 66 9 58 C10 52 12 46 10 40 Z M-26 34 C-27 42 -24 48 -28 52 C-32 55 -36 51 -34 46 C-33 41 -33 38 -34 33 Z';

/** A glossy purple wax seal with the owner's initials. It presses in, and cracks in two. */
export function WaxSeal({ initials, state = 'whole', size = 60 }: WaxSealProps) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const url = (n: string) => `url(#${n}${id})`;
  const blob = useMemo(() => blobPath(hash(initials || 'P'), 46), [initials]);
  const face = (
    <>
      <path d={DRIPS} fill={url('wax')} />
      <circle cx="44" cy="30" r="3.4" fill={url('wax')} />
      <circle cx="-44" cy="12" r="2.6" fill={url('wax')} />
      <path d={blob} fill={url('wax')} />
      {/* The pressed, raised ring */}
      <circle r="31" fill={url('well')} />
      <path d="M-27 -15 A31 31 0 0 1 15 -27" fill="none" stroke="#000" strokeOpacity="0.28" strokeWidth="3" strokeLinecap="round" />
      <path d="M27 15 A31 31 0 0 1 -15 27" fill="none" stroke="#fff" strokeOpacity="0.32" strokeWidth="3" strokeLinecap="round" />
      {/* Initials, pressed in */}
      <g fontFamily="Fredoka, Nunito, sans-serif" fontWeight="600" fontSize="27" textAnchor="middle">
        <text y="11" x="0.8" fill="#c7a6ff" opacity="0.45" transform="translate(0.6 1.4)">
          {initials}
        </text>
        <text y="11" fill="#3e1385">
          {initials}
        </text>
      </g>
      {/* Gloss */}
      <path d="M-34 -16 C-28 -32 -12 -40 4 -39" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="5" strokeLinecap="round" />
      <circle cx="-36" cy="-4" r="2.6" fill="#fff" opacity="0.6" />
    </>
  );
  return (
    <svg className={`wax ${state}`} viewBox="-60 -60 120 130" width={size} height={(size * 130) / 120} role="img" aria-label={state === 'broken' ? 'A cracked wax seal' : 'A wax seal'}>
      <defs>
        <radialGradient id={`wax${id}`} cx="35%" cy="28%" r="80%">
          <stop offset="0" stopColor="#b98cff" />
          <stop offset="0.45" stopColor="#7c3fe2" />
          <stop offset="1" stopColor="#4a1a9c" />
        </radialGradient>
        <radialGradient id={`well${id}`} cx="60%" cy="65%" r="80%">
          <stop offset="0" stopColor="#8a50ec" />
          <stop offset="1" stopColor="#5a24b8" />
        </radialGradient>
        <clipPath id={`l${id}`}>
          <polygon points={`-70,-70 ${CRACK} -70,80`} />
        </clipPath>
        <clipPath id={`r${id}`}>
          <polygon points={`70,-70 ${CRACK} 70,80`} />
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
