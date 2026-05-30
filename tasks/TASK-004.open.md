# TASK-004: Improve monorepo-wide test coverage

**Status:** in progress
**Scope:** monorepo
**Priority:** high

## Description

Test coverage across the monorepo is uneven. Before any large-scale
refactoring — especially the JS→TS migration (TASK-002) — every package
needs enough tests that regressions surface immediately. This is a
high-level tracking task; per-package audit and implementation subtasks
will be opened as children once the coverage landscape is understood.

The goal is not 100% line coverage everywhere. The goal is behavioral
coverage: every meaningful code path that could break during a refactor
must have at least one test that would catch the breakage.

## Subtasks

- [x] Run the current test suite across all packages and capture a baseline.
      Overall: 17.88% statements / 13.96% branches / 18.3% lines (18 May 2026).
      4 test suites failing (all b-ber-reader-react, `window.matchMedia` mock missing).
      Root jest config `collectCoverage: false` — run with `--coverage` to get numbers.

  | Package                           | Src stmts | State                                    |
  | --------------------------------- | --------- | ---------------------------------------- |
  | b-ber-grammar-attributes          | 95%       | real tests                               |
  | b-ber-grammar-media               | 90%       | real tests                               |
  | b-ber-grammar-\* (14 others)      | 0%        | `test.todo` stubs                        |
  | b-ber-parser-\* (all 5)           | 0%        | `test.todo` stubs                        |
  | b-ber-lib/src                     | 56%       | 9 new test files (2026-05-30)            |
  | b-ber-logger/src                  | 0%        | `test.todo` stub                         |
  | b-ber-markdown-renderer/src       | 0%        | `test.todo` stub                         |
  | b-ber-tasks/src (most modules)    | ~15%      | 5 new test files; pipeline steps blocked |
  | b-ber-reader-react/src/models     | 81%       | good                                     |
  | b-ber-reader-react/src/helpers    | 32%       | partial                                  |
  | b-ber-reader-react/src/components | 2%        | nearly none                              |
  | b-ber-reader-react/src/hooks      | 0%        | none                                     |
  | b-ber-reader-react/src/reducers   | 0%        | none                                     |
  | b-ber-validator/src               | 69%       | combinators 100%; report.ts 7%           |
  | b-ber-templates/src               | mixed     | Toc/Xml 100%; Ncx/Opf 0%                 |
  | b-ber-cli/src/commands            | 24%       | shape-only, no handler tests             |
  | b-ber-reader (legacy)             | 0%        | no tests at all                          |
  | b-ber-theme-\*                    | n/a       | SCSS only                                |

- [x] Rank packages by refactoring risk × coverage gap — see table above.
- [x] Open per-package implementation tasks:
  - `b-ber-lib`: packages/b-ber-lib/tasks/TASK-001.open.md
  - `b-ber-tasks`: packages/b-ber-tasks/tasks/TASK-001.open.md
  - `b-ber-reader-react`: packages/b-ber-reader-react/tasks/TASK-018.open.md
  - `b-ber-logger`: packages/b-ber-logger/tasks/TASK-001.open.md
  - `b-ber-markdown-renderer`: packages/b-ber-markdown-renderer/tasks/TASK-001.open.md
  - `b-ber-cli`: packages/b-ber-cli/tasks/TASK-001.open.md
  - `b-ber-templates`: packages/b-ber-templates/tasks/TASK-001.open.md
  - `b-ber-validator`: packages/b-ber-validator/tasks/TASK-001.open.md
  - `b-ber-grammar-audio-video`: packages/b-ber-grammar-audio-video/tasks/TASK-001.open.md
  - `b-ber-grammar-dialogue`: packages/b-ber-grammar-dialogue/tasks/TASK-001.open.md
  - `b-ber-grammar-epigraph`: packages/b-ber-grammar-epigraph/tasks/TASK-001.open.md
  - `b-ber-grammar-footnotes`: packages/b-ber-grammar-footnotes/tasks/TASK-001.open.md
  - `b-ber-grammar-frontmatter`: packages/b-ber-grammar-frontmatter/tasks/TASK-001.open.md
  - `b-ber-grammar-gallery`: packages/b-ber-grammar-gallery/tasks/TASK-001.open.md
  - `b-ber-grammar-iframe`: packages/b-ber-grammar-iframe/tasks/TASK-001.open.md
  - `b-ber-grammar-image`: packages/b-ber-grammar-image/tasks/TASK-001.open.md
  - `b-ber-grammar-logo`: packages/b-ber-grammar-logo/tasks/TASK-001.open.md
  - `b-ber-grammar-pullquote`: packages/b-ber-grammar-pullquote/tasks/TASK-001.open.md
  - `b-ber-grammar-renderer`: packages/b-ber-grammar-renderer/tasks/TASK-001.open.md
  - `b-ber-grammar-section`: packages/b-ber-grammar-section/tasks/TASK-001.open.md
  - `b-ber-grammar-spread`: packages/b-ber-grammar-spread/tasks/TASK-001.open.md
  - `b-ber-grammar-vimeo`: packages/b-ber-grammar-vimeo/tasks/TASK-001.open.md
  - `b-ber-parser-dialogue`: packages/b-ber-parser-dialogue/tasks/TASK-001.open.md
  - `b-ber-parser-figure`: packages/b-ber-parser-figure/tasks/TASK-001.open.md
  - `b-ber-parser-footnotes`: packages/b-ber-parser-footnotes/tasks/TASK-001.open.md
  - `b-ber-parser-gallery`: packages/b-ber-parser-gallery/tasks/TASK-001.open.md
  - `b-ber-parser-section`: packages/b-ber-parser-section/tasks/TASK-001.open.md
- [ ] Once per-package tasks are complete, re-run coverage baseline and
      confirm overall statement coverage ≥ 60% before closing this task.

## Notes

- Agents can write tests quickly. The bottleneck is knowing _what_ to test,
  not writing the code. Spend time on the audit and test specification before
  generating test code.
- For grammar and parser packages, the most valuable tests are input/output
  snapshot tests: feed a Markdown string with a directive in, assert the HTML
  out matches a fixed snapshot. These are cheap to write and catch regressions
  immediately.
- For `b-ber-reader-react`, behavioral tests (user interaction → state change →
  rendered output) are more valuable than shallow render snapshots.
- This task must be substantially complete before the JS→TS migration (TASK-002)
  begins implementation. A package without meaningful tests should not be
  converted to TypeScript — the type-checker alone is not a substitute for
  behavioral tests.
- Coverage tooling: if Jest is already in use, `--coverage` with `c8` or
  `istanbul` is the path of least resistance. Do not introduce a new test
  framework in this task.
