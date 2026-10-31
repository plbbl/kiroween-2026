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
import { holderMessage, ownerReminder, runWatch, validateWatch } from '../core/watch.ts';
export const DAY = 24 * 60 * 60 * 1000;
export const MAX_HOLDERS = 10;
export const MAX_WATCHES_PER_OWNER = 3;
/** A jar is a few kilobytes; long letters make it bigger, never this big. */
export const MAX_JAR_CHARS = 200_000;
export class WatchError extends Error {
    status;
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;
function rand(deps, n) {
    return deps.random ? deps.random(n) : crypto.getRandomValues(new Uint8Array(n));
}
const hash = (s) => bytesToHex(sha256(new TextEncoder().encode(s)));
function sameHash(a, b) {
    if (a.length !== b.length)
        return false;
    let d = 0;
    for (let i = 0; i < a.length; i++)
        d |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return d === 0;
}
/** A token is "<watch id>.<secret>"; only the hash of the secret is stored. */
function newToken(deps, id) {
    const secret = toBase64Url(rand(deps, 24));
    return { token: `${id}.${secret}`, hash: hash(secret) };
}
function splitToken(token) {
    if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{8,40}\.[A-Za-z0-9_-]{16,64}$/.test(token)) {
        throw new WatchError('That link is not valid.', 400);
    }
    const [id, secret] = token.split('.');
    return { id, secret };
}
const link = (deps, action, token) => `${deps.baseUrl.replace(/\/?$/, '/')}#/watch?${action}=${encodeURIComponent(token)}`;
function cleanPerson(p, what) {
    const o = (p ?? {});
    const name = typeof o.name === 'string' ? o.name.trim().slice(0, 80) : '';
    const email = typeof o.email === 'string' ? o.email.trim().toLowerCase() : '';
    if (!name)
        throw new WatchError(`${what} needs a name.`, 400);
    if (!EMAIL.test(email))
        throw new WatchError(`${what} needs a real email address.`, 400);
    return { name, email };
}
/** Check that what we are given is a jar, and keep it exactly as it is. */
function cleanJar(raw, now) {
    const json = typeof raw === 'string' ? raw : JSON.stringify(raw);
    if (!json || json.length > MAX_JAR_CHARS)
        throw new WatchError('That jar is too large to keep.', 413);
    try {
        parseJar(json);
    }
    catch (e) {
        throw new WatchError(e instanceof JarError ? e.message : 'That is not a jar.', 400);
    }
    return { json, keptAt: now };
}
export async function createWatch(deps, raw) {
    const input = (raw ?? {});
    const owner = cleanPerson(input.owner, 'You');
    if (!Array.isArray(input.holders) || input.holders.length < 1 || input.holders.length > MAX_HOLDERS) {
        throw new WatchError(`Name between 1 and ${MAX_HOLDERS} friends.`, 400);
    }
    const holders = input.holders.map((h, i) => cleanPerson(h, `Friend ${i + 1}`));
    if (holders.some((h) => h.email === owner.email))
        throw new WatchError('A friend cannot have your own address.', 400);
    const c = (input.config ?? {});
    const config = { cadenceDays: Number(c.cadenceDays), graceDays: Number(c.graceDays), reminders: Number(c.reminders) };
    const problems = validateWatch(config);
    if (problems.length)
        throw new WatchError(problems[0], 400);
    const ownerKey = hash(owner.email);
    let existing = 0;
    for (const id of await deps.store.ids()) {
        if ((await deps.store.get(id))?.ownerKey === ownerKey)
            existing++;
    }
    if (existing >= MAX_WATCHES_PER_OWNER)
        throw new WatchError('This address already has as many watches as it may.', 429);
    const id = toBase64Url(rand(deps, 12));
    const manage = newToken(deps, id);
    const checkin = newToken(deps, id);
    const record = {
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
    await deps.mailer.send({
        to: owner.email,
        subject: 'Please confirm your watch',
        text: `Hi ${owner.name.split(/\s+/)[0]},\n\n` +
            `Someone (hopefully you) asked Phylactery to keep watch over you. Nothing will happen until you confirm:\n\n` +
            `${link(deps, 'confirm', checkin.token)}\n\n` +
            `After that, about every ${config.cadenceDays} day${config.cadenceDays > 1 ? 's' : ''} we will send a link like the one above. One tap says you are still here.\n\n` +
            `Keep this email. This link is the only way to pause, change or delete the watch:\n${link(deps, 'manage', manage.token)}\n\n` +
            `If this wasn't you, ignore this email and nothing more will be sent.\n`,
    });
    return { id };
}
/** Load a watch by token. A check-in also accepts the owner's manage link. */
async function load(deps, token, kind) {
    const { id, secret } = splitToken(token);
    const record = await deps.store.get(id);
    const h = hash(secret);
    const ok = record && (sameHash(h, record.manageHash) || (kind === 'checkin' && sameHash(h, record.checkinHash)));
    if (!record || !ok)
        throw new WatchError('That link has expired or was never valid.', 404);
    return record;
}
const daysSince = (record, now) => (record.confirmedAt === null ? 0 : (now - record.confirmedAt) / DAY);
function view(deps, record) {
    const now = deps.now();
    const days = daysSince(record, now);
    const run = runWatch(record.config, record.actions, days);
    const confirmed = record.confirmedAt !== null;
    const lastSignAt = confirmed ? record.confirmedAt + run.lastSign * DAY : null;
    const nextAsk = confirmed && run.status === 'well' ? lastSignAt + record.config.cadenceDays * DAY : null;
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
function keptSummary(kept) {
    if (!kept)
        return null;
    const j = parseJar(kept.json);
    return { owner: j.owner, revision: j.revision ?? 1, sealedAt: j.sealedAt, keptAt: new Date(kept.keptAt).toISOString() };
}
/** The owner gives the watch their newest jar, or takes it back (jar: null). */
export async function keepJar(deps, token, jar) {
    const record = await load(deps, token, 'manage');
    if (jar === null || jar === undefined)
        delete record.jar;
    else
        record.jar = cleanJar(jar, deps.now());
    await deps.store.put(record);
    return view(deps, record);
}
/** A friend's link from the "please check on" email opens the kept jar. */
export async function fetchJar(deps, token) {
    const { id, secret } = splitToken(token);
    const record = await deps.store.get(id);
    const holder = record?.holders.find((h) => !h.removed && h.jarHash && sameHash(hash(secret), h.jarHash));
    if (!record || !holder)
        throw new WatchError('That link has expired or was never valid.', 404);
    if (!record.jar)
        throw new WatchError('No jar is kept with this watch any more. Use the jar file you were given.', 404);
    return { jar: record.jar.json };
}
/**
 * The owner's confirmation link doubles as their check-in link. On first
 * confirmation each friend hears, once, that they were named: an email that
 * arrives years later from a stranger would look like a scam.
 */
export async function confirm(deps, token) {
    const record = await load(deps, token, 'checkin');
    if (record.confirmedAt === null) {
        record.confirmedAt = deps.now();
        const optouts = await rotateOptouts(deps, record);
        const owner = record.owner.name;
        const first = owner.split(/\s+/)[0];
        for (const [i, h] of record.holders.entries()) {
            if (h.removed)
                continue;
            await deps.mailer.send({
                to: h.email,
                subject: `${owner} named you in their Phylactery`,
                text: `Dear ${h.name.split(/\s+/)[0]},\n\n` +
                    `${owner} set up Phylactery, a gentle check-in: now and then we ask ${first} "still here?", and ${first} taps a link. ` +
                    `${first} named you as someone we should write to if they ever stop answering for a long time.\n\n` +
                    `There is nothing for you to do now. If we ever write again, it will be from this address, with the subject "Please check on ${owner}".\n\n` +
                    `${first} may also give you a card: a printed page titled "${owner}'s jar" with 30 numbered words. Keep it safe, like a house key.\n\n` +
                    `— Phylactery\n\n` +
                    `Would rather not be part of this? ${link(deps, 'optout', optouts[i])}\n`,
            });
        }
        await deps.store.put(record);
    }
    return view(deps, record);
}
export async function checkin(deps, token) {
    const record = await load(deps, token, 'checkin');
    if (record.confirmedAt === null)
        return confirm(deps, token);
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
                text: `Dear ${h.name.split(/\s+/)[0]},\n\n` +
                    `Good news: ${record.owner.name} just answered us. All is well, and there is nothing more to do. Thank you for caring.\n\n` +
                    `— Phylactery\n`,
            });
        }
    }
    return view(deps, record);
}
export async function status(deps, token) {
    return view(deps, await load(deps, token, 'manage'));
}
export async function setPaused(deps, token, paused) {
    const record = await load(deps, token, 'manage');
    if (record.confirmedAt === null)
        throw new WatchError('Confirm the watch first, from the email we sent.', 409);
    record.actions.push({ at: daysSince(record, deps.now()), type: paused ? 'pause' : 'resume' });
    await deps.store.put(record);
    return view(deps, record);
}
export async function remove(deps, token) {
    const record = await load(deps, token, 'manage');
    await deps.store.delete(record.id);
}
export async function optOut(deps, token) {
    const { id, secret } = splitToken(token);
    const record = await deps.store.get(id);
    const holder = record?.holders.find((h) => h.optoutHash && sameHash(hash(secret), h.optoutHash));
    if (!record || !holder)
        throw new WatchError('That link has expired or was never valid.', 404);
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
function reviewDue(record, now, status) {
    if (record.confirmedAt === null || status === 'paused' || status === 'notified')
        return null;
    const year = new Date(now).getUTCFullYear();
    const dayOfTheDead = Date.UTC(year, 10, 2);
    const key = `review:${year}`;
    if (now < dayOfTheDead || record.sent.includes(key) || record.confirmedAt > dayOfTheDead - 30 * DAY)
        return null;
    return key;
}
export async function tick(deps) {
    let sent = 0;
    const now = deps.now();
    for (const id of await deps.store.ids()) {
        const record = await deps.store.get(id);
        if (!record || record.confirmedAt === null)
            continue;
        const run = runWatch(record.config, record.actions, daysSince(record, now));
        const due = run.events.filter((e) => (e.kind === 'due' || e.kind === 'reminder' || e.kind === 'notify') && !record.sent.includes(`${e.kind}:${e.at.toFixed(5)}`));
        const review = reviewDue(record, now, run.status);
        if (!due.length && !review)
            continue;
        const first = record.owner.name.split(/\s+/)[0];
        if (review) {
            await deps.mailer.send({
                to: record.owner.email,
                subject: `${first}, a yearly look at your jar`,
                text: `Today is the Day of the Dead. Once a year, on this day, we suggest a look at what you left in your jar.\n\n` +
                    `Passwords change, accounts close, people move. If something in your jar is out of date, change it with your key at ` +
                    `${deps.baseUrl.replace(/\/?$/, '/')}#/seal?update. Your friends keep their cards; send them the new jar file` +
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
        if (record.silence?.since !== run.lastSign)
            record.silence = { since: run.lastSign, asked: 0, lastAt: 0 };
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
        for (const e of toSend) {
            if (e.kind !== 'notify') {
                silence.asked++;
                silence.lastAt = now;
            }
            if (e.kind === 'due') {
                await deps.mailer.send({
                    to: record.owner.email,
                    subject: `${first}, still here?`,
                    text: `Just checking in. One tap lets us know you are well:\n\n${link(deps, 'here', checkinToken)}\n\n` +
                        `Going away for a while? Pause the watch from the manage link in your first email.\n`,
                });
            }
            else if (e.kind === 'reminder') {
                const m = ownerReminder(first, e.n ?? 1, record.config.reminders);
                await deps.mailer.send({ to: record.owner.email, subject: m.subject, text: `${m.body}\n\n${link(deps, 'here', checkinToken)}\n` });
            }
            else {
                const optouts = await rotateOptouts(deps, record);
                const jarLinks = await rotateJarLinks(deps, record);
                for (const [i, h] of record.holders.entries()) {
                    if (h.removed)
                        continue;
                    const m = holderMessage(record.owner.name, h.name, { days: (now - record.confirmedAt) / DAY - run.lastSign, asked: silence.asked });
                    await deps.mailer.send({
                        to: h.email,
                        subject: m.subject,
                        text: `${m.body}\n${whatToDo(deps, record, h, jarLinks[i])}\n\n` +
                            `— Phylactery, the check-in ${first} set up\n\n` +
                            `Would rather not be asked again? ${link(deps, 'optout', optouts[i])}\n`,
                    });
                }
                await deps.mailer.send({
                    to: record.owner.email,
                    subject: 'We asked your friends to check on you',
                    text: `We have not heard from you, so we asked ${list(record.holders.filter((h) => !h.removed).map((h) => h.name))} to look in on you.\n\nIf you are fine, tap here and we will tell them:\n${link(deps, 'here', checkinToken)}\n`,
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
async function rotateCheckin(deps, record) {
    const t = newToken(deps, record.id);
    record.checkinHash = t.hash;
    await deps.store.put(record);
    return t.token;
}
/**
 * The part of the email that tells a friend who else was asked and how the
 * circle opens the jar, if it ever comes to that.
 */
function whatToDo(deps, record, holder, jarToken) {
    const first = record.owner.name.split(/\s+/)[0];
    const others = record.holders.filter((h) => !h.removed && h !== holder).map((h) => h.name);
    const asked = others.length ? `We wrote to ${list(others)} too.\n\n` : '';
    const base = deps.baseUrl.replace(/\/?$/, '/');
    const kept = record.jar ? parseJar(record.jar.json) : null;
    const who = kept ? `Any ${kept.threshold} of ${list(kept.holders.map((h) => h.name))} can open it together.` : 'Enough of you together can open it.';
    const how = kept
        ? `${first} left a locked copy with us. When you are ready, this link opens it for you; the others get their own:\n${base}#/seance?jar=${encodeURIComponent(jarToken)}`
        : `Open the jar file ${first} gave you (or ${base}#/seance), and each offer your card.`;
    return (asked +
        `If you learn that ${first} has passed away: ${first} left words for the people close to them in a locked jar, and you hold one of its cards (a printed page titled "${record.owner.name}'s jar" with 30 numbered words). ${who} ${how}\n\n` +
        `Until then, keep your card safe.`);
}
const list = (names) => (names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : (names[0] ?? ''));
/** Each friend gets their own link to the kept jar; earlier ones stop working. */
async function rotateJarLinks(deps, record) {
    const tokens = record.holders.map((h) => {
        const t = newToken(deps, record.id);
        h.jarHash = t.hash;
        return t.token;
    });
    await deps.store.put(record);
    return tokens;
}
async function rotateOptouts(deps, record) {
    const tokens = record.holders.map((h) => {
        const t = newToken(deps, record.id);
        h.optoutHash = t.hash;
        return t.token;
    });
    await deps.store.put(record);
    return tokens;
}
