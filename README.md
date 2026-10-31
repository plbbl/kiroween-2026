# Phylactery

**Seal what you want to leave behind. Split the key among the people you trust. Only together can they open it.**

An entry for [Kiroween 2026](https://kiroween.devpost.com/), **Costume Contest** category.

![The vessel opens when the third candle is lit](docs/screenshots/opening.jpg)

## The problem

When someone dies, the people closest to them are locked out: of accounts, of photos, of the password manager that holds everything else, of the small instructions nobody wrote down. The tools that exist each solve a piece. Daily check-in apps notice that something happened but stop there. Digital-legacy services keep your secrets on their servers and hand everything to a single person. Platform legacy settings are scattered and rarely set up.

Phylactery joins the pieces: noticing, handing over, and making sure no single person, company or server can open what you left.

## How it works: three acts

**I. The Seal.** While you are here, write a message to everyone, the accounts you keep and how to get into them, where things are, and your wishes. Add a private letter for any person. Everything is encrypted in your browser. The key is split into one card per person in your circle, and you choose how many cards it takes to open it.

**II. The Watch.** On a rhythm you choose, a quiet question: *are you still here?* One tap answers. If you fall silent you are reminded, and only after a grace period are your people asked to *check on you*, never told that you are gone. Knock thrice to stop it.

**III. The Séance.** When the time comes, your people gather with their cards. Each card lights a candle. When enough are lit, the seal cracks and the vessel opens. Each letter then opens only with its reader's own seal, folded inside their card.

| | |
|---|---|
| ![Lighting candles around the circle](docs/screenshots/seance.jpg) | ![A letter, opened with its reader's seal](docs/screenshots/letter.jpg) |
| ![A printed card: shard outside, personal seal inside](docs/screenshots/card.jpg) | ![The watch: the mourning border widens as the circle is asked](docs/screenshots/watch.jpg) |

## Every spooky element does a job

The look is Victorian mourning stationery by day and a candlelit séance by night. Nothing is decoration only:

| Element | What it tells you |
|---|---|
| Candles around the circle | How many cards have been offered: the unlock progress |
| The wax seal | Whether the vessel is encrypted (pressed) or open (cracked) |
| The black border around the page | The state of the watch. Victorian mourning paper used a wider black edge for deeper mourning; here it widens as reminders go out and the circle is asked |
| The sigil on each card | A visual fingerprint: the mark on screen must match the mark on paper, so nobody offers the wrong card |
| Day and night | Paper and ink while you write; candlelight when your people gather |

All sounds (a match struck, a flame catching, wax pressed and cracking, a small bell) are synthesised live with the Web Audio API. There are no audio files. Sound is off until you turn it on. With *reduce motion* set in the operating system, every state is kept and the movement is dropped.

## Three promises

1. **No one can open it alone.** Not one friend, not a company, not us. The 256-bit key is split with Shamir's Secret Sharing; fewer cards than the threshold reveal nothing about it.
2. **Nothing leaves your hands.** There are no accounts, no analytics, and no requests to other servers. Fonts are bundled. The hosted page may only contact its own origin.
3. **It will outlast us.** Sealing produces a **Grimoire**: this whole app as a single HTML file with your encrypted vessel inside, under a Content Security Policy that forbids any network access. It opens offline, from a USB stick or an email attachment, years from now, even if this website is gone.

## Try it

- **The demonstration vessel.** Open *Séance* and choose *The demonstration vessel*. June Alder sealed hers with five cards; three of them open it. Click any three cards on the table, or type a card's 30 words. Then open a letter with that person's seal.
- **Seal your own.** Open *Seal*, write, choose your circle, press the seal, and print the cards (one page per person; fold the seal half inward).
- **See the watch.** Open *Watch* and press *Let time pass*.

Hosted version: <https://plbbl.github.io/kiroween-2026/> (published by the GitHub Pages workflow once Pages is enabled for the repository).

### Run it locally

```bash
npm install
npm run dev        # development server
npm test           # property-based tests
npm run build      # dist/index.html, a single self-contained file
npm run e2e        # end-to-end walk-through with Playwright (after build)
```

Node 22 or later.

## Security model

| Who | What they can learn |
|---|---|
| Anyone holding the Grimoire or vessel file | The owner's name, the holders' names, the date sealed, how many cards are needed. Everything else is encrypted with AES-256-GCM |
| One holder, or any group smaller than the threshold | Nothing more. Shamir shares below the threshold carry no information about the key |
| A holder's personal seal on its own | Nothing. It only works together with an opened vessel |
| The circle, once gathered | The vessel's contents, but not the private letters: each needs its reader's seal |
| This website | Nothing. No content, cards or keys are ever sent anywhere |
| Someone who steals enough cards | The vessel, but still not the letters. Keep cards like house keys |

The readable header is bound to every ciphertext as additional authenticated data, so editing the owner, the date or the circle breaks decryption. Each card carries a SHA-256 checksum, in its QR code and in its words, so a mistyped word is caught.

Limits worth knowing: this is browser cryptography; the app as a whole has not had an independent audit (the Shamir library has, by Cure53 and Zellic); print spoolers and screenshots can keep copies of cards; a malicious browser extension can read any page. **The wishes in a vessel are not a legal will.**

## Built with

- React 19, TypeScript, Vite; the build is a single HTML file via `vite-plugin-singlefile`
- WebCrypto: AES-256-GCM and HKDF-SHA256
- [`shamir-secret-sharing`](https://github.com/privy-io/shamir-secret-sharing) (Apache-2.0), independently audited
- [`@scure/bip39`](https://github.com/paulmillr/scure-bip39) word list and [`@noble/hashes`](https://github.com/paulmillr/noble-hashes) SHA-256 (MIT)
- [`qrcode`](https://github.com/soldair/node-qrcode) (MIT) and [`jsQR`](https://github.com/cozmo/jsQR) (Apache-2.0); the browser's `BarcodeDetector` is used when present
- Fonts: Cormorant Garamond, EB Garamond, IBM Plex Mono (SIL Open Font License), bundled via Fontsource
- Tests: [fast-check](https://github.com/dubzzz/fast-check) property-based tests with Vitest; Playwright end to end
- The epigraph is from Marcus Aurelius, *Meditations*, in George Long's 1862 translation (public domain)

### Tests

`npm test` runs 23 tests, most of them property-based, among them:

- any set of cards at or above the threshold opens the vessel and returns exactly what was sealed;
- any set one card short reveals nothing;
- each letter opens only with its own seal, never with another holder's seal relabelled;
- editing the readable header or the ciphertext breaks the vessel;
- every card survives the round trip through its QR text and through its words, including sloppy typing;
- someone who checks in on time never triggers a request to their circle, and the circle is never asked before the full silence period.

The property tests caught a real bug during development: the base32 decoder accepted non-canonical padding bits, so a damaged QR code could decode to the same card. Decoding is now strict.

`npm run e2e` seals a vessel, prints the cards, downloads the Grimoire, opens it from disk with two typed cards, opens a letter with a typed seal, runs the demo séance and the watch, and checks a phone layout.

## Project layout

```
src/core/      pure logic: cards, jar sealing and opening, sigils, watch schedule, tests
src/pages/     Home, Seal, Watch, Séance, Guides
src/ui/        components (candle, wax seal, vessel, sigil, cards), sound, styles
src/demo/      the demonstration vessel and its cards (generated by scripts/make-demo-jar.ts)
e2e/           Playwright walk-through
.kiro/         Kiro specs, hooks and steering
```

## How it was built

Created from scratch during the Submission Period (October 30 – December 4, 2026). No pre-existing code. Planning and the first implementation were done with Claude Code; development continues in Kiro, and the specs, hooks and steering used there live in [`/.kiro`](.kiro). A full write-up of how Kiro was used will be added before submission.

## License

[MIT](LICENSE)
