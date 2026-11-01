---
inclusion: fileMatch
fileMatchPattern: ["src/ui/**", "src/pages/**", "src/App.tsx", "index.html", "**/*.css"]
---

# Design

The costume is cute, soft and simple: Kiroween purple and a cast of chibi ghosts shaded like soft vinyl toys. Death is heavy, so the interface is warm. References: Headspace (one character, flat color, room to breathe, one sentence) and Duolingo (the character carries the emotion, the interface stays calm).

## Rules

1. One character, one headline, one main action per screen. A headline, then one sentence.
2. Halloween is on every surface, in the same soft style as the cast: the cast (eight costumes, one per friend), the candles, the jar and the wax seal; behind every page the scenery (`<Scenery/>`: cobwebs, a spider, the hill with the old house, passing bats; at night the moon, fog and lit windows); and the details (a bat on every `.tag`, dripping primary buttons, a cobweb on every `.card`, jack-o'-lanterns for progress). Decoration stays behind or beside the words, never on them, and is `aria-hidden`.
3. Every spooky element does a job: candles = progress; the wax seal = locked/opened; the ghost in the jar = the jar's state; a card's buddy = that card's fingerprint; the watch ghost's face = the watch state; day/night = writing vs gathering.
4. Motion marks a change of state. Only the ghost in focus (float, blink), lit flames and the scenery (a passing bat, the spider, the fog) move on their own. Everything respects `prefers-reduced-motion` (state kept, movement dropped).
5. Color: purple, ink, lilac and night are the base. Amber means light (candles, progress). Mint, yellow and pink only mean status. Text meets WCAG AA (the e2e axe audit enforces it).

## Tokens and parts

- Colors in `src/ui/styles.css` `:root`: `--purple #8e47ff`, `--purple-text #7a35e8` for small text, `--purple-press`, `--lilac`, `--ink`, `--night`, `--sun`, `--mint`, `--pink`. Themes via `[data-theme='day'|'night']`.
- Easing: `--spring` for things that land, `--soft` for fades. Durations: button press ~120 ms, hover/card 450 ms spring, nav pill and page change 520 ms, chip pop 700 ms, day↔night 900 ms.
- The cast: `<Ghost costume mood emblem size float phase tilt rim line/>` (costumes: sheet, franken, skeleton, pumpkin, witch, bat, vampire, mummy; moods: open, curious, happy, sleep, wow, worried, sad, wink; `line` = print line art), `<Candle lit justLit/>`, `<Jar state wax corked notes/>`, `<WaxSeal state/>`.
- The Halloween kit in `src/ui/art/Spooky.tsx`: `<Pumpkin lit face line/>`, `<Bat flap/>`, `<Moon/>`, `<Cobweb corner/>`, `<Spider/>`, `<Skyline night/>`, `<Lantern lit/>`, `<Scenery/>`. Reuse these; do not draw new one-off art.
- Buttons are pills with a darker bottom edge (`.btn`, `.btn.primary`); cards are `.card`; status is `.status-pill`.

## Copy

Plain, short, kind. Second person. No jargon in the UI ("card", "seal", "key", not "share" or "secret"). Never "died" in anything sent to friends.

## Before calling a visual change done

Run `npm run build && npm run screens -- desk <part>` and `-- phone <part>`, and look at every screenshot of the screens you touched: alignment, overlap, wrapping at 390 px, contrast at night, and the reduced-motion end state. Fix what is off before finishing.
