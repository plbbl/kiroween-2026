---
inclusion: always
---

# Product: Phylactery

A tiny ghost keeps your last words. You write what your people will need, seal it in a jar in your browser, and give each friend a printed card. Only enough friends together can open the jar. An entry for Kiroween 2026, Costume Contest category: a polished, cute Halloween interface where every spooky element does a job.

## Who it is for

Anyone whose people would be locked out if something happened to them: of accounts, photos, the password manager, the small instructions nobody wrote down. Especially people who live alone (about 29% of US households) and the friends or family who would have to sort things out.

## The three acts

1. **Seal.** A six-step wizard: your name, a note for everyone, accounts and where things are, wishes, the circle (friends, private letters, how many must gather), seal. The key is split into one card per friend (Shamir). Before printing, the app proves every group of the chosen size opens the jar and no smaller group does. The owner also gets a key page to change the jar later.
2. **Watch** (optional service). Now and then one gentle question, "still here?". One tap answers it. Silence brings reminders; only after the full silence are friends asked to *check on you*, never told you have died. Answer late and they hear all is well. The owner may leave the watch a locked copy of the jar; each friend then gets a link to it.
3. **Séance.** Friends gather and offer their cards (typed words, camera, or photo). Each card lights a candle and its ghost buddy flies in; enough candles and the seal cracks, the cork pops, the ghost wakes and hands over the words. Each private letter opens only with the seal folded inside its reader's card.

## Words we use (in the UI and in code)

- **jar**: the encrypted bundle (`JarFile`). The **jar file** is this whole app as one HTML file with a jar inside.
- **card**: one friend's printed page. Its outside is a **shard** (a Shamir share); its folded inside is a **seal** (opens that friend's letter).
- **key** (or key card): the owner's own page, the seed of every key in the jar. It changes the jar; it also opens it alone, so it is kept like a passport.
- **circle**: the friends who hold cards. **threshold**: how many must gather.
- **buddy**: the little ghost on each card (costume + emblem), derived from the jar, so the ghost on screen must match the ghost on paper.
- **watch**: the check-in service. **séance**: opening the jar together.

## Promises (never break these)

1. No one opens it alone: not one friend, not a company, not us. Only the owner, with their key.
2. Nothing leaves the device unlocked. No accounts, no analytics. The watch knows names, emails and times, and only by choice a locked copy of the jar.
3. It outlives us: the jar file opens offline, years from now, even if this site is gone. Printed cards must keep working forever.
4. Gentle: death is heavy, so the tone is warm and cute, never gory or morbid. Messages to friends never say anyone died.

## Not the goal

- Not a legal will. Not a password manager. Not a social network. No sign-up, ever.
- No feature that needs the server to read the jar.

## State and next

Done: everything above, plus guides (legacy settings at big platforms, a checklist for the days after), a demo jar (June Alder, 3 of 5), printing, the offline jar file, updating with the key, the watch with Netlify/Resend adapters, a yearly Day of the Dead review email.

Open ideas, in order of value: a remote séance (friends in different places, end to end), real-phone camera testing, translations.

#[[file:PLAN.md]] holds the original plan (in Chinese) and the design rules; #[[file:README.md]] is the public description.
