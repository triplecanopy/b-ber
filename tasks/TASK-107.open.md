# TASK-107: Restore spreadIndex from the URL on initial load (refresh)

**Status:** in progress (fix + unit tests done; browser QA pending)
**Feature:** React 19 (reader-react)
**Phase:** Bug Fixes
**Priority:** low
**Model:** Sonnet 4.6 — small, localized change, but it touches the
load/measurement sequence, so verify against `SPREAD-CLUSTER-QA.md`.

> Read [`MIGRATION-CONVENTIONS.md`](../packages/b-ber-reader-react/MIGRATION-CONVENTIONS.md)
> §1 (verification gate) and §5 (don't touch the spread/sentinel polling).

## Description

On a fresh load / refresh, the reader navigates to the correct chapter but
always lands on **spread 0**, ignoring the `spreadIndex` query param. Repro:
be on `?currentSpineItemIndex=8&spreadIndex=2&slug=text-4`, refresh → end up on
`?currentSpineItemIndex=8&spreadIndex=0&slug=text-4` (the 0 then gets written
back into the URL).

This is **pre-existing**, not a TASK-106 regression: the initialization callback
in `src/components/Reader/index.tsx` (`createStateFromOPF(() => …)`) reads
`currentSpineItemIndex` from the location params but hardcodes
`const spreadIndex = 0`, so the chapter loads at the first spread regardless of
the URL. Surfaced during TASK-106 browser QA (2026-06-15).

## Why it's not trivial

The chapter's spreads aren't measured at init time (`lastSpreadIndex` is still
its pre-measure default), and `getTranslateX`/Layout need the measured geometry
to position a non-zero spread. Naively setting `spreadIndex` from the URL at init
may navigate before the layout has settled (the exact class of bug TASK-101
guarded against). The fix likely needs to defer the spread navigation until the
first stability signal (`view.loaded`), similar to the existing
backward-chapter `lastSpreadIndex` effect.

## Subtasks

- [x] Read the target `spreadIndex` from the location params in the init
      callback (instead of hardcoding 0). Stashed in `initialSpreadIndexRef`
      (only when `> 0` and finite); the chapter still loads at spread 0.
- [x] Defer navigating to that spread until the chapter has loaded/settled so it
      doesn't fire against an unmeasured layout. New effect keyed on
      `[view.loaded, view.lastSpreadIndex]` (mirrors the backward-chapter
      restore, mutually exclusive with it since `chapterDelta` is 0 at init);
      clamps to `[0, lastSpreadIndex]`; runs once (ref cleared on consume).
- [x] Confirm the URL is not rewritten to `spreadIndex=0` on load. **Note:** the
      load still writes a transient `spreadIndex=0` to the URL during the initial
      `loadSpineItem` → `updateQueryString`; the restore then writes the correct
      spread on settle, so the **final** URL preserves the spread. Eliminating
      the transient would require navigating before measurement (the TASK-101
      footgun), so the deferred approach is deliberate — verify the end state in
      browser QA.
- [x] `npm test` green + 9 snapshots unchanged; `tsc --noEmit` clean. Added 3
      unit tests (restore, clamp-to-range, no-op at spread 0) in
      `__tests__/components/Reader/index.test.jsx`.
- [ ] Browser QA: deep-link + refresh on a multi-spread chapter restores the
      exact spread; verso/recto and page-turn timing unaffected
      (`SPREAD-CLUSTER-QA.md`)

## Notes

- Related: [[TASK-101]] (load race / premature nav), [[TASK-106]] (state
  migration — surfaced this during QA).
