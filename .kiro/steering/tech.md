---
inclusion: always
---

# Tech

## Stack

- React 19, TypeScript 5.9 (strict), Vite 8. The production build is **one HTML file** (`vite-plugin-singlefile`): scripts, styles, fonts and art inline. That file, with a jar embedded, is the jar file.
- WebCrypto (AES-256-GCM, HKDF-SHA256) and the audited `shamir-secret-sharing`. `@scure/bip39` word list, `@noble/hashes` SHA-256, `qrcode`, `jsqr` (plus the browser `BarcodeDetector` when present).
- Fonts are bundled from Fontsource: Fredoka (display), Nunito (body), Fragment Mono (words, tags).
- Watch service: plain TypeScript with injected store, mailer and clock; a standard `Request`/`Response` handler. Runs in `server/dev.ts` (Node) and `netlify/functions` (Netlify Blobs, Resend).
- Node 22. Server files run with `node --experimental-strip-types`, so `tsconfig` has `erasableSyntaxOnly`: no enums, namespaces or constructor parameter properties.

## Commands

| Command | What |
|---|---|
| `npm run dev` | Vite dev server (no watch service) |
| `npm run build` | `dist/index.html`, one self-contained file |
| `npm run serve` | built app + watch service on :8787; mail goes to `.data/outbox.json` |
| `npm test` | Vitest: property tests for core and the watch service |
| `npm run e2e` | Playwright walk-through of the built app, axe audits, keyboard-only run, real watch against a local server |
| `npm run screens` | screenshots of every screen and state, desktop and phone, into `e2e/screens/` |
| `npm run check:offline` | fails if anything but the watch client and the mail adapter can reach a network |
| `npm run check` | all of the above that verifies (typecheck, lint, offline, tests, build, e2e) |
| `npm run demo:jar` | regenerates June's demo jar and cards (only when they must change) |

Playwright is installed globally in some environments; `e2e/*.mjs` resolve it with `createRequire`.

## Rules

- **Dependencies:** exact versions only, no `^`. Add one only when it removes real risk or real work; never for cryptography beyond what is listed.
- **No network** in `src/core`, `src/ui/art`, or anywhere but `src/ui/watchApi.ts` and `src/watch-service/adapters.ts`. The jar file's CSP is `connect-src 'none'`.
- **Nothing persisted** in the browser: no localStorage/IndexedDB for content or keys. Memory only.
- **Style:** there is no formatter config; match the surrounding code. Two spaces, single quotes, semicolons, lines up to ~160 characters. Comments say *why*, briefly; most functions need none.
- **Tests:** anything in `src/core` or `src/watch-service` gets a property test (fast-check) when the behavior is a rule over many inputs, an example test otherwise. UI behavior that matters gets an e2e check in `e2e/run.mjs`.
- **Done means:** `npm run check` passes, and for any visible change `npm run screens` was run and the screenshots were looked at (see the design steering).
- **Commits:** plain English, a short subject, a body that says what changed and why.
