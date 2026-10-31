# Requirements Document

> Draft for the next piece of work. Refine it in Kiro, then let Kiro write the design and tasks.

## Introduction

Today a séance happens around one device: every card is typed or scanned into the same browser. Friends often live apart. A remote séance lets each friend offer their card from their own phone, while keeping every promise: no server learns a share, a seal, or the contents.

## Glossary

- **Host**: the friend who opens the jar file (or link) and starts the remote séance.
- **Guest**: a friend who joins from their own device.
- **Room**: a short-lived meeting point that relays encrypted messages between host and guests.

## Requirements

### Requirement 1: Start a room

**User Story:** As a host, I want to invite the others with a link or a short code, so we can gather without being in one place.

#### Acceptance Criteria

1. WHEN the host starts a remote séance THEN THE System SHALL show a link and a short spoken code to share.
2. THE System SHALL close the room when the jar opens, when the host leaves, or after 24 hours.

### Requirement 2: Join and offer

**User Story:** As a guest, I want to offer my card from my phone and see the candles light.

#### Acceptance Criteria

1. WHEN a guest joins THEN THE System SHALL show the same circle: the jar, the candles, who is here.
2. WHEN a guest offers their card THEN THE System SHALL send the shard to the host encrypted end to end, so that the relay cannot read it.
3. WHEN the host accepts a card THEN every device SHALL light that guest's candle and fly their buddy in.
4. IF a card is refused THEN only that guest SHALL see why.

### Requirement 3: Open together

**User Story:** As a circle, we want to watch the jar open together, each on our own screen.

#### Acceptance Criteria

1. WHEN the threshold is reached THEN the host's device SHALL open the jar, and every device SHALL play the opening.
2. WHERE the host chooses, THE System SHALL send the contents to guests end to end; otherwise guests see that the jar is open on the host's screen.
3. THE System SHALL keep each private letter on its reader's device: a guest opens their letter with their own seal, which never leaves their device.

### Requirement 4: Promises

#### Acceptance Criteria

1. THE System SHALL never let the relay see a share, a seal, the contents or a letter.
2. THE System SHALL store nothing after the room closes.
3. THE System SHALL keep the in-person séance and the offline jar file working exactly as before.
