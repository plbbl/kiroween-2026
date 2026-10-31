# Design Document

## Overview

`src/pages/seance/Seance.tsx` holds `Choose` (demo, file, link) and `Circle` (candles, buddies, offering, opening); `Reveal.tsx` shows the contents and the letters. Opening uses `openJar` and `openLetter` from core.

## Flow

```
Choose ──▶ Circle: offer(card) ─▶ checkShard ─▶ light candle (+ flight, sound, announce)
                    └─ k accepted ─▶ openJar ─▶ crack seal, pop cork, notes fly ─▶ Reveal
Reveal: Letters row ─▶ SealEntry ─▶ openLetter ─▶ letter below the row
```

## Components

- `CardInput` (`src/ui/components/`): words with word-list hints, camera (BarcodeDetector or jsQR), photo.
- `Candle`, `Jar` (`state: sealed | stirring | open`), `WaxSeal` (`whole | cracking | broken`), `Ghost` buddies.
- Day/night via `useAtmosphere('night')`; candlelight warms the backdrop through `--candlelight`.

## Correctness Properties

1. For any circle, only cards of this jar, each once, are accepted. *Validates 2.2.* Test: "refuses cards from another jar and duplicates".
2. For any circle, each letter opens only with its own seal, never with another holder's seal relabelled. *Validates 4.3, 4.4.* Test: "each letter opens only with its own seal".

## Testing strategy

e2e: June's demo opens with three tapped cards and Clara's seal opens Clara's letter; Ada's jar file opens with two typed cards; the keyboard alone completes a séance; axe audits the circle at night.
