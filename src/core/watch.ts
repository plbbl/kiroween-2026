// The watch: a schedule of gentle questions. The owner is asked to check in
// every `cadenceDays`. If they don't, they are reminded `reminders` times
// during the grace period. Only when the grace period ends are the holders
// asked to check on them. Any action by the owner resets the schedule.
//
// Time is measured in days from the moment the jar was sealed. This module
// only computes the schedule; it never sends anything.

export interface WatchConfig {
  cadenceDays: number;
  graceDays: number;
  reminders: number;
}

export type OwnerAction = { at: number; type: 'checkin' | 'pause' | 'resume' };

export type WatchEventKind = 'due' | 'reminder' | 'notify' | OwnerAction['type'];

export interface WatchEvent {
  at: number;
  kind: WatchEventKind;
  /** Reminder number, starting at 1. */
  n?: number;
}

export type WatchStatus = 'well' | 'due' | 'reminding' | 'notified' | 'paused';

export interface WatchRun {
  events: WatchEvent[];
  status: WatchStatus;
  lastSign: number;
}

export const DEFAULT_WATCH: WatchConfig = { cadenceDays: 7, graceDays: 7, reminders: 3 };

export function validateWatch(c: WatchConfig): string[] {
  const p: string[] = [];
  if (!(c.cadenceDays >= 1 && c.cadenceDays <= 90)) p.push('Check-ins must be between 1 and 90 days apart.');
  if (!(c.graceDays >= 1 && c.graceDays <= 30)) p.push('The grace period must be between 1 and 30 days.');
  if (!(Number.isInteger(c.reminders) && c.reminders >= 1 && c.reminders <= 10)) {
    p.push('Send between 1 and 10 reminders.');
  }
  return p;
}

function scheduleFrom(c: WatchConfig, from: number): WatchEvent[] {
  const due = from + c.cadenceDays;
  const out: WatchEvent[] = [{ at: due, kind: 'due' }];
  for (let n = 1; n <= c.reminders; n++) {
    out.push({ at: due + (c.graceDays * n) / (c.reminders + 1), kind: 'reminder', n });
  }
  out.push({ at: due + c.graceDays, kind: 'notify' });
  return out;
}

export function runWatch(c: WatchConfig, actions: OwnerAction[], until: number): WatchRun {
  const sorted = [...actions].filter((a) => a.at >= 0 && a.at <= until).sort((a, b) => a.at - b.at);
  const events: WatchEvent[] = [];
  let pending = scheduleFrom(c, 0);
  let paused = false;
  let lastSign = 0;

  const flush = (before: number, inclusive: boolean) => {
    while (pending.length && (inclusive ? pending[0]!.at <= before : pending[0]!.at < before)) {
      events.push(pending.shift()!);
    }
  };

  for (const a of sorted) {
    if (!paused) flush(a.at, false);
    events.push({ at: a.at, kind: a.type });
    lastSign = a.at;
    if (a.type === 'pause') {
      paused = true;
      pending = [];
    } else {
      paused = false;
      pending = scheduleFrom(c, a.at);
    }
  }
  if (!paused) flush(until, true);

  return { events, status: statusOf(events, paused), lastSign };
}

function statusOf(events: WatchEvent[], paused: boolean): WatchStatus {
  if (paused) return 'paused';
  const last = events[events.length - 1];
  if (!last) return 'well';
  switch (last.kind) {
    case 'notify':
      return 'notified';
    case 'reminder':
      return 'reminding';
    case 'due':
      return 'due';
    default:
      return 'well';
  }
}

const firstOf = (name: string) => name.trim().split(/\s+/)[0] ?? name;

/**
 * The words holders receive. It asks them to look in on someone, with how
 * long the silence has been; it never says anyone has died.
 */
export function holderMessage(owner: string, holder: string, silence?: { days: number; asked: number }): { subject: string; body: string } {
  const first = firstOf(owner);
  const quiet = silence
    ? `We have not heard from ${first} for ${Math.round(silence.days)} days, and ${silence.asked === 1 ? 'our message' : `${silence.asked} messages from us`} went unanswered.`
    : `We have not heard from ${first} for a while, and our messages went unanswered.`;
  return {
    subject: `Please check on ${owner}`,
    body:
      `Dear ${firstOf(holder)},\n\n` +
      `${owner} asked us to check in with them now and then, and to write to you if they went quiet. ${quiet}\n\n` +
      `Please try to reach ${first}, or someone close to them. There may be a simple reason: a trip, a lost phone, a busy week.\n`,
  };
}

export function ownerReminder(owner: string, n: number, of: number): { subject: string; body: string } {
  return {
    subject: n === of ? `${owner}, are you still here?` : `${owner}, a small sign, please`,
    body:
      `One tap below lets us know you are well. ` +
      (n === of
        ? `If we don't hear from you, the friends on your watch will be asked to check on you.`
        : `This is reminder ${n} of ${of}.`),
  };
}
