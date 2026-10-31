// The watch service: the only part of Phylactery that runs on a server.
//
// It knows names, email addresses and times. It never sees a card or a key.
// If the owner chooses, it also keeps a locked copy of their jar, so that
// friends who are asked to check on them can reach it later; locked,
// because without the cards it is only ciphertext. Everything here is plain
// logic with its store, mailer and clock passed in, so it runs on any host
// and is tested with a fake clock.

import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { toBase64Url } from '../core/bytes.ts';
import { JarError, parseJar } from '../core/jar.ts';
import { holderMessage, ownerReminder, runWatch, validateWatch, type OwnerAction, type WatchConfig, type WatchStatus } from '../core/watch.ts';

export const DAY = 24 * 60 * 60 * 1000;
export const MAX_HOLDERS = 10;
export const MAX_WATCHES_PER_OWNER = 3;
/** A jar is a few kilobytes; long letters make it bigger, never this big. */
export const MAX_JAR_CHARS = 200_000;

export interface Person {
  name: string;
  email: string;
}

interface Holder extends Person {
  optoutHash: string;
  /** For the link to the kept jar, made when friends are first asked. */
  jarHash?: string;
  removed: boolean;
}

/** The owner's jar, as the watch keeps it: locked, exactly as sealed. */
export interface KeptJar {
  json: string;
  keptAt: number;
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
  jar?: KeptJar;
  /**
   * What the owner was actually asked in the current silence (the one that
   * began at the last sign, in schedule days): how many questions went out,
   * and when the latest did. Friends are only asked once the owner has had
   * real time to answer a real question, even after the service was down.
   */
  silence?: { since: number; asked: number; lastAt: number };
  /** When a new manage link was last sent on request, to send at most one an hour. */
  manageResentAt?: number;
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
  /** The one thing the email asks: shown as a button in the HTML part. Its url stands on a line of its own in the text. */
  action?: { label: string; url: string };
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
  /** Optional: the jar file's JSON, to keep for the friends. */
  jar?: unknown;
}

/** Check that what we are given is a jar, and keep it exactly as it is. */
function cleanJar(raw: unknown, now: number): KeptJar {
  const json = typeof raw === 'string' ? raw : JSON.stringify(raw);
  if (!json || json.length > MAX_JAR_CHARS) throw new WatchError('That jar is too large to keep.', 413);
  try {
    parseJar(json);
  } catch (e) {
    throw new WatchError(e instanceof JarError ? e.message : 'That is not a jar.', 400);
  }
  return { json, keptAt: now };
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
    ...(input.jar === undefined || input.jar === null ? {} : { jar: cleanJar(input.jar, deps.now()) }),
  };
  await deps.store.put(record);
  const confirmUrl = link(deps, 'confirm', checkin.token);
  await deps.mailer.send({
    to: owner.email,
    subject: 'Please confirm your watch',
    action: { label: 'Confirm my watch', url: confirmUrl },
    text:
      `Hi ${owner.name.split(/\s+/)[0]},\n\n` +
      `Someone (hopefully you) asked Phylactery to keep watch over you. Nothing will happen until you confirm:\n\n` +
      `${confirmUrl}\n\n` +
      `After that, about every ${config.cadenceDays} day${config.cadenceDays > 1 ? 's' : ''} we will send a link like the one above. One tap says you are still here.\n\n` +
      `Keep this email. This link is the only way to pause, change or delete the watch:\n${link(deps, 'manage', manage.token)}\n\n` +
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
  /** The kept jar, if any: whose it is, its version and when it was given. */
  jar: { owner: string; revision: number; sealedAt: string; keptAt: string } | null;
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
    jar: keptSummary(record.jar),
  };
}

function keptSummary(kept: KeptJar | undefined): WatchView['jar'] {
  if (!kept) return null;
  const j = parseJar(kept.json);
  return { owner: j.owner, revision: j.revision ?? 1, sealedAt: j.sealedAt, keptAt: new Date(kept.keptAt).toISOString() };
}

