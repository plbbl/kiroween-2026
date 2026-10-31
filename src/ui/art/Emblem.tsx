import type { Emblem as EmblemName } from '../../core/buddy.ts';

// Twelve tiny marks, each drawn in a 20 x 20 box.
const PATHS: Record<EmblemName, { d: string; stroke?: boolean }> = {
  star: { d: 'M10 1.5 L12.6 7.2 L18.8 7.8 L14.1 11.9 L15.5 18 L10 14.8 L4.5 18 L5.9 11.9 L1.2 7.8 L7.4 7.2 Z' },
  moon: { d: 'M13.5 2.5 C8 2.5 3.5 6.5 3.5 11 C3.5 15.5 7.5 18.5 11.5 18.5 C14.5 18.5 16.8 17 18 15 C11 16 7 10 13.5 2.5 Z' },
  heart: { d: 'M10 18 C3 13 1.5 9.5 1.5 6.8 C1.5 4 3.6 2 6.2 2 C8 2 9.3 3 10 4.4 C10.7 3 12 2 13.8 2 C16.4 2 18.5 4 18.5 6.8 C18.5 9.5 17 13 10 18 Z' },
  bone: {
    d: 'M5 3.5 C3 3.5 2 5.5 3 7 C1.5 7.5 1.5 10 3.5 10.5 C5 10.8 6 9.8 6.5 9 L13.5 16 C13 17 14 19 15.8 18.8 C17.5 18.6 17.8 16.8 17 16 C18.5 15.5 18.5 13 16.5 12.5 C15 12.2 14 13 13.5 14 L6.5 7 C7 6 6.5 3.5 5 3.5 Z',
  },
  drop: { d: 'M10 1.5 C10 1.5 3.5 9 3.5 13 C3.5 16.6 6.4 19 10 19 C13.6 19 16.5 16.6 16.5 13 C16.5 9 10 1.5 10 1.5 Z' },
  flower: {
    d: 'M10 7.5 C8.2 1.5 11.8 1.5 10 7.5 Z M10 7.5 C16 5.5 17 9 11.5 9.6 C16.5 13 13.5 15.5 10.5 11 C10 16.8 6.6 15.6 9 10.6 C3.5 12.5 3 9 8.5 9 C3.6 5.8 6.4 3.4 10 7.5 Z',
  },
  key: { d: 'M7 2.5 A4.5 4.5 0 1 0 7 11.5 A4.5 4.5 0 1 0 7 2.5 Z M7 5.5 A1.5 1.5 0 1 1 7 8.5 A1.5 1.5 0 1 1 7 5.5 Z M9.5 10 L17.5 18 L15.5 19.5 L14 18 L12.5 19.2 L11 17.7 L12.4 16.5 L7.8 11.8 Z' },
  bell: { d: 'M10 2 C6.2 2 4.5 5 4.5 8.5 L4.5 12.5 L2.5 15.5 L17.5 15.5 L15.5 12.5 L15.5 8.5 C15.5 5 13.8 2 10 2 Z M7.8 16.8 C8.2 18.2 9 19 10 19 C11 19 11.8 18.2 12.2 16.8 Z' },
  clover: {
    d: 'M10 9 C7 3 13 3 10 9 Z M10 9 C4 8 4 14 10 10 Z M10 10 C16 14 16 8 10 9 Z M10 10 L11.5 19',
    stroke: true,
  },
  spark: { d: 'M10 1 C10.8 7 13 9.2 19 10 C13 10.8 10.8 13 10 19 C9.2 13 7 10.8 1 10 C7 9.2 9.2 7 10 1 Z' },
  leaf: { d: 'M3 17 C3 8 9 2.5 18 2.5 C18 11 12.5 17 4.5 17 Z M3 17 C7 13 10 10 13.5 7' },
  candy: {
    d: 'M6 10 A4 4 0 1 0 14 10 A4 4 0 1 0 6 10 Z M6.2 8.6 L1.5 5.5 L2.2 10 L1.5 14.5 L6.2 11.4 Z M13.8 8.6 L18.5 5.5 L17.8 10 L18.5 14.5 L13.8 11.4 Z',
  },
};

export function Emblem({ name, size = 20, color = 'currentColor' }: { name: EmblemName; size?: number; color?: string }) {
  const p = PATHS[name];
  const scale = size / 20;
  return (
    <g transform={`scale(${scale})`}>
      {p.stroke ? (
        <path d={p.d} fill={color} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d={p.d} fill={color} fillRule="evenodd" />
      )}
    </g>
  );
}

export function EmblemIcon({ name, size = 18, color = 'currentColor', title }: { name: EmblemName; size?: number; color?: string; title?: string }) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} role="img" aria-label={title ?? name}>
      <Emblem name={name} color={color} />
    </svg>
  );
}
