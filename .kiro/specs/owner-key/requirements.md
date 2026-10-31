# Requirements Document

## Introduction

Before this, any change to a jar meant sealing a new one and printing every card again. The owner's key lets them change what is inside while every friend keeps the card they have.

## Glossary

- **Seed**: 32 random bytes from which every key in a jar is derived.
- **Key**: the owner's printed page carrying the seed (28 words and a QR code).
- **Revision**: the jar's version number, 1 at first sealing.

## Requirements

### Requirement 1: The key

**User Story:** As an owner, I want a key of my own when I seal, so I can change the jar later.

#### Acceptance Criteria

1. WHEN a jar is sealed THEN THE System SHALL derive the master key and every seal from one random seed, and print the seed as the owner's key after the friends' cards.
2. THE System SHALL tell the owner the key opens the jar alone and must be kept apart from the cards.

### Requirement 2: Update

**User Story:** As an owner, I want to open my jar with my jar file and key, edit it, and seal it again, so my friends' cards still work.

#### Acceptance Criteria

1. WHEN the owner gives a jar file and its key THEN THE System SHALL open the contents and every letter into the wizard.
2. WHILE updating THE System SHALL keep the circle, names and threshold fixed and let the owner change the contents and the letters.
3. WHEN the owner seals the new words THEN THE System SHALL produce a jar with the same id, a higher revision, the same master key and the same seals.
4. THE System SHALL let any group of the original cards open the new jar, and each original seal open its new letter.
5. IF a key belongs to another jar, or a friend's card is offered as a key, THEN THE System SHALL refuse it.
6. IF the watch keeps a copy THEN THE System SHALL let the owner hand it the new version.
