# .kiro

Kiro's working files for Phylactery. This directory is committed on purpose and must never be added to `.gitignore` (Kiroween 2026 rules).

| Path | What |
|---|---|
| `steering/product.md`, `tech.md`, `structure.md` | always included: what Phylactery is, how it is built, where things live |
| `steering/security.md` | included for cryptography, formats and the watch service (fileMatch) |
| `steering/design.md` | included for UI and CSS (fileMatch) |
| `steering/deploy.md` | manual: `#deploy` when publishing |
| `specs/seal-and-cards`, `seance`, `watch`, `owner-key` | feature specs (requirements, design with correctness properties, tasks) |
| `specs/print-only-cards` | a bugfix spec |
| `specs/remote-seance` | next: requirements drafted, design and tasks to be written in Kiro |
| `hooks/checks.json` | property tests on save, the offline guard, fast checks before the agent stops |
| `hooks/reviews.json` | a format-compatibility review for card and jar code; a screenshot review after UI tasks |
| `agents/security-reviewer.md`, `design-reviewer.md` | read-only reviewers with narrow shell permissions |
| `settings/mcp.json` | Playwright MCP for looking at the running app |

## Where these came from

The first versions of the app, up to the owner's key and the kept jar, were built with Claude Code before the project moved to Kiro. The specs for those features were written afterwards from the code and its tests, so Kiro starts with the full picture; their tasks are already checked. The steering, hooks, agents and MCP settings were written for Kiro to continue the work. Specs created from here on are made in Kiro.
