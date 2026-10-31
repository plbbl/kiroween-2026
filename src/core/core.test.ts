import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { fromBase32, fromBase64Url, toBase32, toBase64Url } from './bytes.ts';
import {
  cardToQrText,
  cardToWords,
  KEY_WORDS,
  parseCard,
  SEAL_WORDS,
  SHARD_WORDS,
  shardX,
  type Card,
  type KeyCard,
  type Seal,
  type Shard,
} from './cards.ts';
import {
  checkShard,
  emptyContent,
  openJar,
  openLetter,
  openWithKey,
  parseJar,
  resealJar,
  sealJar,
  unlockWithShares,
  verifyCircle,
  type JarContent,
  type SealInput,
} from './jar.ts';
import { circleBuddies, circleCostumes, COSTUMES, EMBLEMS } from './buddy.ts';
import { holderMessage, runWatch, type OwnerAction, type WatchConfig } from './watch.ts';
import { bytesToWords, wordsToBytes } from './words.ts';

const bytes = (min: number, max: number) => fc.uint8Array({ minLength: min, maxLength: max });

describe('encodings', () => {
  it('base32 and base64url round-trip any bytes', () => {
    fc.assert(
      fc.property(bytes(0, 80), (b) => {
        expect(fromBase32(toBase32(b))).toEqual(b);
        expect(fromBase64Url(toBase64Url(b))).toEqual(b);
      }),
    );
  });

  it('words round-trip any bytes', () => {
    fc.assert(
      fc.property(bytes(1, 64), (b) => {
        expect(wordsToBytes(bytesToWords(b), b.length)).toEqual(b);
      }),
    );
  });

  it('changing one word is either rejected or never silently returns the original', () => {
    fc.assert(
      fc.property(bytes(16, 40), fc.nat(), fc.nat(2047), (b, pos, replacement) => {
        const words = bytesToWords(b);
        const i = pos % words.length;
        const wordlistWord = bytesToWords(Uint8Array.of(replacement >> 3, (replacement & 7) << 5))[0]!;
        if (wordlistWord === words[i]) return;
        words[i] = wordlistWord;
        let decoded: Uint8Array;
        try {
          decoded = wordsToBytes(words, b.length);
        } catch {
          return;
        }
        expect(decoded).not.toEqual(b);
      }),
    );
  });

  it('catches nearly every single-word typo', () => {
    let caught = 0;
    const trials = 2000;
    for (let t = 0; t < trials; t++) {
      const b = crypto.getRandomValues(new Uint8Array(40));
      const words = bytesToWords(b);
      const i = t % words.length;
      words[i] = words[(i + 1) % words.length] === words[i] ? 'zoo' : words[(i + 1) % words.length]!;
      try {
        wordsToBytes(words, b.length);
      } catch {
        caught++;
      }
    }
    expect(caught / trials).toBeGreaterThan(0.98);
  });
});

const shardArb: fc.Arbitrary<Shard> = fc
  .record({
    jarId: bytes(4, 4),
    total: fc.integer({ min: 2, max: 10 }),
    share: bytes(32, 32),
    x: fc.integer({ min: 1, max: 255 }),
  })
  .chain((r) =>
    fc.integer({ min: 2, max: r.total }).map((threshold) => ({
      kind: 'shard' as const,
      jarId: r.jarId,
      threshold,
      total: r.total,
      share: Uint8Array.from([...r.share, r.x]),
    })),
  );

const sealArb: fc.Arbitrary<Seal> = fc.record({
  kind: fc.constant('seal' as const),
  jarId: bytes(4, 4),
  x: fc.integer({ min: 1, max: 255 }),
  secret: bytes(16, 16),
});

const keyArb: fc.Arbitrary<KeyCard> = fc.record({
  kind: fc.constant('key' as const),
  jarId: bytes(4, 4),
  seed: bytes(32, 32),
});

