// Every card has a little ghost on it: its buddy. The buddy is chosen from
// the jar's id and the card's place in the circle (the order people were
// named in, as kept in the jar's header), so the ghost that appears
// on screen when a card is offered must match the ghost printed on the card.
// Within one circle, buddies wear different costumes (up to eight people)
// and carry different emblems (up to twelve).

import { sha256 } from '@noble/hashes/sha2.js';

export const COSTUMES = ['sheet', 'franken', 'skeleton', 'pumpkin', 'witch', 'bat', 'vampire', 'mummy'] as const;
export const EMBLEMS = ['star', 'moon', 'heart', 'bone', 'drop', 'flower', 'key', 'bell', 'clover', 'spark', 'leaf', 'candy'] as const;

export type Costume = (typeof COSTUMES)[number];
export type Emblem = (typeof EMBLEMS)[number];

export interface Buddy {
  costume: Costume;
  emblem: Emblem;
  /** A small, stable lean in degrees, so a circle of ghosts never looks stiff. */
  tilt: number;
}

function shuffled<T>(items: readonly T[], seed: Uint8Array): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = seed[i % seed.length]! % (i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/**
 * The costumes of a jar's circle, in the order its people are named. Known
 * from the jar's id alone, so the seal wizard can show each friend's ghost
 * before the cards exist, and the printed cards wear the same ones.
 */
export function circleCostumes(jarId: Uint8Array): Costume[] {
  return shuffled(COSTUMES, sha256(jarId));
}

/** Buddies for every card in a circle, keyed by the card's x coordinate; xs in the circle's order. */
export function circleBuddies(jarId: Uint8Array, xs: readonly number[]): Map<number, Buddy> {
  const seed = sha256(jarId);
  const costumes = circleCostumes(jarId);
  const emblems = shuffled(EMBLEMS, seed.slice(8));
  const out = new Map<number, Buddy>();
  xs.forEach((x, i) => {
    out.set(x, {
      costume: costumes[i % costumes.length]!,
      emblem: emblems[i % emblems.length]!,
      tilt: (seed[(16 + i) % seed.length]! % 13) - 6,
    });
  });
  return out;
}
