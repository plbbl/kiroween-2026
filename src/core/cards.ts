// What is printed on each card.
//
// Every card folds in half. The outside carries a shard: one Shamir share
// of the jar's master key. The inside carries the holder's personal seal,
// which opens the letter written only to them. A seal is not a share, so
// the people at the circle never learn each other's seals.
//
// Both are encoded twice: as a QR code and as a list of words.

import { sha256 } from '@noble/hashes/sha2.js';
import { concat, equal, fromBase32, toBase32 } from './bytes.ts';
import { bytesToWords, splitWords, wordCountFor, wordsToBytes, WordsError } from './words.ts';

export const JAR_ID_LENGTH = 4;
export const KEY_LENGTH = 32;
export const SHARE_LENGTH = KEY_LENGTH + 1; // Shamir appends the x coordinate
export const SEAL_SECRET_LENGTH = 16;
export const MAX_CARDS = 10;

const SHARD_KIND = 0x01;
const SEAL_KIND = 0x02;
const SHARD_LENGTH = SHARE_LENGTH + JAR_ID_LENGTH + 2 + 1; // 40 bytes, 30 words
const SEAL_LENGTH = SEAL_SECRET_LENGTH + JAR_ID_LENGTH + 1 + 1; // 22 bytes, 17 words
const QR_PREFIX = 'PH1-';
const QR_CHECKSUM_LENGTH = 2;

export const SHARD_WORDS = wordCountFor(SHARD_LENGTH);
export const SEAL_WORDS = wordCountFor(SEAL_LENGTH);

export interface Shard {
  kind: 'shard';
  jarId: Uint8Array;
  threshold: number;
  total: number;
  /** Shamir share, last byte is its x coordinate. */
  share: Uint8Array;
}

export interface Seal {
  kind: 'seal';
  jarId: Uint8Array;
  /** x coordinate of the shard on the same card. */
  x: number;
  secret: Uint8Array;
}

export type Card = Shard | Seal;

export class CardError extends Error {}

export function shardX(shard: Shard): number {
  return shard.share[SHARE_LENGTH - 1]!;
}

// The secret bytes come first so that the words on two cards of the same
// jar differ from the very first word; the shared jar id and the kind byte
// come last.
export function encodeCard(card: Card): Uint8Array {
  if (card.kind === 'shard') {
    return concat(card.share, card.jarId, Uint8Array.of(card.threshold, card.total, SHARD_KIND));
  }
  return concat(card.secret, card.jarId, Uint8Array.of(card.x, SEAL_KIND));
}

export function decodeCard(bytes: Uint8Array): Card {
  const kind = bytes[bytes.length - 1];
  if (kind === SHARD_KIND && bytes.length === SHARD_LENGTH) {
    const share = bytes.slice(0, SHARE_LENGTH);
    const jarId = bytes.slice(SHARE_LENGTH, SHARE_LENGTH + JAR_ID_LENGTH);
    const threshold = bytes[SHARE_LENGTH + JAR_ID_LENGTH]!;
    const total = bytes[SHARE_LENGTH + JAR_ID_LENGTH + 1]!;
    if (threshold < 2 || threshold > total || total > MAX_CARDS) {
      throw new CardError('This card describes an impossible circle.');
    }
    if (share[SHARE_LENGTH - 1] === 0) throw new CardError('This card is damaged.');
    return { kind: 'shard', jarId, threshold, total, share };
  }
  if (kind === SEAL_KIND && bytes.length === SEAL_LENGTH) {
    const secret = bytes.slice(0, SEAL_SECRET_LENGTH);
    const jarId = bytes.slice(SEAL_SECRET_LENGTH, SEAL_SECRET_LENGTH + JAR_ID_LENGTH);
    const x = bytes[SEAL_SECRET_LENGTH + JAR_ID_LENGTH]!;
    if (x === 0) throw new CardError('This seal is damaged.');
    return { kind: 'seal', jarId, x, secret };
  }
  throw new CardError('This is not a Phylactery card.');
}

export function cardToQrText(card: Card): string {
  const bytes = encodeCard(card);
  const check = sha256(bytes).slice(0, QR_CHECKSUM_LENGTH);
  return QR_PREFIX + toBase32(concat(bytes, check));
}

export function cardToWords(card: Card): string[] {
  return bytesToWords(encodeCard(card));
}

/** Accepts the text of a scanned QR code or a list of typed words. */
export function parseCard(input: string): Card {
  const text = input.trim();
  if (text.toUpperCase().startsWith(QR_PREFIX)) {
    let raw: Uint8Array;
    try {
      raw = fromBase32(text.slice(QR_PREFIX.length));
    } catch {
      throw new CardError('This code could not be read.');
    }
    if (raw.length <= QR_CHECKSUM_LENGTH) throw new CardError('This code is incomplete.');
    const bytes = raw.slice(0, raw.length - QR_CHECKSUM_LENGTH);
    const check = raw.slice(raw.length - QR_CHECKSUM_LENGTH);
    if (!equal(sha256(bytes).slice(0, QR_CHECKSUM_LENGTH), check)) {
      throw new CardError('This code is damaged.');
    }
    return decodeCard(bytes);
  }
  const words = splitWords(text);
  const length =
    words.length === SHARD_WORDS ? SHARD_LENGTH : words.length === SEAL_WORDS ? SEAL_LENGTH : null;
  if (length === null) {
    throw new CardError(
      `A shard has ${SHARD_WORDS} words and a seal has ${SEAL_WORDS}. You entered ${words.length}.`,
    );
  }
  try {
    return decodeCard(wordsToBytes(words, length));
  } catch (e) {
    if (e instanceof WordsError || e instanceof CardError) throw new CardError(e.message);
    throw e;
  }
}
