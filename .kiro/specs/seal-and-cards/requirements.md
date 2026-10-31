# Requirements Document

## Introduction

Sealing is the first act of Phylactery. The owner writes what their people will need, chooses a circle of friends and how many of them must gather, and the browser encrypts everything into a jar whose key is split into one printed card per friend. Nothing leaves the device and nothing is stored.

## Glossary

- **Owner**: the person sealing the jar.
- **Holder**: a friend who receives a card.
- **Threshold**: how many cards are needed to open the jar.
- **Card**: a holder's printed page; the card itself is a shard (a Shamir share); the half cut from it is a seal.
- **Jar file**: the app as one HTML file with the encrypted jar inside.
- **System**: the Phylactery web app.

## Requirements

### Requirement 1: Write the contents

**User Story:** As an owner, I want to write a note, my accounts, where things are and my wishes, so that my people know what to do.

#### Acceptance Criteria

1. THE System SHALL guide the owner through six steps: name, note, things (accounts and places), wishes, circle, seal.
2. WHEN the owner leaves the page with unsealed words THEN THE System SHALL ask before closing.
3. THE System SHALL NOT store any draft content outside page memory.

### Requirement 2: Choose the circle

**User Story:** As an owner, I want to choose who holds a card and how many must gather, so that no one can open the jar alone and a lost card is not fatal.

#### Acceptance Criteria

1. THE System SHALL accept between 2 and 10 holders, each with a non-empty name.
2. WHEN two holders have the same name (ignoring case) THEN THE System SHALL mark both fields and explain next to them.
3. THE System SHALL let the owner pick a threshold between 2 and the number of holders.
4. WHERE the owner writes a private letter for a holder, THE System SHALL encrypt it so that it opens only with that holder's seal after the jar is open.

### Requirement 3: Seal

**User Story:** As an owner, I want my words locked in my browser with a key split among my friends, so that fewer than the threshold learn nothing.

#### Acceptance Criteria

1. WHEN the owner seals THEN THE System SHALL encrypt the contents with AES-256-GCM under keys derived from a random seed, and split the master key with Shamir's Secret Sharing into one share per holder.
2. THE System SHALL bind the readable header to every ciphertext, so that editing the header breaks decryption.
3. WHEN sealing finishes THEN THE System SHALL verify that every group of threshold cards opens the jar and no group of threshold − 1 does, and show the result.

### Requirement 4: Cards

**User Story:** As a holder, I want a card I can scan or type, so that I can offer it years later.

#### Acceptance Criteria

1. THE System SHALL print one page per holder: the shard with a QR code and 30 words, the seal below a cut line with a QR code and 17 words; the owner's key SHALL print on its own.
2. THE System SHALL encode every card with a checksum, so that a mistyped word or a damaged code is refused rather than read wrongly.
3. THE System SHALL show each card's buddy (a costume and an emblem derived from the jar and the card), distinct within a circle, on screen and in print.
4. WHEN printing THEN THE System SHALL print only the cards, or only the owner's key page.

### Requirement 5: The jar file

**User Story:** As a holder, I want a file that opens years from now, without this website.

#### Acceptance Criteria

1. THE System SHALL offer the jar file: this app with the jar inside, under a Content-Security-Policy that allows no network access.
2. WHEN the jar file is opened THEN THE System SHALL go straight to its séance, offline.
