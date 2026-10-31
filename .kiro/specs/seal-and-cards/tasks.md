# Implementation Plan

- [x] 1. Byte encodings: strict base32, base64url, BIP-39 words with a checksum
  - _Requirements: 4.2_
- [x] 2. Card layouts for shard and seal, QR text with checksum, sloppy-typing parser
  - _Requirements: 4.1, 4.2_
- [x] 3. sealJar / openJar / openLetter with AES-GCM, HKDF and header AAD
  - _Requirements: 3.1, 3.2, 2.4_
- [x] 4. verifyCircle self-check and its display on the Sealed page
  - _Requirements: 3.3_
- [x] 5. Six-step wizard with chips, starters, letters, threshold candles, inline duplicate-name errors
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3_
- [x] 6. Buddies per card, distinct within a circle
  - _Requirements: 4.3_
- [x] 7. Printable cards (line art) and print-only layout
  - _Requirements: 4.1, 4.4_
- [x] 8. Jar file with embedded jar and offline CSP
  - _Requirements: 5.1, 5.2_
- [x] 9. Property tests for every rule above, e2e from wizard to opened jar file
  - _Requirements: 3.1, 3.2, 4.2, 4.3_
