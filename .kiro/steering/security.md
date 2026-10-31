---
inclusion: fileMatch
fileMatchPattern: ["src/core/**", "src/watch-service/**", "src/ui/grimoire.ts", "src/ui/watchApi.ts", "server/**", "netlify/**"]
---

# Security and compatibility

Read before touching cryptography, card or jar formats, or the watch service.

## The model

- A random 256-bit **seed** is the root. With HKDF-SHA256 (salt = the 4-byte jar id):
  - master key = HKDF(seed, info `phylactery/master`, 32 bytes)
  - seal of holder x = HKDF(seed, info `phylactery/seal/{x}`, 16 bytes)
  - body key = HKDF(master, info `phylactery/body`)
  - letter key for x = HKDF(master ‖ seal, info `phylactery/letter/{x}`)
- The master key is split with `shamir-secret-sharing` (one share per holder; the share's last byte is its x).
- Everything is AES-256-GCM with a fresh 12-byte IV. The readable header (format, jarId, owner, sealedAt, revision if present, threshold, total, holders) is the AAD of the body; a letter's AAD is the header plus its x.
- The seed exists in exactly one place: the owner's printed key page. Never store it, log it, or send it anywhere.

## Never break printed cards

Cards are paper and may sit in a drawer for decades.

- Never change the byte layout, kind bytes (0x01 shard, 0x02 seal, 0x03 key), word encoding or QR prefix of an existing card kind. New kinds get new kind bytes.
- Never change how existing jars decrypt. New header fields must be optional and enter the AAD only when present (see `revision`), so older jars keep their exact AAD.
- `parseJar` must keep accepting every jar any earlier version could produce.
- Demo cards in `src/demo/demo.json` are printed by people trying the demo; regenerate them only on purpose.

## Rules

- Only WebCrypto and the libraries already listed in tech.md. No hand-written cryptography.
- No plaintext, seed, share or seal in logs, errors, URLs, storage or the watch service.
- Errors shown to people say what to do, never echo secrets.
- Watch service: tokens are `id.secret`, only SHA-256 of the secret is stored, compared in constant time; check-in, opt-out and jar links rotate when new mail goes out; tokens travel in POST bodies, never in server-logged URLs. At most 3 watches per address, 10 friends per watch. A kept jar is validated with `parseJar`, capped at 200,000 characters, stored exactly as given.
- Messages to friends never say anyone has died (a property test enforces this).
- Anything that changes these rules needs a property test that states the rule.

Tests that guard the model live in #[[file:src/core/core.test.ts]] and #[[file:src/watch-service/service.test.ts]].
