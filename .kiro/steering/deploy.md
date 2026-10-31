---
inclusion: manual
---

# Deploying

Use with `#deploy` in chat when publishing.

## Static, without the watch: GitHub Pages

`.github/workflows/pages.yml` builds and deploys `main`. Enable Pages with "GitHub Actions" as the source. Everything works except starting a real watch (the page says so).

## Everything: Netlify

`netlify.toml` builds `dist`, serves `/api/*` from `netlify/functions/api.mts` with Netlify Blobs, and runs `watch-tick.mts` hourly. Set:

- `RESEND_API_KEY`: from resend.com. Resend sends to any address only from a domain verified in Resend.
- `MAIL_FROM`: e.g. `Phylactery <watch@your.domain>` on that domain.
- `TICK_SECRET`: a long random string; protects the manual `POST /api/watch/tick`.

## Checks before publishing

1. `npm run check` passes (CI runs the same in `.github/workflows/ci.yml`).
2. The live site: open June's jar, open a letter, start a watch with your own address, confirm it from the email, open the manage link.
3. Download a jar file and open it with the network off.
