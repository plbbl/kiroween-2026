# Requirements Document

## Introduction

The watch notices when the owner goes quiet and gently asks their friends to check on them. It is the only part of Phylactery with a server, and it never learns what is in the jar.

## Glossary

- **Rhythm**: how often the owner is asked (cadence), how long to wait after (grace), and how many reminders to send.
- **Check-in**: the owner's one-tap answer to "still here?".
- **Kept jar**: an optional locked copy of the owner's jar, held by the watch for the friends.

## Requirements

### Requirement 1: Start and confirm

**User Story:** As an owner, I want to start a watch with my email and my friends', and nothing to happen until I confirm.

#### Acceptance Criteria

1. WHEN a watch is started THEN THE System SHALL email only the owner, with a confirm link and a manage link.
2. WHILE the owner has not confirmed THE System SHALL send nothing else.
3. THE System SHALL refuse more than 3 watches per address and more than 10 friends per watch.

### Requirement 2: The rhythm

**User Story:** As an owner, I want one gentle question now and then that one tap answers.

#### Acceptance Criteria

1. WHEN the cadence passes without a check-in THEN THE System SHALL email "still here?" with a check-in link.
2. WHEN the owner stays quiet THEN THE System SHALL send the configured number of reminders across the grace period.
3. IF the owner checks in on time THEN THE System SHALL never contact the friends.
4. WHILE paused THE System SHALL schedule nothing.

### Requirement 3: Asking the friends

**User Story:** As a friend, I want to be asked to check on the owner, told who else was asked, and how we would open the jar, without being told anyone died.

#### Acceptance Criteria

1. WHEN the full silence has passed and every reminder was sent THEN THE System SHALL email each friend "Please check on {owner}", with who else was asked and how the circle opens the jar.
2. THE System SHALL NOT say in any message to friends that the owner has died.
3. WHERE the owner left a kept jar, THE System SHALL give each friend their own link that opens exactly that jar.
4. WHEN the owner checks in after friends were asked THEN THE System SHALL tell the friends all is well.
5. THE System SHALL give each friend an opt-out link.

### Requirement 4: The kept jar

**User Story:** As an owner, I want my friends to reach my jar without keeping a file for years.

#### Acceptance Criteria

1. THE System SHALL let the owner give, replace or remove a kept jar with the manage link, or when starting a watch.
2. THE System SHALL validate a kept jar as a jar and refuse anything larger than 200,000 characters.
3. THE System SHALL never hold a card, a seal or the owner's key.

### Requirement 5: The yearly review

**User Story:** As an owner, I want a yearly nudge to check my jar is current.

#### Acceptance Criteria

1. WHEN November 2 comes THEN THE System SHALL email the owner once that year with a link to update the jar with their key.
2. IF the watch is in its first month, paused, or friends are being asked THEN THE System SHALL NOT send the review.

### Requirement 6: Tokens

#### Acceptance Criteria

1. THE System SHALL store only SHA-256 hashes of link secrets and compare them in constant time.
2. WHEN new mail goes out THEN THE System SHALL rotate check-in, opt-out and jar links.
3. THE System SHALL accept tokens only in POST bodies.
