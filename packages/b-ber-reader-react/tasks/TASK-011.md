# TASK-011: Regression/smoke test infrastructure

**Status:** complete
**Phase:** Quality
**Created:** 2026-05-30
**GitHub Issue:** #469 — https://github.com/triplecanopy/b-ber/issues/469

## Description

Add a lightweight smoke test layer so agents can run `npm test` after any change
and catch regressions in the core rendering pipeline without manual browser testing.

## What was built

**New files:**

- `jest.setup.js` — `ResizeObserver` stub + `window.matchMedia` stub (both absent in jsdom)
- `__tests__/helpers/store.js` — `createTestStore(overrides)` factory using the real Redux store
- `__tests__/helpers/fixtures.js` — `makeSpineItem`, `makeTwoChapterSpine`, `defaultUiOptions`, etc.
- `__tests__/components/NavigationFooter.smoke.test.jsx` — 6 tests for nav button show/hide logic
- `__tests__/components/Ultimate.smoke.test.jsx` — 3 tests for stability detection + chapter restart

**Modified files:**

- `jest.config.js` — added `setupFiles: ['./jest.setup.js']` and `testMatch` pattern to exclude helper files from being treated as test suites

## Subtasks

- [x] Add `jest.setup.js` with ResizeObserver and matchMedia stubs
- [x] Update `jest.config.js` with `setupFiles` and `testMatch`
- [x] Create `__tests__/helpers/store.js` (real Redux store factory)
- [x] Create `__tests__/helpers/fixtures.js` (SpineItem and uiOptions fixtures)
- [x] Write `NavigationFooter.smoke.test.jsx` (regression for TASK-002 crash)
- [x] Write `Ultimate.smoke.test.jsx` (stability detection + chapter restart + MAX_WAIT_MS)
- [x] Confirm all 18 test suites pass (60 tests, 0 failures)
- [x] Update `AGENTS.md` with smoke test run command
- [x] Update `PLAN.md`

## Notes

- jsdom's `offsetLeft` always returns 0, which makes Ultimate's stability check resolve
  in exactly 2 ticks (200ms with fake timers). This is deterministic and reliable.
- The `testMatch` pattern (`**/__tests__/**/*.test.{js,jsx}`) excludes
  `__tests__/helpers/*.js` from being collected as test suites.
- `__tests__/helpers/XMLAdaptor.test.js` is grandfathered in (it contains only
  `test.todo` entries — zero real tests — but uses the `.test.js` naming convention).

## Remaining gaps (future tasks)

- No `Reader.smoke.test.jsx` — mounting the full Reader requires mocking all XHR
  calls (OPF, NCX, spine items). This is valuable but significant effort.
- No `Spread.smoke.test.jsx` — depends on DOM layout measurements jsdom cannot provide.
- Cases 2–5 from the original scope (chapter navigation, keyboard nav, spread rendering,
  scroll layout) are not yet covered by automated tests.
