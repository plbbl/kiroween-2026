// The watch service: the only part of Phylactery that runs on a server.
//
// It knows names, email addresses and times. It never sees a jar, a card
// or a key. Everything here is plain logic with its store, mailer and clock
// passed in, so it runs on any host and is tested with a fake clock.

import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { toBase64Url } from '../core/bytes.ts';
import { holderMessage, ownerReminder, runWatch, validateWatch, type OwnerAction, type WatchConfig, type WatchStatus } from '../core/watch.ts';

export const DAY = 24 * 60 * 60 * 1000;
export const MAX_HOLDERS = 10;
export const MAX_WATCHES_PER_OWNER = 3;

export interface Person {
  name: string;
  email: string;
}

interface Holder extends Person {
  optoutHash: string;
  removed: boolean;
}

export interface WatchRecord {
  v: 1;
  id: string;
  createdAt: number;
  /** The watch only starts once the owner confirms their address. */
  confirmedAt: number | null;
  owner: Person;
  ownerKey: string;
  holders: Holder[];
  config: WatchConfig;
  /** Owner actions, in days since confirmation. */
  actions: OwnerAction[];
  /** Messages already sent, so a tick never sends one twice. */
  sent: string[];
  manageHash: string;
  checkinHash: string;
}

export interface WatchStore {
  get(id: string): Promise<WatchRecord | null>;
  put(record: WatchRecord): Promise<void>;
  delete(id: string): Promise<void>;
  ids(): Promise<string[]>;
}

export interface Mail {
  to: string;
  subject: string;
  text: string;
}

export interface Mailer {
  send(mail: Mail): Promise<void>;
}

export interface Deps {
  store: WatchStore;
  mailer: Mailer;
  now: () => number;
  /** Where the app is served, for links in emails, e.g. https://example.org/ */
  baseUrl: string;
  random?: (n: number) => Uint8Array;
}

export class WatchError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;

function rand(deps: Deps, n: number): Uint8Array {
  return deps.random ? deps.random(n) : crypto.getRandomValues(new Uint8Array(n));
}

const hash = (s: string) => bytesToHex(sha256(new TextEncoder().encode(s)));

function sameHash(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

/** A token is "<watch id>.<secret>"; only the hash of the secret is stored. */
function newToken(deps: Deps, id: string): { token: string; hash: string } {
  const secret = toBase64Url(rand(deps, 24));
  return { token: `${id}.${secret}`, hash: hash(secret) };
}

function splitToken(token: unknown): { id: string; secret: string } {
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{8,40}\.[A-Za-z0-9_-]{16,64}$/.test(token)) {
    throw new WatchError('That link is not valid.', 400);
  }
  const [id, secret] = token.split('.') as [string, string];
  return { id, secret };
}

const link = (deps: Deps, action: string, token: string) => `${deps.baseUrl.replace(/\/?$/, '/')}#/watch?${action}=${encodeURIComponent(token)}`;

function cleanPerson(p: unknown, what: string): Person {
  const o = (p ?? {}) as Partial<Person>;
  const name = typeof o.name === 'string' ? o.name.trim().slice(0, 80) : '';
  const email = typeof o.email === 'string' ? o.email.trim().toLowerCase() : '';
  if (!name) throw new WatchError(`${what} needs a name.`, 400);
  if (!EMAIL.test(email)) throw new WatchError(`${what} needs a real email address.`, 400);
  return { name, email };
}

export interface CreateInput {
  owner: Person;
  holders: Person[];
  config: WatchConfig;
}

