// Sealing and opening a jar.
//
// A random 256-bit seed is the root of everything. The master key and each
// holder's seal are derived from it with HKDF. The master key is split with
// Shamir's Secret Sharing (audited library) into one shard per holder. The
// jar body is encrypted with AES-256-GCM under a key derived from the master
// key. Each personal letter is encrypted under a key derived from the master
// key AND that holder's seal, so the circle can open the jar but each letter
// needs its own recipient too. The readable header is bound to every
// ciphertext as additional authenticated data, so editing it breaks
// decryption.
//
// The seed is printed once, on the owner's key card. With it the owner can
// reseal new content into the same jar: same master key, same seals, so
// every friend's card keeps working and nothing has to be printed again.

import { combine, split } from 'shamir-secret-sharing';
import { concat, equal, fromBase32, fromBase64Url, randomBytes, toBase32, toBase64Url, utf8 } from './bytes.ts';
import {
  JAR_ID_LENGTH,
  KEY_LENGTH,
  MAX_CARDS,
  SEAL_SECRET_LENGTH,
  SEED_LENGTH,
  SHARE_LENGTH,
  shardX,
  type KeyCard,
  type Seal,
  type Shard,
} from './cards.ts';

export const JAR_FORMAT = 'phylactery.jar/1';

export type AccountWish = 'close' | 'memorialize' | 'keep' | 'hand-over';

export interface Account {
  service: string;
  login: string;
  wish: AccountWish;
  note: string;
}

export interface DocumentPlace {
  item: string;
  location: string;
}

export interface Wishes {
  farewell: string;
  body: string;
  dependents: string;
  other: string;
}

export interface JarContent {
  message: string;
  accounts: Account[];
  documents: DocumentPlace[];
  wishes: Wishes;
}

export interface Letter {
  to: string;
  text: string;
}

export interface HolderInput {
  name: string;
  /** Empty string means no personal letter. */
  letter: string;
}

export interface SealInput {
  owner: string;
  content: JarContent;
  holders: HolderInput[];
  threshold: number;
  sealedAt?: Date;
}

export interface JarHolder {
  x: number;
  name: string;
  hasLetter: boolean;
}

interface Sealed {
  iv: string;
  data: string;
}

export interface JarFile {
  format: typeof JAR_FORMAT;
  jarId: string;
  owner: string;
  sealedAt: string;
  /** 1 for the first sealing; each update with the owner's key adds one. Absent in older jars. */
  revision?: number;
  threshold: number;
  total: number;
  holders: JarHolder[];
  body: Sealed;
  letters: { x: number; sealed: Sealed }[];
}

export interface HolderCards {
  name: string;
  x: number;
  hasLetter: boolean;
  shard: Shard;
  seal: Seal;
}

export interface SealResult {
  jar: JarFile;
  cards: HolderCards[];
  /** The owner's own card, for updating the jar later. */
  key: KeyCard;
}

export class JarError extends Error {}

const IV_LENGTH = 12;

function own(u: Uint8Array): Uint8Array<ArrayBuffer> {
  return new Uint8Array(u);
}

async function deriveKey(ikm: Uint8Array, salt: Uint8Array, info: string): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', own(ikm), 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: own(salt), info: own(utf8.encode(info)) },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function deriveBytes(ikm: Uint8Array, salt: Uint8Array, info: string, length: number): Promise<Uint8Array> {
  const base = await crypto.subtle.importKey('raw', own(ikm), 'HKDF', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: own(salt), info: own(utf8.encode(info)) }, base, length * 8);
  return new Uint8Array(bits);
}

const masterFrom = (seed: Uint8Array, jarId: Uint8Array) => deriveBytes(seed, jarId, 'phylactery/master', KEY_LENGTH);
const sealFrom = (seed: Uint8Array, jarId: Uint8Array, x: number) => deriveBytes(seed, jarId, `phylactery/seal/${x}`, SEAL_SECRET_LENGTH);

async function encrypt(key: CryptoKey, plain: Uint8Array, aad: Uint8Array): Promise<Sealed> {
  const iv = randomBytes(IV_LENGTH);
  const data = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: own(aad) },
    key,
    own(plain),
  );
  return { iv: toBase64Url(iv), data: toBase64Url(new Uint8Array(data)) };
}

