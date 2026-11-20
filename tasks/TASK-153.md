# TASK-153: Raise b-ber-tasks unit coverage

**Epic:** Unit test coverage
**GitHub Issue:** #764 — https://github.com/triplecanopy/b-ber/issues/764
**Scope:** tasks

## Description

b-ber-tasks is the largest package outside the reader (4,009 statements) and
has **13%** statement coverage (measured 2026-11-14, `main`). The epic's target
is 75%. Of its ~25 task directories, 7 have tests (`clean`, `container`,
`copy`, `inject`, `opf`, `serialize`, `helpers`).

The CLI's 100% (TASK-050) does not cover this: the CLI tests mock
b-ber-tasks. TASK-152's golden-output test protects behaviour end to end, but
runs the built CLI in a subprocess, which Jest does not instrument. This task
is the unit layer: fast, and specific about which task broke.

Order by what a refactor touches most and what has no other net:

| Task | Note |
| ---- | ---- |
| `render`, `opf`, `epub`, `reader`, `web` | core of every build |
| `sass` | TASK-051 (#518) covers it, with the theme docs |
| `loi`, `footnotes`, `cover`, `generate`, `init`, `scripts`, `xml` | |
| `serve`, `deploy`, `mobi`, `pdf`, `validate` | external processes; test the logic around them, mock the process |

**Scope narrowed to boundary tests (2026-11-17).** The build pipeline is to be
redesigned next: the `State` singleton, whose getters switch on `state.build`,
gives way to a per-build context passed to each task, and tasks become typed
functions that return their outputs instead of writing them into State. Tests
coupled to today's internals (asserting on `state.figures`, mocking State,
spying on private helpers) would be thrown away by that. So the remaining
tests are boundary tests: build a real temp project, run the task or a short
sequence of tasks, and assert on the files written and the values returned.
Only a process boundary is mocked (child_process, browser-sync, the terminal).
A branch reachable only through internals is left uncovered and listed below,
rather than chasing the percentage.

## Subtasks

- [x] Re-measure per task directory and record it here
- [x] Core tasks first (`render`, `opf`, `epub`, `reader`, `web`)
- [ ] TASK-051 for `sass`
- [x] The rest, to ≥ 75% for the package, as boundary tests
- [x] Find out whether per-build sections of config.yml take effect

## Notes

- Use real temp directories, not `mock-fs` (it does not work on Node 24).
- `b-ber-logger`'s `log.error` reports and returns the error since TASK-046;
  the tests automock the logger and give `log.error` that contract with
  `returnReportedErrors` (`__tests__/helpers/log.js`).
- Related: TASK-152 (golden output), TASK-051 (sass), TASK-046 (logger).

## Findings

### Core tasks (2026-11-15)

Statement coverage under `src/**/*.ts` (3,675 statements; the 4,009 above
included JS):

| Directory | Before | After |
| --------- | ------ | ----- |
| `src/render` | 0% | 100% |
| `src/opf` | 37% | 100% |
| `src/epub` | 0% | 100% |
| `src/reader` | 0% | 82% |
| `src/web` (TS only) | 0% | 100% |
| **b-ber-tasks** | **14%** | **49%** |

`src/reader` stops at 82%: lines 85–123 run only when
`require.resolve('@canopycanopycanopy/b-ber-reader')` fails, which Jest cannot
arrange per test, and lines 267–280 (`updateLinkedResourcesWithAbsolutePaths`)
are dead, their call commented out.

The tests build a real temp project (`__tests__/helpers/project.js`) and point
`State` at it. The reader tests copy `packages/b-ber-reader/dist`, so need a
build first, as other packages' tests already do. `web.test.js` maps `cheerio`
to its slim CommonJS build: under the jsdom environment cheerio resolves to its
browser ESM build, and its Node build needs web streams jsdom lacks.

Defects found, each pinned by a test asserting current behaviour:

- #768 the OPF manifest can omit `toc.ncx` / `toc.xhtml` (a race in
  `Opf.createOpf`)
- #769 the reader build fails for identifiers `createDirname` changes
- #770 writes neither returned nor awaited (render, reader manifest, web)
- #771 the search index is written in completion order (also the OPF
  manifest and `resources`: builds are not reproducible)

