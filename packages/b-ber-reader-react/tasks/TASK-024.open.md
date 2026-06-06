# TASK-024: Re-measure lastSpreadIndex after the layout settles

**Status:** in progress
**Phase:** Bug Fixes
**Priority:** medium
**Created:** 2026-06-06

## Description

`withLastSpreadIndex` computes `lastSpreadIndex` (the chapter's page count, used
by the nav controls and backward navigation) from the content's `scrollHeight`.
See `READER_BUGS.md` (BUG 3, and BUG 6 for the Firefox/Edge facet).

### Root cause (BUG 3 / BUG 6)

1. **Timing.** Measurement was triggered only by a `MutationObserver` +
   `ResizeObserver` with a 100ms debounce — not gated on the layout-settled
   signal — so it could fire while columns were still reflowing.
2. **Stale inputs.** Each `Spread` contributes `frameHeight × multiplier` to the
   linear content height; a spread whose multiplier was wrong (BUG 1) threw the
   measured `scrollHeight` off by a whole column, so the page count rounded to
   one too many (blank trailing page) or one too few (unreachable last spread).
3. **Firefox/Windows-Edge (BUG 6).** That branch measures the sentinel's
   `offsetLeft`, but the observers are attached to `#content`; the sentinel's
   `offsetLeft` settling is neither a `#content` mutation nor a resize, so it was
   read once mid-reflow and never re-measured.

### Fix implemented

- Added a settle-driven re-measurement: a `measureRef` always points at the
  latest measure function, and a new effect calls it when `view.loaded` /
  `view.ultimateOffsetLeft` changes — capturing the final, post-reflow content
  size. This also re-measures the Firefox/Edge `offsetLeft` path (improves
  BUG 6).

## Subtasks

- [x] Re-measure content dimensions on the layout-settled signal
- [x] Confirm the Firefox/Edge path is also re-measured
- [x] `npm test` passes
- [ ] Verify in browser: navigate to the last spread of multi-spread chapters
      (no blank trailing page, last spread reachable). Good projects: the
      `i29-*` / `i30-*` issue projects
- [ ] Commit and update `PLAN.md`; remove `.open`

## Notes

- Depends on TASK-023 (the settle signal must be trustworthy) and is
  complementary to TASK-022 (correct spread multipliers feed correct heights).
- BUG 6's UA-sniffing (`browser.name === 'firefox' | 'edge'`) remains; replacing
  it with a behavior probe is out of scope here.
- Files changed: `src/lib/with-last-spread-index.jsx`.