async function decrypt(key: CryptoKey, sealed: Sealed, aad: Uint8Array): Promise<Uint8Array> {
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: own(fromBase64Url(sealed.iv)), additionalData: own(aad) },
    key,
    own(fromBase64Url(sealed.data)),
  );
  return new Uint8Array(plain);
}

/** The readable part of the jar, serialised in a fixed key order. */
function headerAad(jar: Omit<JarFile, 'body' | 'letters'>): Uint8Array {
  const header = {
    format: jar.format,
    jarId: jar.jarId,
    owner: jar.owner,
    sealedAt: jar.sealedAt,
    // Only present from the first jars that can be updated, so older jars keep their exact header.
    ...(jar.revision === undefined ? {} : { revision: jar.revision }),
    threshold: jar.threshold,
    total: jar.total,
    holders: jar.holders.map((h) => ({ x: h.x, name: h.name, hasLetter: h.hasLetter })),
  };
  return utf8.encode(JSON.stringify(header));
}

const bodyInfo = 'phylactery/body';
const letterInfo = (x: number) => `phylactery/letter/${x}`;

export function validateSealInput(input: SealInput): string[] {
  const problems: string[] = [];
  const total = input.holders.length;
  if (!input.owner.trim()) problems.push('Your name is missing.');
  if (total < 2) problems.push('A circle needs at least two people.');
  if (total > MAX_CARDS) problems.push(`A circle can have at most ${MAX_CARDS} people.`);
  if (!Number.isInteger(input.threshold) || input.threshold < 2 || input.threshold > total) {
    problems.push('The number of cards needed must be between 2 and the size of the circle.');
  }
  const names = input.holders.map((h) => h.name.trim());
  if (names.some((n) => !n)) problems.push('Every person in the circle needs a name.');
  if (new Set(names.map((n) => n.toLowerCase())).size !== names.length) {
    problems.push('Two people in the circle have the same name.');
  }
  return problems;
}

export async function sealJar(input: SealInput): Promise<SealResult> {
  const problems = validateSealInput(input);
  if (problems.length) throw new JarError(problems.join(' '));

  const seed = randomBytes(SEED_LENGTH);
  const jarIdBytes = randomBytes(JAR_ID_LENGTH);
  const masterKey = await masterFrom(seed, jarIdBytes);
  const total = input.holders.length;
  const shares = await split(masterKey, total, input.threshold);

  const people = await Promise.all(
    input.holders.map(async (h, i) => {
      const x = shares[i]![SHARE_LENGTH - 1]!;
      return { name: h.name.trim(), letter: h.letter.trim(), share: shares[i]!, x, sealSecret: await sealFrom(seed, jarIdBytes, x) };
    }),
  );

  const header = {
    format: JAR_FORMAT,
    jarId: toBase32(jarIdBytes),
    owner: input.owner.trim(),
    sealedAt: (input.sealedAt ?? new Date()).toISOString(),
    revision: 1,
    threshold: input.threshold,
    total,
    holders: people.map((p) => ({ x: p.x, name: p.name, hasLetter: p.letter.length > 0 })),
  } satisfies Omit<JarFile, 'body' | 'letters'>;

  const jar = await encryptJar(header, masterKey, jarIdBytes, input.content, people);
  const cards: HolderCards[] = people.map((p) => ({
    name: p.name,
    x: p.x,
    hasLetter: p.letter.length > 0,
    shard: { kind: 'shard', jarId: jarIdBytes, threshold: input.threshold, total, share: p.share },
    seal: { kind: 'seal', jarId: jarIdBytes, x: p.x, secret: p.sealSecret },
  }));
  return { jar, cards, key: { kind: 'key', jarId: jarIdBytes, seed } };
}

async function encryptJar(
  header: Omit<JarFile, 'body' | 'letters'>,
  masterKey: Uint8Array,
  jarIdBytes: Uint8Array,
  content: JarContent,
  people: { x: number; name: string; letter: string; sealSecret: Uint8Array }[],
): Promise<JarFile> {
  const aad = headerAad(header);
  const bodyKey = await deriveKey(masterKey, jarIdBytes, bodyInfo);
  const body = await encrypt(bodyKey, utf8.encode(JSON.stringify(content)), aad);
  const letters: JarFile['letters'] = [];
  for (const p of people) {
    if (!p.letter) continue;
    const key = await deriveKey(concat(masterKey, p.sealSecret), jarIdBytes, letterInfo(p.x));
    const letter: Letter = { to: p.name, text: p.letter };
    const sealed = await encrypt(key, utf8.encode(JSON.stringify(letter)), concat(aad, Uint8Array.of(p.x)));
    letters.push({ x: p.x, sealed });
  }
  return { ...header, body, letters };
}

