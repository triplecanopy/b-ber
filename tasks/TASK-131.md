# TASK-131: Rework the skipped reader navigation E2E tests

**Epic:** E2E testing
**GitHub Issue:** #684 — https://github.com/triplecanopy/b-ber/issues/684
**Scope:** b-ber-testing

## Description

TASK-130 skipped six reader browser tests that fail on `main`. They are
navigation and edge-case tests, five of which time out at Playwright's 120s test
timeout. They were skipped rather than fixed so the rest of the suite could start
running in CI. While they stay skipped, reader navigation has no browser coverage
at all, which is the main path a reader user takes.

| Spec | Test | Failure on `main` @ `ee8af41c` |
| ---- | ---- | ------------------------------ |
| `navigation.spec.ts` | initial load renders the first spine item | `page.waitForURL` timeout |
| `navigation.spec.ts` | chapter-next button advances to the next spine item | `page.waitForURL` timeout |
| `navigation.spec.ts` | chapter-prev button rewinds to the previous spine item | `page.waitForURL` timeout |
| `navigation.spec.ts` | URL query string updates to reflect spine position after navigation | `page.waitForURL` timeout |
| `navigation.spec.ts` | keyboard right arrow navigates pages within a chapter | `page.waitForFunction` timeout |
| `edge-cases.spec.ts` | chapter-next is absent when navigating to the last chapter via next button | assertion (`toBe`) |

The common thread is URL-driven navigation: four tests wait on `waitForURL` and
never see it change. Two causes are possible, and they lead to different work:

- **The tests rotted.** The reader changed how it encodes position in the URL,
  and the tests still wait for the old shape. Fix the tests.
- **The reader regressed.** Navigation genuinely does not update the URL or
  advance, for example after the TASK-106 state migration
  (Redux → `useSyncExternalStore`). Fix the reader; the tests were right.

Telling these apart is the first job. Do not "fix" a test by loosening it until
the reader's behaviour has been checked by hand.

## Subtasks

- [ ] Reproduce each failure with `npx playwright test --project=chromium --headed`
      and a trace (`--trace on`)
- [ ] For each: decide test rot vs reader regression, checking by hand in the
      dev reader
- [ ] Bisect any genuine regression to its commit (TASK-106 is the first suspect)
- [ ] Fix and un-skip each test individually, removing its `TASK-131` comment
- [ ] Re-check whether 120s is a sensible timeout once nothing hits it

## Notes

- Do not un-skip a test without fixing it. The skip comment in each spec points
  here.
- If the cause is a reader regression, it may need its own task under React 19
  (reader-react) rather than being fixed here.
- Related: TASK-130 (skipped them), TASK-042/043 (wrote them), TASK-106 (state
  migration).
