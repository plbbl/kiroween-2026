// A sigil is a small drawing generated from a card's identity (jar id and
// x coordinate). The same card always produces the same sigil, so the
// person holding a card can check that the mark on screen matches the mark
// on paper. Both sides of a card share one sigil.

import { sha256 } from '@noble/hashes/sha2.js';
import { concat } from './bytes.ts';

export interface SigilShape {
  /** Points of the star polygon and the step between connected points. */
  star: { points: number; step: number; rotation: number };
  ticks: { count: number; rotation: number; long: number[] };
  /** Line segments of the central glyph, in a 100x100 box centred at 50,50. */
  glyph: [number, number, number, number][];
  dots: { angle: number; radius: number; size: number }[];
  innerRing: boolean;
}

function coprimeStep(points: number, pick: number): number {
  const steps: number[] = [];
  for (let s = 2; s < points / 2; s++) {
    let a = points;
    let b = s;
    while (b) [a, b] = [b, a % b];
    if (a === 1) steps.push(s);
  }
  return steps.length ? steps[pick % steps.length]! : 1;
}

export function sigilSeed(jarId: Uint8Array, x: number): Uint8Array {
  return sha256(concat(jarId, Uint8Array.of(x)));
}

export function sigilShape(seed: Uint8Array): SigilShape {
  let i = 0;
  const next = () => seed[i++ % seed.length]!;

  const points = 5 + (next() % 5); // 5..9
  const star = { points, step: coprimeStep(points, next()), rotation: (next() / 256) * (360 / points) };

  const tickCount = 12 + (next() % 4) * 4; // 12, 16, 20, 24
  const long: number[] = [];
  for (let t = 0; t < tickCount; t++) if (next() % 5 === 0) long.push(t);
  const ticks = { count: tickCount, rotation: (next() / 256) * (360 / tickCount), long };

  // A bind-rune: a vertical stave with branches chosen by the seed.
  const glyph: SigilShape['glyph'] = [[50, 34, 50, 66]];
  const branches = 2 + (next() % 3);
  for (let b = 0; b < branches; b++) {
    const y = 36 + (next() % 5) * 6;
    const dir = next() % 2 ? 1 : -1;
    const len = 7 + (next() % 3) * 2;
    const slope = (next() % 3) - 1;
    glyph.push([50, y, 50 + dir * len, y + slope * len]);
  }
  if (next() % 2) glyph.push([44, 66, 56, 66]);

  const dotCount = 1 + (next() % 3);
  const dots = Array.from({ length: dotCount }, () => ({
    angle: (next() / 256) * 360,
    radius: 26 + (next() % 3) * 3,
    size: 1.4 + (next() % 3) * 0.5,
  }));

  return { star, ticks, glyph, dots, innerRing: next() % 2 === 0 };
}
