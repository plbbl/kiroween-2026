// Encode bytes as words from the BIP-39 English list (2048 words, 11 bits
// each) so a card can be typed in by hand when its code cannot be scanned.
// The bits left over after the data are filled with a SHA-256 checksum,
// so a mistyped word is caught instead of producing a wrong key.

import { sha256 } from '@noble/hashes/sha2.js';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { readBits } from './bytes.ts';

export const BITS_PER_WORD = 11;
const MIN_CHECKSUM_BITS = 8;

const index = new Map(wordlist.map((w, i) => [w, i]));

export function wordCountFor(byteLength: number): number {
  return Math.ceil((byteLength * 8 + MIN_CHECKSUM_BITS) / BITS_PER_WORD);
}

function checksumBits(data: Uint8Array, count: number): number {
  return readBits(sha256(data), 0, count);
}

export function bytesToWords(data: Uint8Array): string[] {
  const words = wordCountFor(data.length);
  const dataBits = data.length * 8;
  const csBits = words * BITS_PER_WORD - dataBits;
  const cs = checksumBits(data, csBits);
  const out: string[] = [];
  for (let w = 0; w < words; w++) {
    let v = 0;
    for (let b = 0; b < BITS_PER_WORD; b++) {
      const bit = w * BITS_PER_WORD + b;
      const value =
        bit < dataBits
          ? readBits(data, bit, 1)
          : (cs >> (csBits - 1 - (bit - dataBits))) & 1;
      v = (v << 1) | value;
    }
    out.push(wordlist[v]!);
  }
  return out;
}

export class WordsError extends Error {}

/** Normalise free-form typing: case, extra spaces, punctuation, numbering. */
export function splitWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

export function isKnownWord(word: string): boolean {
  return index.has(word);
}

/** Words that start with the given prefix, for autocomplete. */
export function suggest(prefix: string, limit = 5): string[] {
  const p = prefix.toLowerCase();
  if (!p) return [];
  const out: string[] = [];
  for (const w of wordlist) {
    if (w.startsWith(p)) {
      out.push(w);
      if (out.length >= limit) break;
    }
  }
  return out;
}

export function wordsToBytes(words: string[], byteLength: number): Uint8Array {
  const expected = wordCountFor(byteLength);
  if (words.length !== expected) {
    throw new WordsError(`Expected ${expected} words, got ${words.length}.`);
  }
  const values = words.map((w, i) => {
    const v = index.get(w);
    if (v === undefined) throw new WordsError(`Word ${i + 1} ("${w}") is not on the word list.`);
    return v;
  });
  const dataBits = byteLength * 8;
  const csBits = expected * BITS_PER_WORD - dataBits;
  const data = new Uint8Array(byteLength);
  let cs = 0;
  for (let bit = 0; bit < expected * BITS_PER_WORD; bit++) {
    const v = values[Math.floor(bit / BITS_PER_WORD)]!;
    const value = (v >> (BITS_PER_WORD - 1 - (bit % BITS_PER_WORD))) & 1;
    if (bit < dataBits) {
      if (value) data[bit >> 3]! |= 1 << (7 - (bit & 7));
    } else {
      cs = (cs << 1) | value;
    }
  }
  if (cs !== checksumBits(data, csBits)) {
    throw new WordsError('The words do not add up. One of them is probably mistyped.');
  }
  return data;
}
