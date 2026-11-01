---
inclusion: fileMatch
fileMatchPattern: ["src/ui/**", "src/pages/**", "src/App.tsx", "index.html", "**/*.css"]
---

# Design

The costume is cute, soft and simple: Kiroween purple and a cast of chibi ghosts shaded like soft vinyl toys. Death is heavy, so the interface is warm. References: Headspace (one character, flat color, room to breathe, one sentence) and Duolingo (the character carries the emotion, the interface stays calm).

## Rules

Taken from Apple's Human Interface Guidelines (Motion, Writing, Buttons, Layout) and applied here.

1. **Content first.** One headline, at most one short sentence, one main action per screen. The most important thing goes first. Content surfaces (cards, letters, fields) stay clean: no webs, patterns or props on them.
2. **Halloween lives in the cast and at the edges of the world.** The cast (eight costumes), candles, the jar and the wax seal carry the story; the scenery (`<Scenery/>`, `<HillScene/>`) sits behind and below the content; jack-o'-lanterns stand for progress. Decoration never sits on words, and is `aria-hidden`.
3. **Every word earns its place.** Fewer words. Plain language, no jargon. No "we" (it is unclear who that is): say what happens. Buttons are verbs ("Seal the jar", "Use this card"). Errors sit next to the field and say how to fix it. Humour is for the ritual moments (BOO!), never for labels.
4. **Buttons.** Flat capsules. One or two prominent (filled) buttons per view; the rest are a tint. Same size; style, not size, says which matters. Press feedback is immediate (scale 0.97, 80 ms).
5. **Motion has a purpose.** Feedback (brief, ≤ 200 ms), continuity (page 360 ms, step 340 ms, night falls 1 s) and the three ritual moments (sealing, the séance, the jar opening). No motion for its own sake: no floating letters, no wiggling buttons, little at the edges of the screen (a bat now and then). Nobody waits for a show twice: the opening can be skipped. Everything respects `prefers-reduced-motion`.
6. **Color.** Purple, ink, lilac and night are the base. Amber means light (candles, progress). Mint, yellow and pink only mean status. Text meets WCAG AA (the e2e axe audit enforces it).

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