/** The owner gives the watch their newest jar, or takes it back (jar: null). */
export async function keepJar(deps: Deps, token: unknown, jar: unknown): Promise<WatchView> {
  const record = await load(deps, token, 'manage');
  if (jar === null || jar === undefined) delete record.jar;
  else record.jar = cleanJar(jar, deps.now());
  await deps.store.put(record);
  return view(deps, record);
}

/** A friend's link from the "please check on" email opens the kept jar. */
export async function fetchJar(deps: Deps, token: unknown): Promise<{ jar: string }> {
  const { id, secret } = splitToken(token);
  const record = await deps.store.get(id);
  // A friend who opted out of the emails keeps the link they were given.
  const holder = record?.holders.find((h) => h.jarHash && sameHash(hash(secret), h.jarHash));
  if (!record || !holder) throw new WatchError('That link has expired or was never valid.', 404);
  if (!record.jar) throw new WatchError('No jar is kept with this watch any more. Use the jar file you were given.', 404);
  return { jar: record.jar.json };
}

/**
 * The owner's confirmation link doubles as their check-in link. On first
 * confirmation each friend hears, once, that they were named: an email that
 * arrives years later from a stranger would look like a scam.
 */
export async function confirm(deps: Deps, token: unknown): Promise<WatchView> {
  const record = await load(deps, token, 'checkin');
  if (record.confirmedAt === null) {
    record.confirmedAt = deps.now();
    const optouts = await rotateOptouts(deps, record);
    const owner = record.owner.name;
    const first = owner.split(/\s+/)[0]!;
    for (const [i, h] of record.holders.entries()) {
      if (h.removed) continue;
      await deps.mailer.send({
        to: h.email,
        subject: `${owner} named you in their Phylactery`,
        text:
          `Dear ${h.name.split(/\s+/)[0]},\n\n` +
          `${owner} set up Phylactery, a gentle check-in: now and then we ask ${first} "still here?", and ${first} taps a link. ` +
          `${first} named you as someone we should write to if they ever stop answering for a long time.\n\n` +
          `There is nothing for you to do now. If we ever write again, it will be from this address, with the subject "Please check on ${owner}".\n\n` +
          `${first} may also give you a card: a printed page titled "${owner}'s jar" with 30 numbered words. Keep it safe, like a house key.\n\n` +
          `— Phylactery\n\n` +
          `Would rather not be part of this? ${link(deps, 'optout', optouts[i]!)}\n`,
      });
    }
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
        text:
          `Dear ${h.name.split(/\s+/)[0]},\n\n` +
          `Good news: ${record.owner.name} just answered us. All is well, and there is nothing more to do. Thank you for caring.\n\n` +
          `— Phylactery\n`,
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

/**
 * The owner lost the email with their manage link: send a new one to the
 * address the watch belongs to. The answer is the same whether or not a
 * watch exists, so no one learns who has one.
 */
export async function resendManage(deps: Deps, raw: unknown): Promise<{ ok: true }> {
  const email = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (!EMAIL.test(email)) throw new WatchError('That doesn’t look like an email address.', 400);
  const ownerKey = hash(email);
  const now = deps.now();
  for (const id of await deps.store.ids()) {
    const record = await deps.store.get(id);
    if (!record || record.ownerKey !== ownerKey || record.confirmedAt === null) continue;
    if (record.manageResentAt && now - record.manageResentAt < 60 * 60 * 1000) continue;
    const manage = newToken(deps, record.id);
    record.manageHash = manage.hash;
    record.manageResentAt = now;
    await deps.store.put(record);
    const url = link(deps, 'manage', manage.token);
    await deps.mailer.send({
      to: record.owner.email,
      subject: 'Your new manage link',
      action: { label: 'Manage my watch', url },
      text:
        `Someone (hopefully you) asked for a new link to manage your watch. Here it is; the old one no longer works:\n\n${url}\n\n` +
        `If this wasn't you, nothing else has changed, and your watch carries on.\n`,
    });
  }
  return { ok: true };
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
/**
 * Once a year, on the Day of the Dead (November 2), the owner is asked
 * whether their jar still says what they want. Not in a watch's first
 * month, not while it is paused, and not while friends are being asked.
 */
function reviewDue(record: WatchRecord, now: number, status: WatchStatus): string | null {
  if (record.confirmedAt === null || status === 'paused' || status === 'notified') return null;
  const year = new Date(now).getUTCFullYear();
  const dayOfTheDead = Date.UTC(year, 10, 2);
  const key = `review:${year}`;
  if (now < dayOfTheDead || record.sent.includes(key) || record.confirmedAt > dayOfTheDead - 30 * DAY) return null;
  return key;
}

export async function tick(deps: Deps): Promise<{ sent: number }> {
  let sent = 0;
  const now = deps.now();
  for (const id of await deps.store.ids()) {
    const record = await deps.store.get(id);
    if (!record || record.confirmedAt === null) continue;
    const run = runWatch(record.config, record.actions, daysSince(record, now));
    const due = run.events.filter((e) => (e.kind === 'due' || e.kind === 'reminder' || e.kind === 'notify') && !record.sent.includes(`${e.kind}:${e.at.toFixed(5)}`));
    const review = reviewDue(record, now, run.status);
    if (!due.length && !review) continue;
    const first = record.owner.name.split(/\s+/)[0]!;
    if (review) {
      const updateUrl = `${deps.baseUrl.replace(/\/?$/, '/')}#/seal?update`;
      await deps.mailer.send({
        to: record.owner.email,
        subject: `${first}, a yearly look at your jar`,
        action: { label: 'Update my jar', url: updateUrl },
        text:
          `Today is the Day of the Dead. Once a year, on this day, we suggest a look at what you left in your jar.\n\n` +
          `Passwords change, accounts close, people move. If something in your jar is out of date, change it with your key:\n${updateUrl}\n\n` +
          `Your friends keep their cards; send them the new jar file` +
          `${record.jar ? ', and give the watch a copy from your manage link' : ''}.\n\n` +
          `If everything is still right, there is nothing to do. Your watch carries on as before.\n`,
      });
      record.sent.push(review);
      sent++;
    }
    if (!due.length) {
      await deps.store.put(record);
      continue;
    }
    if (record.silence?.since !== run.lastSign) record.silence = { since: run.lastSign, asked: 0, lastAt: 0 };
    const silence = record.silence;
    // After downtime several questions may be due at once: send only the latest.
    const questions = due.filter((e) => e.kind !== 'notify');
    let ask = questions[questions.length - 1];
    const notify = due.find((e) => e.kind === 'notify');
    // Friends are never asked before the owner was: if no question went out in
    // this silence (the service was down), ask now and ask the friends later.
    if (notify && !ask && silence.asked === 0) {
      ask = run.events.filter((e) => (e.kind === 'due' || e.kind === 'reminder') && e.at >= run.lastSign).pop();
    }
    // The owner gets at least the time the schedule leaves between two questions.
    const gap = (record.config.graceDays / (record.config.reminders + 1)) * DAY;
    const friendsNow = notify && !ask && silence.asked > 0 && now - silence.lastAt >= gap - 1000;
    const toSend = [...(ask ? [ask] : []), ...(friendsNow ? [notify] : [])];
    const checkinToken = await rotateCheckin(deps, record);
    const hereUrl = link(deps, 'here', checkinToken);
    for (const e of toSend) {
      if (e.kind !== 'notify') {
        silence.asked++;
        silence.lastAt = now;
      }
      if (e.kind === 'due') {
        await deps.mailer.send({
          to: record.owner.email,
          subject: `${first}, still here?`,
          action: { label: 'I’m here', url: hereUrl },
          text:
            `Just checking in. One tap lets us know you are well:\n\n${hereUrl}\n\n` +
            `Going away for a while? Pause the watch from the manage link in your first email.\n`,
        });
      } else if (e.kind === 'reminder') {
        const m = ownerReminder(first, e.n ?? 1, record.config.reminders);
        await deps.mailer.send({ to: record.owner.email, subject: m.subject, action: { label: 'I’m here', url: hereUrl }, text: `${m.body}\n\n${hereUrl}\n` });
      } else {
        const optouts = await rotateOptouts(deps, record);
        const jarLinks = await rotateJarLinks(deps, record);
        for (const [i, h] of record.holders.entries()) {
          if (h.removed) continue;
          const m = holderMessage(record.owner.name, h.name, { days: (now - record.confirmedAt) / DAY - run.lastSign, asked: silence.asked });
          await deps.mailer.send({
            to: h.email,
            subject: m.subject,
            text:
              `${m.body}\n${whatToDo(deps, record, h, jarLinks[i]!)}\n\n` +
              `— Phylactery, the check-in ${first} set up\n\n` +
              `Would rather not get these emails? ${link(deps, 'optout', optouts[i]!)}${record.jar ? '\n(Your link to the jar keeps working.)' : ''}\n`,
          });
        }
        await deps.mailer.send({
          to: record.owner.email,
          subject: 'We asked your friends to check on you',
          action: { label: 'I’m fine, tell them', url: hereUrl },
          text: `We have not heard from you, so we asked ${list(record.holders.filter((h) => !h.removed).map((h) => h.name))} to look in on you.\n\nIf you are fine, tap here and we will tell them:\n${hereUrl}\n`,
        });
      }
      sent++;
    }
    // Questions that were due are done (the latest was sent); the friends' turn waits until it really happened.
    record.sent.push(...questions.map((e) => `${e.kind}:${e.at.toFixed(5)}`), ...(friendsNow ? [`notify:${notify.at.toFixed(5)}`] : []));
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

/**
 * The part of the email that tells a friend who else was asked and how the
 * circle opens the jar, if it ever comes to that.
 */
function whatToDo(deps: Deps, record: WatchRecord, holder: Holder, jarToken: string): string {
  const first = record.owner.name.split(/\s+/)[0]!;
  // The circle needs to gather, so friends can reach each other: the form says so.
  const others = record.holders.filter((h) => !h.removed && h !== holder).map((h) => `${h.name} (${h.email})`);
  const asked = others.length ? `We wrote to ${list(others)} too.\n\n` : '';
  const base = deps.baseUrl.replace(/\/?$/, '/');
  const kept = record.jar ? parseJar(record.jar.json) : null;
  const card = `a printed page titled "${record.owner.name}'s jar" with 30 numbered words`;
  // Without a kept jar we can't tell who holds a card; with one, we can.
  const holds = kept ? kept.holders.some((k) => sameName(k.name, holder.name)) : null;
  const what =
    holds === null
      ? `in a locked jar, and gave cards to the people who can open it (each ${card}). Enough of them together can open it.`
      : holds
        ? `in a locked jar, and you hold one of its cards (${card}). Any ${kept!.threshold} of ${list(kept!.holders.map((h) => h.name))} can open it together.`
        : `in a locked jar. You don't hold one of its cards, but ${list(kept!.holders.map((h) => h.name))} do (each ${card}); any ${kept!.threshold} of them together can open it.`;
  const how = kept
    ? `${first} left a locked copy with us. When you are ready, this link opens it for you; the others get their own:\n${base}#/seance?jar=${encodeURIComponent(jarToken)}`
    : `Open the jar file ${first} gave you (or ${base}#/seance), and each offer your card.`;
  return (
    asked +
    `If you learn that ${first} has passed away: ${first} left words for the people close to them ${what} ${how}` +
    (holds === false ? '' : `\n\nUntil then, keep your card safe.`)
  );
}

/** "Rosa" and "Rosa Lopez" are the same person here; case and spacing don't matter. */
function sameName(a: string, b: string): boolean {
  const norm = (s: string) => s.trim().toLowerCase().split(/\s+/);
  const [x, y] = [norm(a), norm(b)];
  if (x.join(' ') === y.join(' ')) return true;
  return (x.length === 1 || y.length === 1) && x[0] === y[0];
}

const list = (names: string[]) => (names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : (names[0] ?? ''));

/** Each friend gets their own link to the kept jar; earlier ones stop working. */
async function rotateJarLinks(deps: Deps, record: WatchRecord): Promise<string[]> {
  const tokens = record.holders.map((h) => {
    const t = newToken(deps, record.id);
    h.jarHash = t.hash;
    return t.token;
  });
  await deps.store.put(record);
  return tokens;
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
