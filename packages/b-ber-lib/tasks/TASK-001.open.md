# TASK-001: Improve test coverage for b-ber-lib

**Status:** in progress
**Scope:** b-ber-lib
**Priority:** high

## Description

`b-ber-lib` is the shared utility layer consumed by every other package in the
build pipeline. It currently sits at ~17% statement coverage. Any untested
function here can silently break across the entire monorepo when refactored.
This task brings the package to meaningful behavioral coverage before the
JS→TS migration (root TASK-002) begins.

## Current state (updated 2026-05-30)

- 11 test files, 133 tests, all passing.
- Statement coverage: **56%** (up from 17% baseline).
- New test files added this session:
  - `url.test.js` — `Url` class (100% coverage)
  - `html.test.js` — `Html` class (100% coverage)
  - `spine-item.test.js` — `SpineItem` constructor + static method (100%)
  - `yaml-adaptor.test.js` — `YamlAdaptor` all methods (100%)
  - `yaml.test.js` — `Yaml` class: load, add, remove, update (65%)
  - `html-to-xml.test.js` — `HtmlToXmlParser` integration + helpers (93%)
  - `guide-item.test.js` — `GuideItem` constructor (100%)
  - `template.test.js` — `Template.render` (100%)
  - `utils.test.js` — pure functions in `src/utils/index.js` (54%)
  - `props.test.js` — rewrote with real filesystem (was all `it.skip`)
- Coverage exclusions removed: `!**/b-ber-lib/*.js` and `!**/b-ber-lib/utils/*.js`
  from root `jest.config.js`
- `mock-fs@4` incompatible with Node 24; switched to real temp files via
  `fs-extra.mkdtemp`. All new tests use real filesystem or pure-function calls.
- `b-ber-logger` calls `process.exit(1)` on `log.error` — mocked with
  `jest.mock('@canopycanopycanopy/b-ber-logger')` in files that test error paths.

## Remaining gaps

| File                            | Coverage | Blocker                                                       |
| ------------------------------- | -------- | ------------------------------------------------------------- |
| `src/Spine.js`                  | 0%       | Constructor requires `toc.yml` + `*.md` files on disk         |
| `src/EbookConvert.js`           | 8%       | Requires Calibre `ebook-convert` binary                       |
| `src/Theme.js`                  | 11%      | Depends on `State` + dynamic `require()` for theme loading    |
| `src/ManifestItemProperties.js` | 71%      | `hasRemoteResources` not yet tested                           |
| `src/State.js`                  | 60%      | Loaded-config paths need `config.yml`/`metadata.yml` on disk  |
| `src/Yaml.js`                   | 65%      | `typeCheck` branches need strict mode + logger mock           |
| `src/utils/index.js`            | 54%      | State-dependent helpers (`getTitle`, `getBookMetadata`, etc.) |

## Subtasks

- [x] Remove or justify the `!**/b-ber-lib/*.js` and `!**/b-ber-lib/utils/*.js`
      exclusions in the root `jest.config.js` — these hide real gaps.
- [x] Un-skip or rewrite the tests in `props.test.js` (`ManifestItemProperties`).
- [x] Add tests for `State.js` (existing `state.test.js` covers core add/remove/merge/update).
- [x] Add tests for `Url.js`.
- [x] Add tests for `Yaml.js` and `YamlAdaptor.js`.
- [x] Add tests for `Html.js` and `HtmlToXml.js`.
- [x] Add tests for `SpineItem.js`, `GuideItem.js`.
- [x] Add tests for `Template.js`.
- [x] Add tests for `src/utils/index.js` utility functions.
- [ ] Add tests for `Spine.js` (requires YAML + markdown fixture files on disk).
- [ ] Improve `State.js` coverage: test `loadConfig` with a real `config.yml`,
      `loadMetadata` with a real `metadata.yml`.
- [ ] Improve `src/utils/index.js`: test state-dependent helpers with a mocked State.
- [ ] Confirm `npm test` passes in this package with coverage ≥ 70% statements.

## Notes

- Do not chase 100% line coverage. Target the public API surface and any
  logic with branches — especially string/path manipulation.
- `State` is the most critical: it is a shared singleton and bugs there
  cause hard-to-reproduce cross-package issues.
- `mock-fs@4` does not work on Node 24; use real temp directories via
  `fs-extra.mkdtemp()` + `fs.remove()` in afterAll for filesystem-dependent tests.
- `b-ber-logger` calls `process.exit(1)` on `log.error`. Mock it with
  `jest.mock('@canopycanopycanopy/b-ber-logger')` in any test that exercises
  an error path.
- See root TASK-004 for overall coverage strategy and prioritization.
