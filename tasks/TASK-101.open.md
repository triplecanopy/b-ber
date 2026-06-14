# TASK-101: Fix premature page-nav skipping to the next chapter (load race)

**Status:** not started
**Feature:** React 19 (reader-react)
**Phase:** Bug Fixes
**Priority:** high
**Model:** Sonnet 4.6 — the fix is a small guard, but it touches the
spinner/measurement timing, so verify against `SPREAD-CLUSTER-QA.md`. Escalate to
Opus only if the minimal guard proves insufficient.

> Read [`MIGRATION-CONVENTIONS.md`](../packages/b-ber-reader-react/MIGRATION-CONVENTIONS.md)
> §1 (verification gate) and §5 (don't touch the spread/sentinel polling). This is
> a sibling of the TASK-081–089 spread cluster.

## Description

When a chapter first loads, pressing **→** (or clicking next-page) before the
layout has finished measuring jumps to the **next chapter** instead of the next
page. Reproduced manually; the unit suite does not catch it (it's a timing race
between two async pipelines).

### Root cause

Two independent, unsynchronized pipelines re-enable navigation after a load:

1. **`Ultimate`** (`src/components/Ultimate.tsx` `onStable`) polls `offsetLeft`,
   and once stable dispatches `view.load()` **and**
   `userInterface.update({ handleEvents: true, spinnerVisible: false })` together
   — this is what unlocks input.
2. **`with-last-spread-index`** measures content (MutationObserver + 100ms
   debounce) and dispatches `updateLastSpreadIndex(...)` on its **own** schedule.
   `freeze()` resets `lastSpreadIndex` to `-1` at the start of every load.

There is no ordering guarantee between "`handleEvents` becomes `true`" and
"`lastSpreadIndex` is correct." In the window where input is unlocked but
`lastSpreadIndex` is still `-1` (or a transient value), `handlePageNavigation`
(`src/components/Reader/navigation.ts`) hits:

```ts
if (nextIndex > lastSpreadIndex || nextIndex < 0) { // 1 > -1 → true
  this.handleChapterNavigation(sign)                // → jumps chapters
}
```

so the first key press routes to chapter navigation.

## Subtasks

- [ ] Guard `handlePageNavigation` (in `useNavigation`): when
      `lastSpreadIndex < 0` (chapter not yet measured), **ignore the page-forward**
      (return) rather than routing to `handleChapterNavigation`. Confirm the
      backward (`nextIndex < 0`) path is unaffected on a measured chapter.
- [ ] Add a unit test in `navigation.test.js` covering the unmeasured
      (`lastSpreadIndex === -1`) case — asserts neither chapter-nav nor a spread
      change fires.
- [ ] 9 snapshots unchanged; 458+ tests pass; `tsc --noEmit` clean
- [ ] **Browser QA**: load a multi-spread chapter, hammer **→** immediately on
      load — must advance pages, not skip the chapter. Re-run the relevant
      `SPREAD-CLUSTER-QA.md` rows (TASK-082 spinner, TASK-083 page count) to
      confirm no regression.
- [ ] Commit; update `PLAN.md`; remove `.open`

## Notes

- Preferred fix is the single guard (option 1). Two alternatives, less preferred:
  (2) couple the signals so `Ultimate.onStable` withholds `handleEvents: true`
  until `lastSpreadIndex > -1` — more invasive, touches the spinner sequence
  (risky); (3) also gate the forward-past-last branch on `view.loaded`.
- Do **not** restructure the `Ultimate` poll or `with-last-spread-index`
  measurement here — those are the deferred sentinel/spread surface (§5). This
  task only adds a defensive guard at the navigation boundary.
- Related: [[TASK-082]] (stability detection), [[TASK-083]] (lastSpreadIndex
  re-measure), [[TASK-085]] (resize spinner).