describe('cards', () => {
  it('a card read from its QR code or its words is the same card', () => {
    fc.assert(
      fc.property(fc.oneof(shardArb, sealArb, keyArb), (card: Card) => {
        expect(parseCard(cardToQrText(card))).toEqual(card);
        expect(parseCard(cardToWords(card).join(' '))).toEqual(card);
      }),
    );
  });

  it('shards have the documented number of words', () => {
    fc.assert(
      fc.property(shardArb, (s) => {
        expect(cardToWords(s)).toHaveLength(SHARD_WORDS);
      }),
    );
    fc.assert(
      fc.property(sealArb, (s) => {
        expect(cardToWords(s)).toHaveLength(SEAL_WORDS);
      }),
    );
    fc.assert(
      fc.property(keyArb, (k) => {
        expect(cardToWords(k)).toHaveLength(KEY_WORDS);
      }),
    );
    expect(new Set([SHARD_WORDS, SEAL_WORDS, KEY_WORDS]).size).toBe(3);
  });

  it('accepts sloppy typing: case, numbering, commas, line breaks', () => {
    fc.assert(
      fc.property(shardArb, (s) => {
        const sloppy = cardToWords(s)
          .map((w, i) => `${i + 1}. ${w.toUpperCase()},`)
          .join('\n  ');
        expect(parseCard(sloppy)).toEqual(s);
      }),
    );
  });

  it('rejects a damaged QR code', () => {
    fc.assert(
      fc.property(shardArb, fc.nat(), (s, pos) => {
        const text = cardToQrText(s);
        const i = 4 + (pos % (text.length - 4));
        const swapped = text[i] === 'A' ? 'B' : 'A';
        const damaged = text.slice(0, i) + swapped + text.slice(i + 1);
        expect(() => parseCard(damaged)).toThrow();
      }),
    );
  });

  it('a buddy’s costume follows only the jar and the person’s place in the circle, so it is known before the cards exist', () => {
    fc.assert(
      fc.property(bytes(4, 4), fc.uniqueArray(fc.integer({ min: 1, max: 255 }), { minLength: 2, maxLength: 10 }), (jarId, xs) => {
        const ahead = circleCostumes(jarId);
        const buddies = circleBuddies(jarId, xs);
        xs.forEach((x, i) => expect(buddies.get(x)!.costume).toBe(ahead[i % ahead.length]));
      }),
    );
  });

  it('buddies in one circle wear different costumes and carry different emblems', () => {
    fc.assert(
      fc.property(bytes(4, 4), fc.uniqueArray(fc.integer({ min: 1, max: 255 }), { minLength: 2, maxLength: 10 }), (jarId, xs) => {
        const buddies = [...circleBuddies(jarId, xs).values()];
        const costumes = new Set(buddies.map((b) => b.costume));
        const emblems = new Set(buddies.map((b) => b.emblem));
        expect(costumes.size).toBe(Math.min(xs.length, COSTUMES.length));
        expect(emblems.size).toBe(Math.min(xs.length, EMBLEMS.length));
      }),
    );
  });
});

const contentArb: fc.Arbitrary<JarContent> = fc.record({
  message: fc.string({ maxLength: 200 }),
  accounts: fc.array(
    fc.record({
      service: fc.string({ maxLength: 20 }),
      login: fc.string({ maxLength: 20 }),
      wish: fc.constantFrom('close', 'memorialize', 'keep', 'hand-over'),
      note: fc.string({ maxLength: 40 }),
    }),
    { maxLength: 3 },
  ),
  documents: fc.array(fc.record({ item: fc.string({ maxLength: 20 }), location: fc.string({ maxLength: 40 }) }), {
    maxLength: 3,
  }),
  wishes: fc.record({
    farewell: fc.string({ maxLength: 40 }),
    body: fc.string({ maxLength: 40 }),
    dependents: fc.string({ maxLength: 40 }),
    other: fc.string({ maxLength: 40 }),
  }),
});

const sealInputArb: fc.Arbitrary<SealInput> = fc
  .integer({ min: 2, max: 6 })
  .chain((total) =>
    fc.record({
      owner: fc.constantFrom('Ada', 'June Alder', 'Wen Li'),
      content: contentArb,
      threshold: fc.integer({ min: 2, max: total }),
      holders: fc.tuple(
        ...Array.from({ length: total }, (_, i) =>
          fc.record({ name: fc.constant(`Holder ${i + 1}`), letter: fc.oneof(fc.constant(''), fc.string({ minLength: 1, maxLength: 80 }).map((s) => `x${s}`)) }),
        ),
      ),
    }),
  );

