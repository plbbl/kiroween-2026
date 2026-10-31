// Every card has a little ghost on it: its buddy. The buddy is chosen from
// the jar's id and the card's place in the circle, so the ghost that appears
// on screen when a card is offered must match the ghost printed on the card.
// Within one circle, buddies wear different costumes (up to eight people)
// and carry different emblems (up to twelve).
import { sha256 } from '@noble/hashes/sha2.js';
export const COSTUMES = ['sheet', 'franken', 'skeleton', 'pumpkin', 'witch', 'bat', 'bow', 'mummy'];
export const EMBLEMS = ['star', 'moon', 'heart', 'bone', 'drop', 'flower', 'key', 'bell', 'clover', 'spark', 'leaf', 'candy'];
function shuffled(items, seed) {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
        const j = seed[i % seed.length] % (i + 1);
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}
/** Buddies for every card in a circle, keyed by the card's x coordinate. */
export function circleBuddies(jarId, xs) {
    const seed = sha256(jarId);
    const costumes = shuffled(COSTUMES, seed);
    const emblems = shuffled(EMBLEMS, seed.slice(8));
    const order = [...xs].sort((a, b) => a - b);
    const out = new Map();
    order.forEach((x, i) => {
        out.set(x, {
            costume: costumes[i % costumes.length],
            emblem: emblems[i % emblems.length],
            tilt: (seed[(16 + i) % seed.length] % 13) - 6,
        });
    });
    return out;
}
