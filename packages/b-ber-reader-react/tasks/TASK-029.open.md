# TASK-029: Eliminate blank spread pages (recto reserved columns + page-count over-count)

**Status:** not started
**Phase:** Bug Fixes
**Priority:** high
**Created:** 2026-06-06

## Description

Navigating a spreads-heavy chapter shows blank navigable pages between/after
spreads. Reported on `spreads-testing-nov-2024`, chapter-2, at 1792×1046: a
blank page appears where a spread is expected, and the spread shows on the next
index instead. Reproduces consistently in a few places.

This is distinct from the timing/staleness fixes in TASK-022/023/024 — those are
implemented. This is the deeper, pre-existing layout limitation of the
column-based spread approach.

**Update (2026-06-07):** Real-Chrome testing pinned the reporter's *intermediate*
blank to the measurement cascade now addressed by TASK-022's convergence loop (a
spread stuck classified recto despite sitting at a verso column). With that fix,
the remaining items here are: (1) the **trailing over-count blank** — the last
page is navigable but empty because `lastSpreadIndex = ceil(scrollHeight /
frameHeight / 2) - 1` rounds up a fractional trailing column (sentinel /
reserved space): e.g. 12.25 pages → `lastSpreadIndex 12` while the last visible
content is on screen 11; and (2) the broader fragility (recto reserved columns,
browser-dependent column fill) for which the robust fix remains spreads-out-of-
flow. Verify the intermediate blank is gone after TASK-022 before scoping the
rest. The recto-positioning math is unchanged from the
pre-refactor code (verified algebraically equivalent), so this is an original
bug, surfaced more deterministically now that `offset` is measured after the
layout settles.

## Measured evidence (headless Chrome, 1792×1046, via Playwright)

viewerSettings: paddingLeft=paddingRight=256, columnGap=80 → pageWidth=1360,
column height (frameHeight)=675, single column width=600.

Navigating chapter-2 page by page (ArrowRight) produced:

| screen | content                |
| ------ | ---------------------- |
| 0      | (empty / intro)        |
| 1      | spread + inline figure |
| 2      | inline figure          |
| 3      | spread                 |
| 4–5    | inline figures         |
| 6      | spread                 |
| 7–8    | inline figures         |
| 9      | spread + inline        |
| 10     | spread                 |
| 11     | spread                 |
| 12     | **blank**              |
| 13     | wraps to translateX=0  |

So in headless Chrome the spread sequence is correct; the only blank is the
**last** page (screen 12). The reporter saw the blank one index earlier — a
spread that measures verso in headless Chrome measures recto in their browser,
shifting everything by one screen. This verso/recto instability is the core
fragility.

### Root causes

1. **Recto spreads reserve a blank column.** A full-bleed spread that starts at
   a recto (right) column gets `multiplier = 3` (3 columns: 1 blank + a full
   page for the figure). That blank column manifests as a navigable blank page
   when its screen-mate has no content.

2. **verso/recto is content/browser dependent.** Whether a spread lands on a
   verso or recto column depends on exactly how the preceding inline figures and
   text fill columns, which differs across browsers/fonts/image-load timing.
   The same spread can be verso in one engine and recto in another → blanks
   appear at different indices.

3. **Page count over-counts trailing space.** `lastSpreadIndex =
   ceil(scrollHeight / frameHeight / 2) - 1`. Here scrollHeight = 24.5 columns =
   12.25 screens → `lastSpreadIndex = 12`, but the last visible content is on
   screen 11. The trailing fractional column (sentinel / reserved blank) rounds
   up into an extra navigable blank page. A simple `floor` instead of `ceil`
   would break text chapters that legitimately end on a partial page, so the
   fix must distinguish reserved-blank space from real partial content.

4. **`marginLeft` hiding is `±innerWidth/2`.** `SpreadFigure` offsets off-screen
   figures by half a page. Adjacent spreads are exactly `pageWidth` apart so they
   hide correctly today, but the half-page magnitude is fragile if spread
   spacing ever changes.

### Proposed directions (need a product decision + real-browser iteration)

- **Deterministic spread placement:** force every full-bleed spread to a verso
  column boundary so `multiplier` is always 2, and ensure the unavoidable
  partial column before it shares a screen with preceding content (or is
  collapsed). Eliminates verso/recto instability.
- **Page count from last visible content:** compute `lastSpreadIndex` from the
  position of the last visible figure/text rather than raw `scrollHeight`, so
  trailing reserved/sentinel space doesn't add a blank page.
- **Bigger lever:** take full-bleed spreads out of the column flow entirely and
  paginate them as their own pages. Most robust, largest change.

## Subtasks

- [ ] Decide target behavior with stakeholders (one page per spread, no blanks)
- [ ] Choose approach (deterministic placement vs. spreads-out-of-flow)
- [ ] Fix `lastSpreadIndex` so trailing reserved space is not a navigable page
- [ ] Verify across Chrome, Firefox, Safari at several window sizes (use the
      Playwright harness described in Notes)
- [ ] `npm test`; commit; update `PLAN.md`; remove `.open`

## Notes

- A Playwright harness reproduces this deterministically: set
  `dev/index.jsx` to the spreads project, `npm start`, then drive
  `ArrowRight` from `?currentSpineItemIndex=2&spreadIndex=0&slug=chapter-2` and
  read each `.bber-spread`/figure `getBoundingClientRect` + the `#layout`
  transform. (Playwright + Chromium are already installed at the monorepo root.)
- "Overlap" reported by QA was NOT reproduced as a true overlap in headless
  Chrome — each spread has two *nested* `<figure>` elements (the `SpreadFigure`
  wrapper + the authored inner figure) at the same position, which a naive
  `.bber-spread figure` selector double-counts. Confirm in real Chrome; if a true
  overlap exists there it is likely another facet of the verso/recto instability.
- Related: TASK-022/023/024 (timing fixes this builds on), TASK-030 (deep-link).
