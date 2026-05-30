# TASK-001: Improve test coverage for b-ber-lib

**Status:** not started
**Scope:** b-ber-lib
**Priority:** high

## Description

`b-ber-lib` is the shared utility layer consumed by every other package in the
build pipeline. It currently sits at ~17% statement coverage. Any untested
function here can silently break across the entire monorepo when refactored.
This task brings the package to meaningful behavioral coverage before the
JS→TS migration (root TASK-002) begins.

## Current state

- `state.test.js` — has real tests for `State.add`, `State.remove`, basic
  singleton behavior. Covers roughly what it covers but misses many state
  methods.
- `props.test.js` — all tests are `it.skip` with `it.todo` entries; the file
  covers `ManifestItemProperties` which is entirely untested in practice.
- `src/utils/` — explicitly excluded from coverage in the root jest config.
  These utility functions need tests; re-evaluate the exclusion.
- No tests at all for: `Config.js`, `Html.js`, `HtmlToXml.js`, `Spine.js`,
  `SpineItem.js`, `Template.js`, `Theme.js`, `Url.js`, `Yaml.js`,
  `YamlAdaptor.js`, `GuideItem.js`, `EbookConvert.js`.

## Subtasks

- [ ] Remove or justify the `!**/b-ber-lib/*.js` and `!**/b-ber-lib/utils/*.js`
      exclusions in the root `jest.config.js` — these hide real gaps.
- [ ] Un-skip or rewrite the tests in `props.test.js` (`ManifestItemProperties`).
- [ ] Add tests for `State.js`:
  - All public methods (add, remove, reset, update, merge)
  - Singleton behavior (multiple imports return same instance)
  - Error paths (invalid key names, type mismatches)
- [ ] Add tests for `Url.js` (URL parsing / normalization utilities).
- [ ] Add tests for `Yaml.js` and `YamlAdaptor.js` (YAML parse / serialize).
- [ ] Add tests for `Html.js` and `HtmlToXml.js` (HTML string manipulation).
- [ ] Add tests for `Spine.js` and `SpineItem.js` (spine/manifest data
      structures — currently mocked out everywhere, which hides real behavior).
- [ ] Add tests for `Template.js` (template string utilities if any).
- [ ] Add tests for `src/utils/index.js` utility functions.
- [ ] Confirm `npm test` passes in this package with coverage ≥ 70% statements.

## Notes

- Do not chase 100% line coverage. Target the public API surface and any
  logic with branches — especially string/path manipulation, which tends to
  have subtle edge cases.
- `State` is the most critical: it is a shared singleton and bugs there
  cause hard-to-reproduce cross-package issues.
- The `mock-fs` pattern in the existing state test is the right approach for
  tests that need a file system.
- See root TASK-004 for overall coverage strategy and prioritization.
