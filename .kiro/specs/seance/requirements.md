# Requirements Document

## Introduction

The séance is the third act: friends gather and offer their cards; each lights a candle; enough candles open the jar; each private letter then opens with its reader's seal.

## Glossary

- **Circle view**: the rug, the jar and one candle per needed card.
- **Offer**: giving a card to the séance by typing its words, scanning its QR code, or reading a photo.

## Requirements

### Requirement 1: Choose the jar

**User Story:** As a friend, I want to open the jar I was given, or try a demo, without an account.

#### Acceptance Criteria

1. THE System SHALL offer June's demo jar, a jar file chosen or dropped from disk, and a jar fetched from a friend's link (`#/seance?jar=…`).
2. WHEN a jar file is opened directly THEN THE System SHALL show its séance at once, in night mode.
3. WHEN a friend's link has expired THEN THE System SHALL say so and offer the jar file instead.

### Requirement 2: Offer cards

**User Story:** As a friend, I want to offer my card however is easiest.

#### Acceptance Criteria

1. THE System SHALL accept a card as typed words (with suggestions), from the camera, or from a photo.
2. WHEN a card belongs to another jar, is unknown, or was already offered THEN THE System SHALL refuse it with a plain reason.
3. WHEN a seal or the owner's key is offered as a card THEN THE System SHALL explain what it is for and refuse it.
4. WHERE the demo is open, THE System SHALL lay its five cards on a table to tap.

### Requirement 3: Show progress

**User Story:** As a circle, we want to see and hear the jar wake as we gather.

#### Acceptance Criteria

1. WHEN a card is accepted THEN THE System SHALL light the next candle, fly the card's buddy to it, warm the ring on the rug, and announce "{name} is here. n of k candles lit." to screen readers.
2. WHEN the threshold is reached THEN THE System SHALL crack the seal, pop the cork, and let the ghost out with the words.
3. WHERE the person prefers reduced motion, THE System SHALL keep every state and drop the movement.

### Requirement 4: Reveal

**User Story:** As a circle, we want to read what was left, calmly.

#### Acceptance Criteria

1. THE System SHALL show the note, accounts (with what should happen to each), places and wishes on paper-like cards.
2. THE System SHALL show one envelope per private letter, in one row, each with its reader's buddy.
3. WHEN a reader offers their seal THEN THE System SHALL open only their letter, below the row.
4. WHEN a seal belongs to someone else THEN THE System SHALL say whose letter this is.
