import { describe, expect, it } from 'vitest';
import { MemoryStore, OutboxMailer } from './adapters.ts';
import { handle } from './http.ts';
import { emptyContent, parseJar, sealJar } from '../core/jar.ts';
import { DAY, type Deps } from './service.ts';

function setup(start = Date.UTC(2026, 10, 1, 9)) {
  let now = start;
  const mailer = new OutboxMailer();
  const deps: Deps = { store: new MemoryStore(), mailer, now: () => now, baseUrl: 'https://phylactery.test/' };
  const call = async (path: string, body?: unknown, headers: Record<string, string> = {}) => {
    const res = await handle(
      new Request(`https://phylactery.test${path}`, { method: body === undefined ? 'GET' : 'POST', body: body === undefined ? undefined : JSON.stringify(body), headers }),
      deps,
      'tick-secret',
    );
    return { status: res.status, body: (await res.json()) as Record<string, unknown> };
  };
  const tick = () => call('/api/watch/tick', {}, { 'x-tick-secret': 'tick-secret' });
  const advance = (days: number) => {
    now += days * DAY;
  };
  const linkIn = (mailIndex: number, action: string) => {
    const m = new RegExp(`#/watch\\?${action}=([^\\s]+)`).exec(mailer.sent[mailIndex]!.text);
    return m ? decodeURIComponent(m[1]!) : null;
  };
  return { deps, mailer, call, tick, advance, linkIn, now: () => now };
}

const start = {
  owner: { name: 'June Alder', email: 'june@example.com' },
  holders: [
    { name: 'Clara Alder', email: 'clara@example.com' },
    { name: 'Ben Okafor', email: 'ben@example.com' },
  ],
  config: { cadenceDays: 7, graceDays: 4, reminders: 3 },
};

async function askFriends(t: ReturnType<typeof setup>, body: unknown) {
  await t.call('/api/watch', body);
  await t.call('/api/watch/confirm', { token: t.linkIn(0, 'confirm')! });
  t.advance(12);
  await t.tick();
  return t.mailer.sent.filter((m) => m.subject === 'Please check on June Alder');
}

