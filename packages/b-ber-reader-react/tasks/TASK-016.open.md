# TASK-016: Expand test project URLs in dev/index.js

**Status:** not started
**Phase:** Documentation / Developer Experience
**Priority:** low
**Created:** 2026-05-30

## Description

`dev/index.js` currently has one active `manifestURL` and a few commented-out
alternatives. Adding more well-documented project URLs gives agents and developers
a broader set of content to test against — especially for edge cases like
multi-spread chapters, scroll layout, footnotes, media embeds, etc.

## Desired project coverage

Each URL should cover a distinct feature or layout scenario:

| Scenario                   | What to test                                            |
| -------------------------- | ------------------------------------------------------- |
| Single full-bleed spread   | Spread positioning, one-page chapter                    |
| Multi-spread chapter       | Verso + recto classification, navigation to last spread |
| Scroll/mobile layout       | `lastSpreadIndex = 0`, no column pagination             |
| Media embeds (audio/video) | `Audio`, `Video`, `Vimeo` components                    |
| Footnotes                  | `Footnote` component, sidebar interaction               |
| Long chapter (many pages)  | Performance, navigation controls                        |

## Subtasks

- [ ] Identify which existing b-ber S3 projects cover each scenario above
- [ ] Add commented-out `manifestURL` entries to `dev/index.example.js` with a label for each scenario
- [ ] Document the URLs in `AGENTS.md` under the "Dev Environment" section
- [ ] Update `PLAN.md`

## Notes

- `dev/index.js` is gitignored; changes to `dev/index.example.js` propagate to
  new setups when developers copy it.
- The current active URL (`i29-roundup`) is a good general-purpose test project.
- `spreads-testing-nov-2024` already exists in `dev/index.js` for spread testing.
- Confirm all URLs are publicly accessible before documenting them.