export async function createWatch(deps: Deps, raw: unknown): Promise<{ id: string }> {
  const input = (raw ?? {}) as Partial<CreateInput>;
  const owner = cleanPerson(input.owner, 'You');
  if (!Array.isArray(input.holders) || input.holders.length < 1 || input.holders.length > MAX_HOLDERS) {
    throw new WatchError(`Name between 1 and ${MAX_HOLDERS} friends.`, 400);
  }
  const holders = input.holders.map((h, i) => cleanPerson(h, `Friend ${i + 1}`));
  if (holders.some((h) => h.email === owner.email)) throw new WatchError('A friend cannot have your own address.', 400);
  const c = (input.config ?? {}) as Partial<WatchConfig>;
  const config: WatchConfig = { cadenceDays: Number(c.cadenceDays), graceDays: Number(c.graceDays), reminders: Number(c.reminders) };
  const problems = validateWatch(config);
  if (problems.length) throw new WatchError(problems[0]!, 400);

  const ownerKey = hash(owner.email);
  let existing = 0;
  for (const id of await deps.store.ids()) {
    if ((await deps.store.get(id))?.ownerKey === ownerKey) existing++;
  }
  if (existing >= MAX_WATCHES_PER_OWNER) throw new WatchError('This address already has as many watches as it may.', 429);

  const id = toBase64Url(rand(deps, 12));
  const manage = newToken(deps, id);
  const checkin = newToken(deps, id);
  const record: WatchRecord = {
    v: 1,
    id,
    createdAt: deps.now(),
    confirmedAt: null,
    owner,
    ownerKey,
    // Opt-out links are made when friends are first asked to check in.
    holders: holders.map((h) => ({ ...h, optoutHash: '', removed: false })),
    config,
    actions: [],
    sent: [],
    manageHash: manage.hash,
    checkinHash: checkin.hash,
  };
  await deps.store.put(record);
  await deps.mailer.send({
    to: owner.email,
    subject: 'Please confirm your watch',
    text:
      `Hi ${owner.name},\n\n` +
      `Someone (hopefully you) asked Phylactery to keep watch over you. Nothing will happen until you confirm:\n\n` +
      `${link(deps, 'confirm', checkin.token)}\n\n` +
      `After that, about every ${config.cadenceDays} day${config.cadenceDays > 1 ? 's' : ''} we will send a link like the one above. One tap says you are still here.\n\n` +
      `Keep this link to pause, change or delete the watch:\n${link(deps, 'manage', manage.token)}\n\n` +
      `If this wasn't you, ignore this email and nothing more will be sent.\n`,
  });
  return { id };
}

/** Load a watch by token. A check-in also accepts the owner's manage link. */
async function load(deps: Deps, token: unknown, kind: 'manage' | 'checkin'): Promise<WatchRecord> {
  const { id, secret } = splitToken(token);
  const record = await deps.store.get(id);
  const h = hash(secret);
  const ok = record && (sameHash(h, record.manageHash) || (kind === 'checkin' && sameHash(h, record.checkinHash)));
  if (!record || !ok) throw new WatchError('That link has expired or was never valid.', 404);
  return record;
}

const daysSince = (record: WatchRecord, now: number) => (record.confirmedAt === null ? 0 : (now - record.confirmedAt) / DAY);

export interface WatchView {
  owner: string;
  confirmed: boolean;
  status: WatchStatus;
  config: WatchConfig;
  holders: string[];
  lastSign: string | null;
  nextAsk: string | null;
}

function view(deps: Deps, record: WatchRecord): WatchView {
  const now = deps.now();
  const days = daysSince(record, now);
  const run = runWatch(record.config, record.actions, days);
  const confirmed = record.confirmedAt !== null;
  const lastSignAt = confirmed ? record.confirmedAt! + run.lastSign * DAY : null;
  const nextAsk = confirmed && run.status === 'well' ? lastSignAt! + record.config.cadenceDays * DAY : null;
  return {
    owner: record.owner.name,
    confirmed,
    status: confirmed ? run.status : 'paused',
    config: record.config,
    holders: record.holders.filter((h) => !h.removed).map((h) => h.name),
    lastSign: lastSignAt ? new Date(lastSignAt).toISOString() : null,
    nextAsk: nextAsk ? new Date(nextAsk).toISOString() : null,
  };
}

/** The owner's confirmation link doubles as their check-in link. */
export async function confirm(deps: Deps, token: unknown): Promise<WatchView> {
  const record = await load(deps, token, 'checkin');
  if (record.confirmedAt === null) {
    record.confirmedAt = deps.now();
    await deps.store.put(record);
  }
  return view(deps, record);
}

export async function checkin(deps: Deps, token: unknown): Promise<WatchView> {
  const record = await load(deps, token, 'checkin');
  if (record.confirmedAt === null) return confirm(deps, token);
  const now = deps.now();
  const before = runWatch(record.config, record.actions, daysSince(record, now)).status;
  record.actions.push({ at: daysSince(record, now), type: before === 'paused' ? 'resume' : 'checkin' });
  await deps.store.put(record);
  // Knock thrice: if friends were already asked, tell them all is well.
  if (before === 'notified') {
    for (const h of record.holders.filter((x) => !x.removed)) {
      await deps.mailer.send({
        to: h.email,
        subject: `${record.owner.name} is okay`,
        text: `Dear ${h.name},\n\n${record.owner.name} has just let us know they are well. Thank you for caring. There is nothing more to do.\n`,
      });
    }
  }
  return view(deps, record);
}