/** Everything in a jar, as its owner sees it. */
export interface OwnedJar {
  content: JarContent;
  /** The private letters, by the holder's x. */
  letters: Record<number, string>;
}

/** The owner opens their own jar with their key card, to read or update it. */
export async function openWithKey(jar: JarFile, key: KeyCard): Promise<OwnedJar> {
  const jarIdB = jarIdBytes(jar);
  if (!equal(key.jarId, jarIdB)) throw new JarError('This key belongs to another jar.');
  const masterKey = await masterFrom(key.seed, jarIdB);
  let content: JarContent;
  try {
    const plain = await decrypt(await deriveKey(masterKey, jarIdB, bodyInfo), jar.body, headerAad(jar));
    content = JSON.parse(utf8.decode(plain)) as JarContent;
  } catch {
    throw new JarError('This key does not open the jar. It may be from before the jar could be updated, or the file was altered.');
  }
  const letters: Record<number, string> = {};
  for (const entry of jar.letters) {
    const seal: Seal = { kind: 'seal', jarId: jarIdB, x: entry.x, secret: await sealFrom(key.seed, jarIdB, entry.x) };
    letters[entry.x] = (await openLetter(jar, { content, masterKey }, seal)).text;
  }
  return { content, letters };
}

/**
 * Seal new content into the same jar. The circle, the threshold and every
 * card stay the same; only the words change, and the revision goes up.
 */
export async function resealJar(jar: JarFile, key: KeyCard, update: OwnedJar, sealedAt = new Date()): Promise<JarFile> {
  await openWithKey(jar, key); // proves the key is right before anything is written
  const jarIdB = jarIdBytes(jar);
  const masterKey = await masterFrom(key.seed, jarIdB);
  const people = await Promise.all(
    jar.holders.map(async (h) => ({ x: h.x, name: h.name, letter: (update.letters[h.x] ?? '').trim(), sealSecret: await sealFrom(key.seed, jarIdB, h.x) })),
  );
  const header = {
    format: JAR_FORMAT,
    jarId: jar.jarId,
    owner: jar.owner,
    sealedAt: sealedAt.toISOString(),
    revision: (jar.revision ?? 1) + 1,
    threshold: jar.threshold,
    total: jar.total,
    holders: people.map((p) => ({ x: p.x, name: p.name, hasLetter: p.letter.length > 0 })),
  } satisfies Omit<JarFile, 'body' | 'letters'>;
  return encryptJar(header, masterKey, jarIdB, update.content, people);
}

export function jarIdBytes(jar: JarFile): Uint8Array {
  return fromBase32(jar.jarId);
}

export function holderFor(jar: JarFile, x: number): JarHolder | undefined {
  return jar.holders.find((h) => h.x === x);
}

export type ShardCheck =
  | { ok: true; holder: JarHolder }
  | { ok: false; reason: 'other-jar' | 'unknown-holder' | 'duplicate' };

/** Check a shard against the jar and the shards already offered. */
export function checkShard(jar: JarFile, shard: Shard, offered: Shard[]): ShardCheck {
  if (!equal(shard.jarId, jarIdBytes(jar))) return { ok: false, reason: 'other-jar' };
  const x = shardX(shard);
  const holder = holderFor(jar, x);
  if (!holder || shard.threshold !== jar.threshold || shard.total !== jar.total) {
    return { ok: false, reason: 'unknown-holder' };
  }
  if (offered.some((s) => shardX(s) === x)) return { ok: false, reason: 'duplicate' };
  return { ok: true, holder };
}

export interface OpenedJar {
  content: JarContent;
  masterKey: Uint8Array;
}

/**
 * Reconstruct the key from raw shares and decrypt the body. Does not check
 * the threshold, so tests can prove that too few shares reveal nothing.
 */
export async function unlockWithShares(jar: JarFile, shares: Uint8Array[]): Promise<OpenedJar> {
  if (shares.length < 2) throw new JarError('At least two cards are needed.');
  const masterKey = await combine(shares);
  try {
    const bodyKey = await deriveKey(masterKey, jarIdBytes(jar), bodyInfo);
    const plain = await decrypt(bodyKey, jar.body, headerAad(jar));
    return { content: JSON.parse(utf8.decode(plain)) as JarContent, masterKey };
  } catch {
    throw new JarError('The jar would not open. A card may belong to another jar, or the jar file was altered.');
  }
}

