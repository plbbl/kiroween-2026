# Design Document

## Overview

`sealJar` now draws a seed and derives the master key (`phylactery/master`) and each holder's seal (`phylactery/seal/{x}`) from it with HKDF. `openWithKey(jar, key)` re-derives the master and the seals to read everything; `resealJar(jar, key, {content, letters})` encrypts new content under the same keys with `revision + 1`.

## Card layout

key: seed(32) ‖ jarId(4) ‖ 0x03 → 28 words; QR text as for other cards. 30, 17 and 28 words keep the three kinds apart when typed.

## Compatibility

Older jars (random master key, no seed) still open with their cards; they simply have no key. `revision` enters the header AAD only when present, so older jars keep their exact AAD.

## UI

`#/seal?update` → `OpenForUpdate` (jar file or the embedded jar, then the key) → the wizard with `locked` circle and the real buddies → `Updated` (download, optional hand-over to the watch by manage link).

## Correctness Properties

1. For any sealed jar, the key reads back exactly the content and every letter. *Validates 2.1.*
2. For any jar and any new content and letters, after `resealJar` any threshold group of the original cards opens the new content, each original seal opens its new letter, and the old jar still holds the old content. *Validates 2.3, 2.4.*
3. A key from another jar, or with the right id and a wrong seed, is refused; a tampered revision breaks the jar. *Validates 2.5.*
