---
inclusion: fileMatch
fileMatchPattern: ["src/ui/**", "src/pages/**", "src/App.tsx", "index.html", "**/*.css"]
---

# Design

The costume is cute, soft and simple: Kiroween purple and a cast of chibi ghosts shaded like soft vinyl toys. Death is heavy, so the interface is warm. References: Headspace (one character, flat color, room to breathe, one sentence) and Duolingo (the character carries the emotion, the interface stays calm).

## Rules

Taken from Apple's Human Interface Guidelines (Motion, Writing, Buttons, Layout) and applied here.

1. **Content first, big and few.** One headline (five words or fewer), at most one short line under it (about twelve words), one main action per screen. Type is large: page titles up to 5.4rem, the home hero up to 11rem, the home sections are statements. Say a fact with a number when you can ("2 of 3", "0", "1 file"). Details wait until asked for: guide items open on tap, the watch's rhythm sits behind "Change". The most important thing goes first. Content surfaces (cards, letters, fields) stay clean: no webs, patterns or props on them.
2. **Halloween lives in the cast and at the edges of the world.** The cast (eight costumes), candles, the jar and the wax seal carry the story; the scenery (`<Scenery/>`, `<HillScene/>`) sits behind and below the content; jack-o'-lanterns stand for progress. Decoration never sits on words, and is `aria-hidden`.
3. **Every word earns its place.** Fewer words. Plain language, no jargon. No "we" (it is unclear who that is): say what happens. Buttons are verbs ("Seal the jar", "Use this card"). Errors sit next to the field and say how to fix it. Humour is for the ritual moments (BOO!), never for labels.
4. **Buttons.** Flat capsules. One or two prominent (filled) buttons per view; the rest are a tint. Same size; style, not size, says which matters. Press feedback is immediate (scale 0.97, 80 ms).
5. **Motion has a purpose.** Feedback (brief, ≤ 200 ms), continuity (page 360 ms, step 340 ms, night falls 1 s) and the ritual moments (the home page's opening, sealing, the séance, the jar opening). The night itself may breathe, slowly and only in the scenery: fog drifting, fireflies, a bat now and then, lit windows. Never on content: no floating letters, no wiggling buttons. Nobody waits for a show twice: the home opening plays once a visit and a click skips it; the jar's opening can be skipped. Everything respects `prefers-reduced-motion`.
7. **Immersion, then calm.** The home page is a night you can play in, edge to edge: layered hills that shift with the pointer, a lantern (the pointer) that finds friends hiding in the dark, bats let go with a click, a fine grain over the night. The working pages (seal, watch, guides) stay calm and readable; their Halloween is the cast, the titles and the edges.
8. **Type.** Nunito for reading, Fredoka for headings and buttons, Rubik Wet Paint (letters that drip like candle wax) only for the big words: the wordmark, page titles, the big moments ("Sealed!", "It's open!") and the facts. Never below 2.2rem, never for anything you have to read twice.
6. **Color.** Purple, ink, lilac and night are the base. Amber means light (candles, progress). Mint, yellow and pink mean status, and color the three fact tiles on the home page. Text meets WCAG AA (the e2e axe audit enforces it).

## Tokens and parts

- Fonts: `--body`, `--display`, `--mono`, and `--spooky` for the dripping big words; all bundled as woff2 in `src/ui/fonts.ts` (no font CDN, so jar files stay offline).
- Colors in `src/ui/styles.css` `:root`: `--purple #8e47ff`, `--purple-text #7a35e8` for small text, `--purple-press`, `--lilac`, `--ink`, `--night`, `--sun`, `--mint`, `--pink`. Themes via `[data-theme='day'|'night']`.
- Easing: `--spring` for things that land, `--soft` for fades. Durations: button press ~120 ms, hover/card 450 ms spring, nav pill and page change 520 ms, chip pop 700 ms, day↔night 900 ms.
- The cast: `<Ghost costume mood emblem size float phase tilt rim line/>` (costumes: sheet, franken, skeleton, pumpkin, witch, bat, vampire, mummy; moods: open, curious, happy, sleep, wow, worried, sad, wink; `line` = print line art), `<Candle lit justLit/>`, `<Jar state wax corked notes/>`, `<WaxSeal state/>`.
- The Halloween kit in `src/ui/art/Spooky.tsx`: `<Pumpkin lit face line/>`, `<Bat flap/>`, `<Moon/>`, `<Cobweb corner/>`, `<Spider/>`, `<Skyline night/>`, `<Lantern lit/>`, `<Scenery/>`. Reuse these; do not draw new one-off art.
- Buttons are pills with a darker bottom edge (`.btn`, `.btn.primary`); cards are `.card`; status is `.status-pill`.

## Copy

Plain, short, kind. Second person. No jargon in the UI ("card", "seal", "key", not "share" or "secret"). Never "died" in anything sent to friends.

## Before calling a visual change done

Run `npm run build && npm run screens -- desk <part>` and `-- phone <part>`, and look at every screenshot of the screens you touched: alignment, overlap, wrapping at 390 px, contrast at night, and the reduced-motion end state. Fix what is off before finishing.
