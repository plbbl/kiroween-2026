# Implementation Plan

- [x] 1. Seed-based derivation in sealJar; KeyCard (0x03) encode/decode/parse
  - _Requirements: 1.1_
- [x] 2. openWithKey and resealJar; optional revision in the header and AAD
  - _Requirements: 2.1, 2.3_
- [x]* 3. Property tests for the three correctness properties
  - _Requirements: 2.1, 2.3, 2.4, 2.5_
- [x] 4. Print the key page; explain it on the Sealed page
  - _Requirements: 1.1, 1.2_
- [x] 5. Update flow: OpenForUpdate, locked wizard, Updated page, link from the first step and from jar files
  - _Requirements: 2.1, 2.2, 2.5_
- [x] 6. Hand the new version to the watch
  - _Requirements: 2.6_
- [x] 7. e2e: print the key, update a downloaded jar file, open the new file with two original cards
  - _Requirements: 2.3, 2.4_