describe('jar', () => {
  it('any circle of at least the threshold opens the jar and recovers the content', async () => {
    await fc.assert(
      fc.asyncProperty(sealInputArb, fc.nat(), async (input, pick) => {
        const { jar, cards } = await sealJar(input);
        const size = jar.threshold + (pick % (jar.total - jar.threshold + 1));
        const start = pick % cards.length;
        const circle = Array.from({ length: size }, (_, i) => cards[(start + i) % cards.length]!.shard);
        const opened = await openJar(jar, circle);
        expect(opened.content).toEqual(input.content);
      }),
      { numRuns: 40 },
    );
  });

  it('one card short of the threshold reveals nothing', async () => {
    await fc.assert(
      fc.asyncProperty(sealInputArb, fc.nat(), async (input, pick) => {
        const { jar, cards } = await sealJar(input);
        const start = pick % cards.length;
        const short = Array.from({ length: jar.threshold - 1 }, (_, i) => cards[(start + i) % cards.length]!.shard.share);
        await expect(unlockWithShares(jar, short)).rejects.toThrow();
        await expect(openJar(jar, cards.slice(0, jar.threshold - 1).map((c) => c.shard))).rejects.toThrow();
      }),
      { numRuns: 40 },
    );
  });

  it('each letter opens only with its own seal', async () => {
    await fc.assert(
      fc.asyncProperty(sealInputArb, async (input) => {
        const { jar, cards } = await sealJar(input);
        const opened = await openJar(jar, cards.slice(0, jar.threshold).map((c) => c.shard));
        for (const c of cards) {
          if (!c.hasLetter) {
            await expect(openLetter(jar, opened, c.seal)).rejects.toThrow();
            continue;
          }
          const letter = await openLetter(jar, opened, c.seal);
          expect(letter.text).toBe(input.holders.find((h) => h.name === c.name)!.letter.trim());
          for (const other of cards) {
            if (other.x === c.x) continue;
            // Someone else's seal, relabelled to point at this letter.
            const forged: Seal = { ...other.seal, x: c.x };
            await expect(openLetter(jar, opened, forged)).rejects.toThrow();
          }
        }
      }),
      { numRuns: 25 },
    );
  });

  it('editing any part of the readable header breaks the jar', async () => {
    await fc.assert(
      fc.asyncProperty(sealInputArb, fc.constantFrom('owner', 'sealedAt', 'holderName'), async (input, field) => {
        const { jar, cards } = await sealJar(input);
        const tampered = structuredClone(jar);
        if (field === 'owner') tampered.owner += ' ';
        if (field === 'sealedAt') tampered.sealedAt = new Date(0).toISOString();
        if (field === 'holderName') tampered.holders[0]!.name += '!';
        await expect(openJar(tampered, cards.slice(0, jar.threshold).map((c) => c.shard))).rejects.toThrow();
      }),
      { numRuns: 25 },
    );
  });

  it('editing the ciphertext breaks the jar', async () => {
    const { jar, cards } = await sealJar(fc.sample(sealInputArb, 1)[0]!);
    const tampered = structuredClone(jar);
    const d = tampered.body.data;
    tampered.body.data = (d[0] === 'A' ? 'B' : 'A') + d.slice(1);
    await expect(openJar(tampered, cards.slice(0, jar.threshold).map((c) => c.shard))).rejects.toThrow();
  });

  it('refuses cards from another jar and duplicates', async () => {
    const input: SealInput = {
      owner: 'Ada',
      content: emptyContent(),
      threshold: 2,
      holders: [
        { name: 'A', letter: '' },
        { name: 'B', letter: '' },
        { name: 'C', letter: '' },
      ],
    };
    const one = await sealJar(input);
    const two = await sealJar(input);
    const s0 = one.cards[0]!.shard;
    expect(checkShard(one.jar, two.cards[0]!.shard, [])).toEqual({ ok: false, reason: 'other-jar' });
    expect(checkShard(one.jar, s0, [s0])).toEqual({ ok: false, reason: 'duplicate' });
    expect(checkShard(one.jar, s0, []).ok).toBe(true);
    expect(shardX(s0)).toBe(one.jar.holders[0]!.x);
  });

  it('a jar survives being written to text and read back', async () => {
    const { jar, cards } = await sealJar(fc.sample(sealInputArb, 1)[0]!);
    const back = parseJar(JSON.stringify(jar));
    await expect(openJar(back, cards.slice(0, back.threshold).map((c) => c.shard))).resolves.toBeDefined();
  });

  it('the self-check after sealing passes for every circle', async () => {
    await fc.assert(
      fc.asyncProperty(sealInputArb, async (input) => {
        const { jar, cards } = await sealJar(input);
        const check = await verifyCircle(jar, cards);
        expect(check.ok).toBe(true);
        expect(check.opened).toBeGreaterThan(0);
      }),
      { numRuns: 15 },
    );
  });

  it('a jar sealed with a jar id chosen ahead gives each person the ghost shown before sealing', async () => {
    await fc.assert(
      fc.asyncProperty(sealInputArb, bytes(4, 4), async (input, jarId) => {
        const { jar, cards } = await sealJar({ ...input, jarId });
        expect(jar.jarId).toBe(toBase32(jarId));
        const buddies = circleBuddies(cards[0]!.shard.jarId, jar.holders.map((h) => h.x));
        const ahead = circleCostumes(jarId);
        cards.forEach((c, i) => expect(buddies.get(c.x)!.costume).toBe(ahead[i % ahead.length]));
      }),
      { numRuns: 10 },
    );
  });

  it('the owner’s key reads back exactly what was sealed, letters included', async () => {
    await fc.assert(
      fc.asyncProperty(sealInputArb, async (input) => {
        const { jar, key } = await sealJar(input);
        const owned = await openWithKey(jar, key);
        expect(owned.content).toEqual(input.content);
        for (const h of jar.holders) {
          const written = input.holders.find((i) => i.name === h.name)!.letter.trim();
          expect(owned.letters[h.x] ?? '').toBe(written);
        }
      }),
      { numRuns: 25 },
    );
  });

  it('after an update with the key, the same cards open the new words and the same seals open the new letters', async () => {
    await fc.assert(
      fc.asyncProperty(sealInputArb, contentArb, fc.array(fc.string({ maxLength: 60 }), { minLength: 6, maxLength: 6 }), fc.nat(), async (input, next, texts, pick) => {
        const { jar, cards, key } = await sealJar(input);
        const letters: Record<number, string> = {};
        jar.holders.forEach((h, i) => {
          letters[h.x] = texts[i]!;
        });
        const updated = await resealJar(jar, key, { content: next, letters });
        expect(updated.jarId).toBe(jar.jarId);
        expect(updated.revision).toBe(2);
        expect(updated.holders.map((h) => [h.x, h.name])).toEqual(jar.holders.map((h) => [h.x, h.name]));

        // Any group of the old cards opens the new jar.
        const start = pick % cards.length;
        const circle = Array.from({ length: jar.threshold }, (_, i) => cards[(start + i) % cards.length]!.shard);
        const opened = await openJar(updated, circle);
        expect(opened.content).toEqual(next);
        for (const c of cards) {
          const text = letters[c.x]!.trim();
          if (text) expect((await openLetter(updated, opened, c.seal)).text).toBe(text);
          else await expect(openLetter(updated, opened, c.seal)).rejects.toThrow();
        }
        // The old jar file still holds only the old words.
        expect((await openJar(jar, circle)).content).toEqual(input.content);
      }),
      { numRuns: 25 },
    );
  });

  it('a key opens only its own jar, and an updated jar is still bound to its header', async () => {
    const a = await sealJar({ owner: 'Ada', content: emptyContent(), threshold: 2, holders: [{ name: 'A', letter: '' }, { name: 'B', letter: '' }] });
    const b = await sealJar({ owner: 'Ada', content: emptyContent(), threshold: 2, holders: [{ name: 'A', letter: '' }, { name: 'B', letter: '' }] });
    await expect(openWithKey(a.jar, b.key)).rejects.toThrow();
    await expect(resealJar(a.jar, b.key, { content: emptyContent(), letters: {} })).rejects.toThrow();
    // A key with the right jar id but the wrong seed is refused too.
    await expect(openWithKey(a.jar, { ...b.key, jarId: a.key.jarId })).rejects.toThrow();

    const updated = await resealJar(a.jar, a.key, { content: { ...emptyContent(), message: 'new' }, letters: {} });
    const tampered = { ...updated, revision: 1 };
    await expect(openJar(tampered, a.cards.map((c) => c.shard))).rejects.toThrow();
    expect(parseJar(JSON.stringify(updated))).toEqual(updated);
  });

  it('rejects impossible circles', async () => {
    const base = { owner: 'Ada', content: emptyContent() };
    await expect(sealJar({ ...base, threshold: 2, holders: [{ name: 'A', letter: '' }] })).rejects.toThrow();
    await expect(
      sealJar({ ...base, threshold: 3, holders: [{ name: 'A', letter: '' }, { name: 'B', letter: '' }] }),
    ).rejects.toThrow();
    await expect(
      sealJar({ ...base, threshold: 2, holders: [{ name: 'A', letter: '' }, { name: 'a', letter: '' }] }),
    ).rejects.toThrow();
  });
});