export async function status(deps: Deps, token: unknown): Promise<WatchView> {
  return view(deps, await load(deps, token, 'manage'));
}

export async function setPaused(deps: Deps, token: unknown, paused: boolean): Promise<WatchView> {
  const record = await load(deps, token, 'manage');
  if (record.confirmedAt === null) throw new WatchError('Confirm the watch first, from the email we sent.', 409);
  record.actions.push({ at: daysSince(record, deps.now()), type: paused ? 'pause' : 'resume' });
  await deps.store.put(record);
  return view(deps, record);
}

export async function remove(deps: Deps, token: unknown): Promise<void> {
  const record = await load(deps, token, 'manage');
  await deps.store.delete(record.id);
}

export async function optOut(deps: Deps, token: unknown): Promise<{ owner: string }> {
  const { id, secret } = splitToken(token);
  const record = await deps.store.get(id);
  const holder = record?.holders.find((h) => h.optoutHash && sameHash(hash(secret), h.optoutHash));
  if (!record || !holder) throw new WatchError('That link has expired or was never valid.', 404);
  holder.removed = true;
  await deps.store.put(record);
  return { owner: record.owner.name };
}

/** Send whatever is due. Call it on a schedule, e.g. hourly. */
export async function tick(deps: Deps): Promise<{ sent: number }> {
  let sent = 0;
  const now = deps.now();
  for (const id of await deps.store.ids()) {
    const record = await deps.store.get(id);
    if (!record || record.confirmedAt === null) continue;
    const run = runWatch(record.config, record.actions, daysSince(record, now));
    const due = run.events.filter((e) => (e.kind === 'due' || e.kind === 'reminder' || e.kind === 'notify') && !record.sent.includes(`${e.kind}:${e.at.toFixed(5)}`));
    if (!due.length) continue;
    // After downtime several questions may be due at once: send only the latest.
    const questions = due.filter((e) => e.kind !== 'notify');
    const toSend = [...questions.slice(-1), ...due.filter((e) => e.kind === 'notify')];
    const checkinToken = await rotateCheckin(deps, record);
    for (const e of toSend) {
      const first = record.owner.name.split(/\s+/)[0]!;
      if (e.kind === 'due') {
        await deps.mailer.send({
          to: record.owner.email,
          subject: `${first}, still here?`,
          text: `Just checking in. One tap lets us know you are well:\n\n${link(deps, 'here', checkinToken)}\n`,
        });
      } else if (e.kind === 'reminder') {
        const m = ownerReminder(first, e.n ?? 1, record.config.reminders);
        await deps.mailer.send({ to: record.owner.email, subject: m.subject, text: `${m.body}\n\n${link(deps, 'here', checkinToken)}\n` });
      } else {
        const optouts = await rotateOptouts(deps, record);
        for (const [i, h] of record.holders.entries()) {
          if (h.removed) continue;
          const m = holderMessage(record.owner.name, h.name);
          await deps.mailer.send({
            to: h.email,
            subject: m.subject,
            text: `${m.body}\nIf you don't know ${record.owner.name}, or would rather not be asked again: ${link(deps, 'optout', optouts[i]!)}\n`,
          });
        }
        await deps.mailer.send({
          to: record.owner.email,
          subject: 'We asked your friends to check on you',
          text: `We have not heard from you, so we asked ${record.holders.filter((h) => !h.removed).map((h) => h.name).join(', ')} to look in on you.\n\nIf you are fine, tap here and we will tell them:\n${link(deps, 'here', checkinToken)}\n`,
        });
      }
      sent++;
    }
    record.sent.push(...due.map((e) => `${e.kind}:${e.at.toFixed(5)}`));
    await deps.store.put(record);
  }
  return { sent };
}

/**
 * Check-in links in emails must work, but the stored hash is all we keep.
 * Each batch of reminders gets a fresh check-in token; the old one stops
 * working, which also limits how long a forwarded email stays useful.
 */
async function rotateCheckin(deps: Deps, record: WatchRecord): Promise<string> {
  const t = newToken(deps, record.id);
  record.checkinHash = t.hash;
  await deps.store.put(record);
  return t.token;
}

async function rotateOptouts(deps: Deps, record: WatchRecord): Promise<string[]> {
  const tokens = record.holders.map((h) => {
    const t = newToken(deps, record.id);
    h.optoutHash = t.hash;
    return t.token;
  });
  await deps.store.put(record);
  return tokens;
}