export async function openJar(jar: JarFile, shards: Shard[]): Promise<OpenedJar> {
  const accepted: Shard[] = [];
  for (const s of shards) {
    const check = checkShard(jar, s, accepted);
    if (!check.ok) throw new JarError(`A card was refused (${check.reason}).`);
    accepted.push(s);
  }
  if (accepted.length < jar.threshold) {
    throw new JarError(`${jar.threshold} cards are needed. ${accepted.length} were offered.`);
  }
  return unlockWithShares(jar, accepted.map((s) => s.share));
}

export async function openLetter(jar: JarFile, opened: OpenedJar, seal: Seal): Promise<Letter> {
  if (!equal(seal.jarId, jarIdBytes(jar))) throw new JarError('This seal belongs to another jar.');
  const entry = jar.letters.find((l) => l.x === seal.x);
  if (!entry) throw new JarError('There is no letter for this seal.');
  try {
    const key = await deriveKey(concat(opened.masterKey, seal.secret), jarIdBytes(jar), letterInfo(seal.x));
    const plain = await decrypt(key, entry.sealed, concat(headerAad(jar), Uint8Array.of(seal.x)));
    return JSON.parse(utf8.decode(plain)) as Letter;
  } catch {
    throw new JarError('This seal does not open the letter.');
  }
}

/** Parse and structurally validate a jar file. Does not decrypt anything. */
export function parseJar(text: string): JarFile {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new JarError('This file is not a jar.');
  }
  const j = raw as Partial<JarFile>;
  const isSealed = (s: unknown): s is Sealed =>
    typeof s === 'object' && s !== null && typeof (s as Sealed).iv === 'string' && typeof (s as Sealed).data === 'string';
  const ok =
    j &&
    j.format === JAR_FORMAT &&
    typeof j.jarId === 'string' &&
    typeof j.owner === 'string' &&
    typeof j.sealedAt === 'string' &&
    (j.revision === undefined || (Number.isInteger(j.revision) && j.revision >= 1)) &&
    Number.isInteger(j.threshold) &&
    Number.isInteger(j.total) &&
    Array.isArray(j.holders) &&
    j.holders.every((h) => Number.isInteger(h.x) && typeof h.name === 'string' && typeof h.hasLetter === 'boolean') &&
    isSealed(j.body) &&
    Array.isArray(j.letters) &&
    j.letters.every((l) => Number.isInteger(l.x) && isSealed(l.sealed));
  if (!ok) throw new JarError('This jar file is damaged or from an unknown version.');
  return j as JarFile;
}

export function emptyContent(): JarContent {
  return {
    message: '',
    accounts: [],
    documents: [],
    wishes: { farewell: '', body: '', dependents: '', other: '' },
  };
}

function combinations<T>(items: T[], k: number): T[][] {
  const out: T[][] = [];
  const pick = (start: number, acc: T[]) => {
    if (acc.length === k) {
      out.push(acc);
      return;
    }
    for (let i = start; i <= items.length - (k - acc.length); i++) pick(i + 1, [...acc, items[i]!]);
  };
  pick(0, []);
  return out;
}

export interface CircleCheck {
  /** Every group of exactly `threshold` cards that was tried, and all opened it. */
  opened: number;
  /** Every group one card short that was tried, and none opened it. */
  refused: number;
  ok: boolean;
}

/**
 * Prove a freshly sealed jar behaves as promised, before anyone prints a
 * card: every group of `threshold` cards opens it, and no smaller group does.
 * At most ten cards, so this is at most a few hundred decryptions.
 */
export async function verifyCircle(jar: JarFile, cards: HolderCards[]): Promise<CircleCheck> {
  const shares = cards.map((c) => c.shard.share);
  let opened = 0;
  let refused = 0;
  let ok = true;
  for (const group of combinations(shares, jar.threshold)) {
    try {
      await unlockWithShares(jar, group);
      opened++;
    } catch {
      ok = false;
    }
  }
  if (jar.threshold - 1 >= 2) {
    for (const group of combinations(shares, jar.threshold - 1)) {
      try {
        await unlockWithShares(jar, group);
        ok = false;
      } catch {
        refused++;
      }
    }
  } else {
    // One card alone cannot even attempt a reconstruction.
    refused = shares.length;
  }
  return { opened, refused, ok };
}