Also found: running Jest in the main checkout while an agent worktree exists
under `.claude/worktrees/` fails every suite (duplicate packages in Jest's
module map); `jest.config.js` now ignores `.claude/`. And `State` creating
`_project/` at import races across Jest workers (`EEXIST`), the likely cause of
TASK-128 (#646).

### The remaining tasks, as boundary tests (2026-11-17)

Statement coverage under `src/**/*.ts`, excluding `.d.ts` (3,682
statements). "Before" is `main` at `8b822d7e`, after the core work and the
sass tests.

| Directory | Before | After |
| --------- | ------ | ----- |
| `src/loi` | 0% | 100% |
| `src/footnotes` | 0% | 100% |
| `src/cover` | 0% | 99% |
| `src/scripts` | 0% | 100% |
| `src/xml` | 0% | 97% |
| `src/generate` | 0% | 95% |
| `src/init` | 0% | 100% |
| `src/inject` | 86% | 100% |
| `src/serve` | 0% | 100% |
| `src/deploy` | 0% | 98% |
| `src/mobi` | 0% | 100% |
| `src/pdf` | 0% | 100% |
| `src/validate` | 0% | 95% |
| `index.ts`, `task-handlers.ts`, `src/sample` | 0% | 100% |
| **b-ber-tasks** | **55%** | **98%** |

Each test builds a project with `createProject` (which now takes `dist`, the
config.yml value) and runs the task, often after `render` or `loi`, as the
build sequence does. New helpers in `__tests__/helpers/files.js`: `png(w, h)`
writes the header of a PNG of that size, which is all image-size reads, and
`trackWrites()` waits for the writes `render` does not (#770). The process
boundaries mocked: `child_process` and `command-exists` (ebook-convert for
mobi and pdf; the aws CLI for deploy), `readline` (deploy's prompt),
browser-sync, and, in serve only, `serialize`, which runs a build's whole
sequence and is covered task by task elsewhere. `cover.test.js`,
`deploy.test.js` and `index.test.js` run under `@jest-environment node`:
under jsdom, pureimage loads the cover font over XHR and never finishes, jsdom
lacks `setImmediate`, and cheerio resolves to a browser ESM build.

Left uncovered, and why:

- `cover` 190–191: a JPEG encoding failure, inside pureimage's callback;
  reachable only by breaking pureimage. 275–276: a failure removing an old
  cover or rewriting metadata.yml after the image is made; reachable with a
  read-only metadata.yml, but each run spends 2 s drawing the image.
- `deploy` 80–84: the `error` event, when the shell for `aws` cannot be
  spawned at all.
- `generate` 51–54: unreachable, the duplicate check never matches (defect
  below).
- `validate` 15–16: unreachable, `fs.pathExists` is not awaited (#736).
- `xml` 25, 28: unreachable, spine entries are always strings.
- `reader` stays at 83% for the reasons above.

`serve`'s and `cover`'s tests import the task after setting things up, since
both read State or the working directory when the module loads (the defects
below). deploy's tests import a fresh copy per test, for its import-time
`process.cwd()`.

Defects found, each pinned by a test whose comment starts "Defect" and
asserts current behaviour. None is fixed here. Filed 2026-11-20 as below; the redesign-related ones are tracked on epic #792:

- (#792) **Per-build config sections are ignored.** See below.
- (#792) **cover: `--src` is ignored for metadata.yml.** The path is computed when the
  module is imported (`src/cover/index.ts:56`), before the CLI applies
  `--src`; `bber build --src book` fails at cover with ENOENT for
  `_project/metadata.yml`.
- (#800) **cover hangs without `publisher` or `description`.** A project whose
  metadata.yml lacks either, and lists no cover, throws a TypeError inside
  pureimage's font callback (`src/cover/index.ts:171`, `175`); the task never
  settles and the CLI's uncaught-exception handler exits.
- (#799) **cover corrupts metadata.yml.** Adding the generated cover through
  yawn-yaml rewrites a folded (`>-`) value that has an entry after it onto one
  line and drops the line break before that entry: `About the book.- term:
  identifier`, which no longer parses. `YamlAdaptor.dump` folds any long value,
  so b-ber writes such files itself.
- (#804) **xml fails for figures unless the TOC names `figures-titlepage`.** loi adds
  the title page to `spine.flattened` as a plain object with no
  `absolutePath` (`src/loi/index.ts:52`); xml reads `undefined.xhtml`.
  Related to #757.
- (#792) **SpineItem ignores `dist`.** `absolutePath` is `project-<build>/OPS/...`
  resolved against the working directory (`b-ber-lib/src/SpineItem.ts:68`). With
  `dist: _builds`, as the kitchen-sink fixture has, render writes to
  `_builds-xml/` and xml reads from `project-xml/`.
- (#792) **serve ignores `src` and `dist`.** It serves `project-<build>` and watches
  `_project/**` (`src/serve/index.ts:38`, `71`), the watch paths fixed at
  import.
- (#805) **generate never detects a page already in the TOC.** It compares TOC
  entries with the file name including `.md` (`src/generate/index.ts:47`), so
  a listed page whose file is missing is listed twice.
- (#805) **generate does not wait for the build TOC writes.** The appends to
  `<build>.yml` are collected with `reduce`/`concat` into a new array and the
  original is awaited (`src/generate/index.ts:61`). Same family as #770, not
  part of it.
- (#803) **inject mangles remote assets.** `remote_stylesheets` and
  `remote_javascripts` URLs are joined onto the local directory
  (`src/inject/index.ts:58`, `73`): `../stylesheets/https:/example.com/a.css`.
- (#806) **mobiCSS leaves a selector-less rule.** A rule whose only selectors are
  `epub|` ones is kept with no selector (`src/mobi/mobi-css.ts:52`).
- (#802) **EbookConvert does not quote the input path** (`b-ber-lib/src/EbookConvert.ts:51`):
  mobi and pdf break for a project under a directory with a space in its name.
- (#801) **pdf: a switch set to `false` is turned on** (`src/pdf/index.ts:128`);
  **`embed_all_fonts` and `insert_metadata` are never passed**, listed with a
  trailing space (lines 19, 39); **option values are not shell-quoted**.
- (#796) **validate resolves when files are invalid** (`src/validate/index.ts:41`):
  `bber check` exits 0 on a project with errors. Its missing-project check is
  #736.
- (#797) **b-ber-validator misreads a directive on a file's first line**: a
  correctly closed one fails, an unclosed one passes. Files that begin with
  front matter are not affected.
- (#798) **deploy exits 0 when the aws CLI is missing** (`src/deploy/index.ts:69`),
  from inside the task, and **resolves when an aws command fails** (line 86):
  a failed upload is a successful deploy.
- (#792) **Directives straight after a paragraph line report a duplicate id**
  (b-ber-grammar-section's test pins it): markdown-it calls block rules in
  silent mode to see whether they can interrupt a paragraph, and the parser
  calls `validateOpen` before checking `silent`, so b-ber-grammar-renderer's
  `validateOpen` records the id twice. Affects every directive built with
  `createRenderer` on a parser that does this: `section` (and every block
  type it handles, `chapter` etc.), `dialogue`, `gallery`, `spread`. Not
  `pullquote`/`blockquote` (own `validateOpen`, no side effect) or the
  figure-parser directives (`figure`, `epigraph`, `logo`, `audio`, `video`,
  `vimeo`, `iframe`), whose `validate` only matches.

#### Per-build config sections

**They do not take effect.** `State.loadBuildSettings` copies a build's
section of config.yml (`epub:`, `web:`, ...) into `builds[<build>].config`,
with the comment "gets merged into base config during build step". Nothing
reads it: `build-config.test.js` loads a config.yml with `private: false` and
`epub: { private: true }` the way the CLI does, runs inject, and the epub
pages are marked for indexing.

History: `85baeaa4` (2018-04, "Adds build-type config support", for issues 90
and 91) loaded `config.<build>.yml` and merged it in the build
command; `527998c2` (2018-06) moved it to a `<build>:` key in config.yml;
`6f2dfa3d` (2019-04-04, "Persist config object", #285) deleted the
`state.merge('config', state.buildTypes[build].config)` line from the build
command. It has been loaded and ignored since. No README or doc in the repo
documents the feature. The redesign should either restore it, as an
override in the per-build context, or stop loading it.

Also found:

- `reader.test.js` leaves an empty `project-reader/epub/book-id/` in the
  working directory on every run; git does not show it because it is empty.
- Running a single test file, or two, from the repo root fails at import with
  "Cannot read properties of undefined (reading 'code')": Jest runs them in
  band, `process.argv` is then long enough for `State` to initialise against
  the repo root, and its `throw log.error(...)` throws the automocked
  logger's `undefined`. Run the package directory instead
  (`npx jest packages/b-ber-tasks`).
- `inject.test.js` (which mocks fs and State) is left as it was;
  `inject-project.test.js` covers the task itself.
- The EACCES tests (inject, init) rely on file permissions, so they would
  fail if the suite ran as root.

