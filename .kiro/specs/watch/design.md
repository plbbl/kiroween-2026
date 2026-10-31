# Design Document

## Overview

The schedule is a pure function, `runWatch(config, actions, day)` in `src/core/watch.ts`, also used by the in-page preview. The service (`src/watch-service/service.ts`) stores records, sends mail, and on each `tick` sends whatever the schedule says is due. The HTTP layer (`http.ts`) is a `Request → Response` handler run by `server/dev.ts` and `netlify/functions/api.mts`; `watch-tick.mts` ticks hourly.

## Data model

`WatchRecord { id, createdAt, confirmedAt, owner, ownerKey (hash of email), holders[{name, email, optoutHash, jarHash?, removed}], config, actions[{at, type}], sent[], manageHash, checkinHash, jar?: {json, keptAt} }`

## Routes

`POST /api/watch`, `/confirm`, `/checkin`, `/status`, `/pause`, `/resume`, `/delete`, `/optout`, `/jar` (keep or remove), `/jar/open` (a friend's link), `/tick` (needs `x-tick-secret`); `GET /api/health`.

## Correctness Properties

1. For any rhythm and any on-time check-ins, friends are never asked. *Validates 2.3.*
2. For any rhythm, friends are asked only after the full cadence and grace, and after every reminder. *Validates 3.1.*
3. While paused, nothing is scheduled. *Validates 2.4.*
4. For any names, the message to friends never says anyone died. *Validates 3.2.*
5. With a kept jar, each friend's link opens exactly that jar, and no other token does. *Validates 3.3.* Test: "with a kept jar, each friend gets their own link that opens exactly that jar".

## Testing strategy

Property tests for the schedule in `core.test.ts`; service tests with a fake clock and an outbox mailer in `service.test.ts`; e2e starts, confirms and pauses a real watch against `server/dev.ts`, gives it a jar file from the manage page, and opens a dead friend link.
