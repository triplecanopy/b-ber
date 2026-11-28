# TASK-178: Run bber check on the shared parse and thin b-ber-validator to a reporter

**Epic:** Build pipeline & directive redesign
**GitHub Issue:** #841 — https://github.com/triplecanopy/b-ber/issues/841
**Scope:** b-ber-validator, b-ber-tasks, b-ber-cli, b-ber-markdown-renderer

## Description

Plan step 5 of [TASK-161](./TASK-161.md).

`b-ber-validator` stays a separate package, as a thin layer over the shared
parse. Its parser-combinator grammar is deleted: `validator.ts`,
`combinators/` and its own directive name list. What remains is `report` and
a `check(source, fileName)` that runs the shared parse and returns
`env.diagnostics`. One grammar decides what is valid, so the build and
`bber check` cannot disagree (#797).

`bber check --strict` fails on warnings, for CI.

## Subtasks

- [x] `check()` over the shared parse; `report` formats spans per the spec
- [x] Delete the combinators and `validator.ts`; move its tests to the parse's diagnostics
- [x] Flip #797's defect test in `b-ber-tasks/__tests__/validate.test.js`
- [x] `--strict`
- [x] Agreement test: `bber check` and the build report the same diagnostics

## Findings

### The parse entry point: `b-ber-markdown-renderer/parse`

b-ber-validator imports the parse through one module,
`@canopycanopycanopy/b-ber-markdown-renderer/parse` (`src/parse.ts`, built as
`dist/parse.js`, published through a root `parse.js` shim as b-ber-lib's
subpaths are). It exports `parse(source, file) → { diagnostics, tree }`,
`locate`, and the diagnostic types. TASK-179 renames that import to the
consolidated package's `/parse`; nothing else in b-ber-validator names the
renderer.

- **It is the build's own parse**, not a copy of its setup.
  `MarkdownRenderer` takes the directive host as a constructor argument
  (default: `legacyHost()`, so the build is unchanged) and has a `parse`
  method beside `render`, sharing its env defaults. `parse.ts` makes one
  instance with `pureHost`. That is the only difference from the build: a
  duplicate or missing id stays a diagnostic, where the build throws on the
  first. Every other parse-time piece (markdown-it's options, the
  single-line claims, gallery items, front matter, footnotes) is the build's,
  because a hand-made parse-only instance would differ: without the
  single-line claims an `exit` after a `figure` gets "No block is open"
  instead of "is a single-line directive", and without gallery item marking a
  `:::` line inside a gallery item is read as text.
- **It still loads the render half** (the grammar packages, b-ber-lib and so
  State), because the single-line directives' claims and the gallery and
  footnote parse rules live beside their renderers. It exposes nothing that
  renders. TASK-161's requirement that the parse entry load no templates, no
  target features and no State is TASK-179's to meet when it folds those
  packages in.
- **`check` throws where the build's parse throws** on something that is not
  yet a diagnostic: a `figure` with no `source`, and front matter with a
  `type` and no `title` (#735). The validate task lets that fail the check, as
  it fails the build. TASK-161's `missing-attribute` would make the first a
  diagnostic.

### The reporter

`report(source, diagnostic, { color })` moved from b-ber-markdown-renderer
(`formatDiagnostic`) to b-ber-validator, which TASK-161 makes the reporter;
the renderer keeps `locate`. It normalizes `\r\n` itself, so CRLF gives the
same `line:col`, and colours only when asked.

The validate task writes the report to **stdout**, not through the logger:
b-ber-logger trims every line of a message and highlights `[text]`, which
moves the carets off their spans. The summary (`N errors and M warnings in K
files`) and the failure go through the logger. Colour is on when stdout is a
TTY and `--no-color` is not given.

### What `bber check` does now

- One line per diagnostic, as TASK-161 specifies, with each note.
- **Exit 1 on an error** (#796): every file is reported, then the task
  rejects through `log.error`, which b-ber-cli turns into status 1. Warnings
  pass.
- **`--strict`** fails on warnings too.
- **A missing project is reported** (#736, fixed in its own commit while the
  task was being rewritten): the `fs.pathExists` check was never awaited.
- The validate task returns `{ files, errors, warnings }`.

b-ber-validator's public API changed: the default export (`validator`), the
`Parser`/`Context`/`Result` types and `colors` are gone. Only b-ber-tasks
imported it in the repo. The package dropped its dependency on
b-ber-shapes-directives for b-ber-markdown-renderer.

### Tests

- The old grammar's 37 cases (`__mocks__`) are now cases of the parse's
  diagnostics (`__tests__/index.js`), with a comment wherever the verdict
  changed. Most changed: the old grammar failed every unknown attribute word,
  a run of spaces, a caption with no text, a dialogue speaker line not shaped
  `:: name ::`, and every mismatched exit. The parse warns on the
  mismatches and the attribute problems and passes the rest, as the build
  renders them.
- Agreement (TASK-161's test 7, `__tests__/agreement.test.js`): every code
  the parse reports, on line 1, after five paragraphs and after front matter;
  the old cases; and each kitchen-sink file. `check` returns exactly the
  build renderer's diagnostics. Where the build throws (duplicate or missing
  id), `check` reports an error at the line the build's message names. Where
  a case lacks the assets its directives name, the render stops after the
  parse, so the build's side is the build instance's parse.
- Kitchen-sink (test 8): no errors; the only warnings are `deprecated-name`.
- `npm test`: 171 suites, 2014 tests pass. `npm run typecheck` green.
- Golden output: 5 of 5 pass, and the CLI e2e project 32 of 32. Build output is
  unchanged: the renderer change only threads the host through.

### The GitLab corpus, before and after

`bber check` over APFS clones of the 239 projects of TASK-165's differential
(`scratchpad/t178-checkcorpus.js`; the originals were never written to).

| | pass | fail |
| - | - | - |
| Before (exit status) | 238 | 1 |
| Before (printed an error) | 155 | 83 + the 1 that crashed |
| After | 238 | 1 |
| After, `--strict` | 58 | 181 |

- **Before, `bber check` exited 0 on all but one project** (#796), while
  printing "Error in …" for 83 of them, 71 of which build today. The one exit
  1 is `b-ber-template-new`, whose `config.yml` has unfilled template
  placeholders and does not parse; it fails the same way after, and builds no
  target.
- **After, no project has an error.** The 83 pass, and no project that passed
  before fails, so no project that builds today gains an error.
- **Why the 83 changed:** every one was the old grammar rejecting what the
  build accepts. Its expectations, by count: `Space` 87 (a fence with no
  space before the name, `:::subchapter:x`), `End of string` 48 (a misplaced
  caret at the end of front matter, TASK-161's Findings bug 2), `End of line`
  42 (an attribute it could not read, e.g. `classes="titlepage"`, which the
  parse warns is a `stray-word`), `Valid directive name` 12 (two spaces after
  the fence, `:::  exit:x`), and 11 mismatched exits, which are now
  `unmatched-exit` or `crossed-exit` warnings.
- **The warnings after** (all projects): `deprecated-name` 740 in 178
  projects, `draft-name` 138 in 65, `unknown-attribute` 52 in 20,
  `crossed-exit` 17 in 16, `stray-word` 11 in 6, `unmatched-exit` 11 in 10,
  `unclosed-block` 3 in 3, `missing-value` 2 in 2, `unknown-name` 2 in 1,
  `exit-trailing-text` 1. `--strict` fails 181 projects, almost all for
  `subchapter` and the draft names: it is for a project that wants to be
  clean, not a gate the existing books pass.
- Projects that build today but now fail `check`: none.

## Notes

- Design: [TASK-161](./TASK-161.md), "`bber check` uses the same grammar" and "Diagnostics".
- Depends on TASK-175.
- Outside the validator, b-ber-tasks' validate and b-ber-cli's check, this
  touched b-ber-markdown-renderer's `src/index.ts` (the constructor's host
  argument, the exported class, `parse` and the shared env defaults), the new
  `src/parse.ts`, `src/directives/diagnostics.ts` and `index.ts` (the
  reporter removed), `scripts/parse-corpus.js`, and its tests.
