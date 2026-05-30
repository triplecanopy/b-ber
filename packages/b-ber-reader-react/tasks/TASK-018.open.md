# TASK-018: Improve test coverage for b-ber-reader-react

**Status:** not started
**Scope:** b-ber-reader-react
**Priority:** high

## Description

The reader is the user-facing application and the most complex package in the
monorepo. Coverage is uneven: models are well-tested (~81%) but components are
at ~2%, hooks at 0%, and reducers at 0%. Four smoke tests currently fail due to
a missing `window.matchMedia` mock. This task improves coverage in the untested
areas and fixes the failing suite before the JS→TS migration begins.

## Current coverage (statement %)

| Path                            | Stmts | Notes                   |
| ------------------------------- | ----- | ----------------------- |
| `src/models`                    | 81%   | good; expand edge cases |
| `src/helpers`                   | 32%   | partial                 |
| `src/lib`                       | 32%   | partial                 |
| `src/constants`                 | 56%   | partial                 |
| `src/components/Navigation`     | 40%   | partial                 |
| `src/components/Media`          | 19%   | sparse                  |
| `src/components/Media/Controls` | 26%   | sparse                  |
| `src/components` (root)         | 2%    | nearly nothing          |
| `src/components/Reader`         | 0%    | untested                |
| `src/components/Sidebar`        | 0%    | untested                |
| `src/hooks`                     | 0%    | untested                |
| `src/reducers`                  | 0%    | untested                |
| `src/actions`                   | 0%    | untested                |

## Subtasks

- [ ] Fix failing smoke tests: add a `window.matchMedia` mock to the Jest
      setup file (or in each affected test's `beforeAll`). The mock should
      return `{ matches: false, addListener: jest.fn(), removeListener: jest.fn() }`.
      Affected suites: `Ultimate.smoke.test.jsx`, `NavigationFooter.smoke.test.jsx`,
      `helpers/store.js`, `helpers/fixtures.js`.
- [ ] Add tests for `src/reducers/`:
  - Each reducer: given an initial state and an action, assert the new state.
  - Cover at least: `viewer-settings`, `navigation`, `book` reducers.
- [ ] Add tests for `src/actions/`:
  - Action creators: assert they return the correct FSA-shaped objects.
- [ ] Add tests for `src/hooks/`:
  - Each custom hook: use `@testing-library/react`'s `renderHook`.
- [ ] Add tests for `src/components/Reader`:
  - At minimum, a render smoke test that asserts the component mounts without
    throwing.
- [ ] Add tests for `src/components/Sidebar`:
  - Render smoke test + key prop-driven behavior.
- [ ] Expand `src/helpers` coverage:
  - `Viewport.js` — the `matchMedia` calls are the current failure source;
    mock and test all public methods.
  - Any helpers not yet tested.
- [ ] Confirm all test suites pass (0 failures) and statement coverage is
      ≥ 50% across the package.

## Notes

- The `window.matchMedia` issue is a missing test environment mock, not a
  code bug. Fix it in the test setup rather than the source.
- Reducers and action creators are pure functions — they are the cheapest
  tests to write and the highest value for the TS migration (they define
  the app's data contract).
- Do not add snapshot tests for complex component trees — they are brittle
  and expensive to maintain. Prefer behavioral assertions (rendered text,
  visible elements, interaction outcomes).
- See TASK-012 (existing) and TASK-013 (existing) for related reader-react
  work that may overlap.
- See root TASK-004 for overall coverage strategy.