const watchConfigArb: fc.Arbitrary<WatchConfig> = fc.record({
  cadenceDays: fc.integer({ min: 1, max: 30 }),
  graceDays: fc.integer({ min: 1, max: 14 }),
  reminders: fc.integer({ min: 1, max: 5 }),
});

const actionsArb: fc.Arbitrary<OwnerAction[]> = fc.array(
  fc.record({ at: fc.integer({ min: 0, max: 200 }), type: fc.constantFrom('checkin', 'pause', 'resume') }),
  { maxLength: 15 },
);

describe('watch', () => {
  it('someone who checks in on time never alarms anyone', () => {
    fc.assert(
      fc.property(watchConfigArb, fc.integer({ min: 30, max: 300 }), (c, horizon) => {
        const actions: OwnerAction[] = [];
        for (let t = c.cadenceDays; t <= horizon; t += c.cadenceDays) actions.push({ at: t, type: 'checkin' });
        const run = runWatch(c, actions, horizon);
        expect(run.events.some((e) => e.kind === 'notify')).toBe(false);
      }),
    );
  });

  it('holders are only asked after the full cadence and grace period of silence', () => {
    fc.assert(
      fc.property(watchConfigArb, actionsArb, (c, actions) => {
        const run = runWatch(c, actions, 220);
        for (const e of run.events) {
          if (e.kind !== 'notify') continue;
          const lastSign = Math.max(0, ...actions.filter((a) => a.at < e.at).map((a) => a.at));
          expect(e.at - lastSign).toBeCloseTo(c.cadenceDays + c.graceDays);
          expect(actions.some((a) => a.at > lastSign && a.at <= e.at)).toBe(false);
        }
      }),
    );
  });

  it('every request to the holders is preceded by all the reminders', () => {
    fc.assert(
      fc.property(watchConfigArb, actionsArb, (c, actions) => {
        const run = runWatch(c, actions, 220);
        run.events.forEach((e, i) => {
          if (e.kind !== 'notify') return;
          const before = run.events.slice(0, i);
          const since = before.length - 1 - [...before].reverse().findIndex((b) => b.kind === 'due');
          const reminders = before.slice(since).filter((b) => b.kind === 'reminder');
          expect(reminders).toHaveLength(c.reminders);
        });
      }),
    );
  });

  it('nothing is scheduled while paused', () => {
    fc.assert(
      fc.property(watchConfigArb, fc.integer({ min: 0, max: 50 }), (c, pauseAt) => {
        const run = runWatch(c, [{ at: pauseAt, type: 'pause' }], 400);
        const after = run.events.filter((e) => e.at > pauseAt);
        expect(after).toHaveLength(0);
        expect(run.status).toBe('paused');
      }),
    );
  });

  it('events come out in time order', () => {
    fc.assert(
      fc.property(watchConfigArb, actionsArb, (c, actions) => {
        const at = runWatch(c, actions, 220).events.map((e) => e.at);
        expect(at).toEqual([...at].sort((a, b) => a - b));
      }),
    );
  });

  it('the message to holders never says anyone has died', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), fc.string({ minLength: 1 }), (owner, holder) => {
        const m = holderMessage(owner, holder);
        expect(m.subject.toLowerCase()).not.toMatch(/\b(dead|died|death)\b/);
      }),
    );
  });
});