describe('watch service: friends know what to do', () => {
  it('without a kept jar, each friend hears who else was asked and how the circle opens the jar file', async () => {
    const t = setup();
    const toFriends = await askFriends(t, start);
    const clara = toFriends.find((m) => m.to === 'clara@example.com')!;
    expect(clara.text).toMatch(/We wrote to Ben Okafor too/);
    expect(clara.text).toMatch(/#\/seance/);
    expect(clara.text).not.toMatch(/\?jar=/);
  });

  it('with a kept jar, each friend gets their own link that opens exactly that jar', async () => {
    const t = setup();
    const { jar } = await sealJar({
      owner: 'June Alder',
      content: emptyContent(),
      threshold: 2,
      holders: [
        { name: 'Clara Alder', letter: '' },
        { name: 'Ben Okafor', letter: '' },
      ],
    });
    const toFriends = await askFriends(t, { ...start, jar: JSON.stringify(jar) });
    expect(toFriends).toHaveLength(2);
    const tokens = toFriends.map((m) => decodeURIComponent(/#\/seance\?jar=([^\s]+)/.exec(m.text)![1]!));
    expect(new Set(tokens).size).toBe(2);
    expect(toFriends[0]!.text).toMatch(/Any 2 of Clara Alder and Ben Okafor/);
    for (const token of tokens) {
      const res = await t.call('/api/watch/jar/open', { token });
      expect(res.status).toBe(200);
      expect(parseJar(res.body.jar as string)).toEqual(jar);
    }
    expect((await t.call('/api/watch/jar/open', { token: `${tokens[0]!.split('.')[0]}.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA` })).status).toBe(404);
    // The owner's own manage link is not a friend's jar link.
    expect((await t.call('/api/watch/jar/open', { token: t.linkIn(0, 'manage')! })).status).toBe(404);
  });

  it('the owner replaces or removes the kept jar; only real jars are kept', async () => {
    const t = setup();
    await t.call('/api/watch', start);
    const manage = t.linkIn(0, 'manage')!;
    const first = await sealJar({ owner: 'June Alder', content: emptyContent(), threshold: 2, holders: [{ name: 'A', letter: '' }, { name: 'B', letter: '' }] });
    const kept = await t.call('/api/watch/jar', { token: manage, jar: JSON.stringify(first.jar) });
    expect(kept.status).toBe(200);
    expect((kept.body.jar as { revision: number }).revision).toBe(1);
    expect((await t.call('/api/watch/jar', { token: manage, jar: '{"not":"a jar"}' })).status).toBe(400);
    expect((await t.call('/api/watch/jar', { token: manage, jar: 'x'.repeat(300_000) })).status).toBe(413);
    expect((await t.call('/api/watch/jar', { token: manage, jar: null })).body.jar).toBeNull();
    // Friends are asked; with no jar kept, their email points to the jar file instead.
    await t.call('/api/watch/confirm', { token: t.linkIn(0, 'confirm')! });
    t.advance(12);
    await t.tick();
    const toClara = t.mailer.sent.find((m) => m.to === 'clara@example.com')!;
    expect(toClara.text).not.toMatch(/\?jar=/);
  });
});

describe('watch service', () => {
  it('once a year, on the Day of the Dead, asks the owner to look at their jar', async () => {
    const t = setup(Date.UTC(2026, 8, 1, 9));
    await t.call('/api/watch', start);
    const manage = t.linkIn(0, 'manage')!;
    await t.call('/api/watch/confirm', { token: t.linkIn(0, 'confirm')! });
    const reviews = () => t.mailer.sent.filter((m) => /a yearly look at your jar/.test(m.subject));
    // The owner answers every few days, until the day after the Day of the Dead.
    while (t.now() < Date.UTC(2026, 10, 3, 12)) {
      t.advance(3);
      await t.call('/api/watch/checkin', { token: manage });
      await t.tick();
    }
    expect(reviews()).toHaveLength(1);
    expect(reviews()[0]!.to).toBe('june@example.com');
    expect(reviews()[0]!.text).toMatch(/#\/seal/);
    // Once a year, not once a tick.
    while (t.now() < Date.UTC(2027, 10, 1)) {
      t.advance(3);
      await t.call('/api/watch/checkin', { token: manage });
      await t.tick();
    }
    expect(reviews()).toHaveLength(1);
    t.advance(3);
    await t.tick();
    expect(reviews()).toHaveLength(2);
  });

  it('sends no yearly review in a watch’s first month, or while friends are being asked', async () => {
    const t = setup(Date.UTC(2026, 9, 20, 9));
    await t.call('/api/watch', start);
    const manage = t.linkIn(0, 'manage')!;
    await t.call('/api/watch/confirm', { token: t.linkIn(0, 'confirm')! });
    // Confirmed on October 20, answering on time: still too new on November 2.
    for (let i = 0; i < 5; i++) {
      t.advance(3);
      await t.call('/api/watch/checkin', { token: manage });
      await t.tick();
    }
    expect(t.mailer.sent.some((m) => m.subject === 'Please check on June Alder')).toBe(false);
    expect(t.mailer.sent.some((m) => /yearly/.test(m.subject))).toBe(false);
    // A year on, the owner has gone quiet and friends were asked: no review.
    t.advance(365);
    await t.tick();
    expect(t.mailer.sent.some((m) => m.subject === 'Please check on June Alder')).toBe(true);
    expect(t.mailer.sent.some((m) => /yearly/.test(m.subject))).toBe(false);
  });

  it('does nothing until the owner confirms', async () => {
    const t = setup();
    expect((await t.call('/api/watch', start)).status).toBe(201);
    expect(t.mailer.sent).toHaveLength(1);
    expect(t.mailer.sent[0]!.to).toBe('june@example.com');
    t.advance(60);
    await t.tick();
    expect(t.mailer.sent).toHaveLength(1);
  });

  it('reminds the owner, then asks friends, then tells them all is well', async () => {
    const t = setup();
    await t.call('/api/watch', start);
    const confirmToken = t.linkIn(0, 'confirm')!;
    expect((await t.call('/api/watch/confirm', { token: confirmToken })).body.confirmed).toBe(true);

    t.advance(7.5);
    await t.tick();
    const reminder = t.mailer.sent.at(-1)!;
    expect(reminder.to).toBe('june@example.com');
    expect(reminder.subject).toMatch(/June/);

    // Silent through the whole grace period: friends are asked, owner is told.
    t.advance(4);
    await t.tick();
    const toFriends = t.mailer.sent.filter((m) => m.subject === 'Please check on June Alder');
    expect(toFriends.map((m) => m.to).sort()).toEqual(['ben@example.com', 'clara@example.com']);
    expect(toFriends.every((m) => !/died|dead|death/i.test(m.text))).toBe(true);
    const ownerNotice = t.mailer.sent.find((m) => m.subject === 'We asked your friends to check on you')!;

    // Ticking again sends nothing new.
    const count = t.mailer.sent.length;
    await t.tick();
    expect(t.mailer.sent).toHaveLength(count);

    // The owner knocks: friends hear that all is well.
    const here = /#\/watch\?here=([^\s]+)/.exec(ownerNotice.text)![1]!;
    const res = await t.call('/api/watch/checkin', { token: decodeURIComponent(here) });
    expect(res.body.status).toBe('well');
    expect(t.mailer.sent.filter((m) => m.subject === 'June Alder is okay')).toHaveLength(2);
  });

  it('never asks friends if the owner keeps checking in', async () => {
    const t = setup();
    await t.call('/api/watch', start);
    const token = t.linkIn(0, 'confirm')!;
    await t.call('/api/watch/confirm', { token });
    const manage = t.linkIn(0, 'manage')!;
    for (let week = 0; week < 20; week++) {
      t.advance(6.5);
      await t.call('/api/watch/checkin', { token: manage });
      await t.tick();
    }
    expect(t.mailer.sent.filter((m) => m.subject.startsWith('Please check on'))).toHaveLength(0);
  });

  it('a paused watch stays quiet', async () => {
    const t = setup();
    await t.call('/api/watch', start);
    await t.call('/api/watch/confirm', { token: t.linkIn(0, 'confirm') });
    const manage = t.linkIn(0, 'manage')!;
    expect((await t.call('/api/watch/pause', { token: manage })).body.status).toBe('paused');
    t.advance(90);
    await t.tick();
    expect(t.mailer.sent).toHaveLength(1);
  });

  it('a friend can leave a watch', async () => {
    const t = setup();
    await t.call('/api/watch', start);
    await t.call('/api/watch/confirm', { token: t.linkIn(0, 'confirm') });
    t.advance(12);
    await t.tick();
    const toBen = t.mailer.sent.find((m) => m.to === 'ben@example.com')!;
    const optout = decodeURIComponent(/#\/watch\?optout=([^\s]+)/.exec(toBen.text)![1]!);
    expect((await t.call('/api/watch/optout', { token: optout })).body.owner).toBe('June Alder');
    const status = await t.call('/api/watch/status', { token: t.linkIn(0, 'manage') });
    expect(status.body.holders).toEqual(['Clara Alder']);
  });

  it('refuses bad input, bad tokens and a missing tick secret', async () => {
    const t = setup();
    expect((await t.call('/api/watch', { ...start, owner: { name: 'J', email: 'nope' } })).status).toBe(400);
    expect((await t.call('/api/watch', { ...start, holders: [] })).status).toBe(400);
    expect((await t.call('/api/watch', { ...start, config: { cadenceDays: 0, graceDays: 4, reminders: 3 } })).status).toBe(400);
    expect((await t.call('/api/watch/status', { token: 'AAAAAAAAAAAAAAAA.BBBBBBBBBBBBBBBBBBBBBBBB' })).status).toBe(404);
    expect((await t.call('/api/watch/status', { token: 'not a token' })).status).toBe(400);
    expect((await t.call('/api/watch/tick', {})).status).toBe(403);
    expect((await t.call('/api/health')).body.ok).toBe(true);
  });

  it('limits how many watches one address can start', async () => {
    const t = setup();
    for (let i = 0; i < 3; i++) expect((await t.call('/api/watch', start)).status).toBe(201);
    expect((await t.call('/api/watch', start)).status).toBe(429);
  });

  it('the owner can delete everything', async () => {
    const t = setup();
    await t.call('/api/watch', start);
    const manage = t.linkIn(0, 'manage')!;
    expect((await t.call('/api/watch/delete', { token: manage })).status).toBe(200);
    expect((await t.call('/api/watch/status', { token: manage })).status).toBe(404);
    expect(await t.deps.store.ids()).toEqual([]);
  });
});
