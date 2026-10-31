# Design Document

## Overview

Sealing runs entirely in the browser (`src/core/jar.ts`, `src/core/cards.ts`). The UI is a six-step wizard (`src/pages/seal/`) that ends in the Sealed page with the self-check, the card fan, printing and the jar file.

## Architecture

```
Seal wizard ─▶ validateSealInput ─▶ sealJar ─▶ { jar, cards, key }
                                       │
                 verifyCircle ◀────────┘          PrintableCard ×n, PrintableKey
                 makeGrimoire(jar) ─▶ jar file (HTML, CSP connect-src 'none')
```

## Data models

- `JarFile`: `{ format, jarId, owner, sealedAt, revision?, threshold, total, holders[{x, name, hasLetter}], body, letters[{x, sealed}] }`; `sealed = { iv, data }` in base64url.
- Card byte layouts (secret first, so two cards of one jar differ from the first word):
  - shard: share(33) ‖ jarId(4) ‖ threshold ‖ total ‖ 0x01 → 30 words
  - seal: secret(16) ‖ jarId(4) ‖ x ‖ 0x02 → 17 words
  - QR text: `PH1-` + base32(bytes ‖ sha256(bytes)[0..2])

## Key derivation

See the security steering: seed → master and seals by HKDF; body and letter keys from the master.

## Correctness Properties

1. For any circle and any group of at least threshold cards, opening returns exactly the sealed content. *Validates 3.1.* Test: "any circle of at least the threshold opens the jar and recovers the content".
2. For any circle, threshold − 1 cards reveal nothing. *Validates 3.1.* Test: "one card short of the threshold reveals nothing".
3. For any jar, editing the header or the ciphertext breaks it. *Validates 3.2.* Tests: "editing any part of the readable header breaks the jar", "editing the ciphertext breaks the jar".
4. For any card, reading it back from its QR text or its words yields the same card; a changed word never silently yields the original. *Validates 4.2.* Tests: "a card read from its QR code or its words is the same card", "changing one word is either rejected or never silently returns the original".
5. For any circle, buddies differ in costume and emblem and do not depend on order. *Validates 4.3.*
6. The self-check passes for every circle. *Validates 3.3.*

## Error handling

Impossible circles are refused before any key is made; sealing errors return the wizard to its last step with a message.

## Testing strategy

Property tests in `src/core/core.test.ts` (fast-check); e2e in `e2e/run.mjs` seals Ada's jar, checks the self-check text, prints, downloads the jar file and opens it from disk with typed words.
