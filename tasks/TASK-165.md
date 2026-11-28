# TASK-165: Migrate build tasks to typed functions of the build context

**Epic:** Build pipeline & directive redesign
**GitHub Issue:** #828 — https://github.com/triplecanopy/b-ber/issues/828
**Scope:** b-ber-tasks, b-ber-shapes-sequences

## Description

Plan step 3 of [TASK-160](./TASK-160.md).

Tasks pass data to each other by writing lodash path strings into `State`.
Each becomes `(ctx, inputs) → outputs`, and a target's `build` is a plain
async function that reads top to bottom. `step(ctx, name, fn)` replaces
`serialize`, and emits the logger's start and stop events.

Migrate in data-flow order: render → loi → footnotes → opf → the packagers,
then the rest. Each migrated task stops importing `State`.

The task singletons hold state across `await`s, so they would leak between
concurrent targets: `cover`, `container`, `footnotes` and `generate`, created
at import time, and `web`'s module-level `let`s. They become plain functions
here. That is what makes TASK-166's fan-out safe.

## Subtasks

- [x] render, loi, footnotes and opf return their outputs, one commit each
- [x] The packagers (epub, mobi, pdf, web, reader, sample, xml)
- [x] The rest (clean, container, cover, sass, copy, scripts, inject)
- [x] No task singleton or module-level mutable state left in `b-ber-tasks`
- [x] Remove `serialize` and the sequences in `b-ber-shapes-sequences` (the package, which held nothing else)
- [x] Golden output unchanged at every commit (one known flake, #768; see Findings)
- [x] The task bugs under #792 fixed after their tasks' migration: #770, #769, #801, #806, #743, #802

## Notes

- Design: [TASK-160](./TASK-160.md), "The pieces", and Findings, "spike", conclusion 4.
- Depends on TASK-163 and TASK-164. TASK-166 needs it complete.

## Findings

### 2026-11-28: how it was done

**The target builds** are in `b-ber-tasks/src/targets.ts`: one async
function per target, which runs its steps top to bottom and passes what one
step returns to the next. `step(ctx, name, fn)` (`src/step.ts`) emits the
logger's `start` and `stop` events around one step; `build(ctx)` reports a
failure once and emits `done` with what the logger's summary prints. The
steps stay serial, as `serialize` ran them; running the asset steps together
is TASK-166's to decide, because it changes the log's order.

```
render(ctx, { spine })                → { figures, footnotes, guide, remoteAssets }
loi(ctx, { figures, spine })          → { pages, guide }
footnotes(ctx, { footnotes, spine })  → the notes page, or nothing
opf(ctx, { spine, toc, guide, loi, remoteAssets })
web(ctx, { spine, loi, toc }), xml(ctx, { spine, loi }), the other packagers (ctx)
```

- **Every build task takes the context and none imports `State`.** They
  read paths, metadata, the theme, the hash and b-ber-lib's version through
  `src/context.ts`. The library code they call (b-ber-lib's utils, the
  templates, the grammars) still reads `State`, which the shim routes to the
  same context; that is TASK-173's.
- **The spine stays the context's** (`ctx.settings.spine`), passed in as an
  input. loi and footnotes extend it, and opf moves the generated pages to its
  end, in place, because b-ber-lib's `generateWebpubManifest`, `getTitle` and
  b-ber-grammar-footnotes read it through `State`, and web reads the order opf
  left. loi and footnotes give it new lists, as `state.add` did, so the `toc`
  the build captured keeps leaving out an auto-added figures titlepage.
- **Nothing else is written back.** The guide, the figure pages and the
  remote assets go from render and loi to opf, web and xml as arguments.
  b-ber-templates' `Spine.items` takes the figure pages as an argument rather
  than reading `state.loi`, so `state.loi` and `state.guide` are no longer
  filled at all.
- **render still collects through `State`.** The grammar plugins add their
  figures, footnotes and guide entries to State, which is the context in a
  build; render reads them back from `ctx.settings` once every document has
  rendered, and returns them. TASK-177's renderer returns them per document,
  so the merge replaces `collected(ctx)` with its results.
- **No singletons or module-level state.** `cover`, `container`, `footnotes`
  and `generate` are plain functions. cover's fields are one object per run.
  web's module-level `let`s are one object per build, passed to each of its
  functions. reader is a chain of functions, not a class whose constructor
  returned the task's promise. serve creates its server, and the reload that
  closes over it, per call. What is left at module level is constant.
- **`serialize`, `task-handlers.ts` and b-ber-shapes-sequences are gone.**
  The package held only the lists and `createBuildSequence`. b-ber-cli,
  b-ber-lib (which never imported it) and b-ber-tasks drop it, and the root
  `tsconfig.json`, `jest.config.js`, `biome.json`, CircleCI and the docs stop
  naming it. The logger still needs each target's step names up front, to
  count progress, so each target lists them (`targetSteps`), and
  `__tests__/targets.test.js` checks they match what its build runs.
- **The CLI.** `bber build` runs `build(ctx)` through `runBuild` and keeps the
  user's order of formats. `bber opf` and `bber cover` run their task in the
  epub build's context (`src/lib/context.ts`, `inBuildContext`), and the
  unregistered `xml` command in the xml build's. They read State outside a
  build before, where `build` defaulted to epub, so the context is the one
  they had.
- **serve** builds in a new context each time it rebuilds. It rebuilt in the
  one State, emptying only the footnotes, so the figures and the spine's
  additions piled up from one rebuild to the next.

**Behaviour that changed, with no GitLab project affected:**
- sass's `autoprefixer_options` and scripts' `uglify_options` are read from
  the build's config when the task runs. They were read from State at import,
  so a target's section of `config.yml` and the command line could not change
  them (TASK-162's audit bug 4, which TASK-180 was to fix). No GitLab project
  has a target section.
- cover reads the metadata it draws when it runs, not at import, so
  `--src` draws it from the right `metadata.yml` (TASK-163's "left for later").

**Not migrated, on purpose:** `init`, `generate` and `validate` are commands,
not build steps. They run outside a build and still read State. `deploy`
never did.

### 2026-11-28: the bugs fixed, each after its task's migration

| Issue | Fix | Test |
| ----- | --- | ---- |
| #770 | render returns each page's write, reader returns `manifest.json`'s, and web returns after rejecting | render's and reader's defect tests flipped; a failed write now rejects |
| #769 | reader names the book directory once per build, and books.json, the manifest scan and `bookURL` all use it | the `urn:uuid:` defect test flipped; a missing identifier's random name is the same everywhere |
| #801 | pdf passes a switch only when it is `true`, matches `embed_all_fonts` and `insert_metadata`, and single-quotes values | the three defect tests flipped |
| #806 | mobiCSS removes a rule whose selectors were all `epub\|` | the defect test flipped. The first version also removed `@page` rules, which parse with no selectors; the differential run caught it in nearly every project's mobi stylesheet (b-ber-theme-serif's `@page`), and a follow-up commit keeps them, with a test |
| #743 | the serve task prints `Serving [b-ber-<build>]` once it has the default | in serve's tests and the command's |
| #802 | b-ber-lib's EbookConvert quotes the input path | mobi's defect test flipped |

No GitLab project sets `pdf_options`, and no project's theme CSS has a rule
of `epub|` selectors only, so #801 and #806 change none of their output.
One project's identifier has a character outside `[0-9a-zA-Z-]`
(`bber-threems-boiler-test_CEXPPPEA`, `bberproject_bber-threems-boiler-test`):
its reader build failed with ENOENT and now builds (#769).

### 2026-11-28: verification

**At every commit:** `npm run build`, `npm run typecheck` (31 projects
once b-ber-shapes-sequences is gone), `npm test` and the golden test.

- `npm test` went from 172 suites and 1,856 tests to 170 and 1,872: serialize's
  and b-ber-shapes-sequences' tests went with them; targets, opf, render,
  loi, footnotes, reader and the CLI gained some.
- **The golden test passed unchanged at every commit, with one flake.**
  It is #768: opf scans OPS for its manifest while it writes `toc.ncx` and
  `toc.xhtml`, so under load the manifest can leave them out. It failed that
  way at `525b81f3` too, 2 runs in 6 while the differential runs loaded the
  machine. Every failure was that line, and a rerun passed.

**The differential run**, at the CLI, not the renderer. TASK-164's and
TASK-175's runs rendered Markdown; this task changes what happens around
rendering, so a scratch harness (not committed) built every GitLab project
with a `src/_markdown` (239) for all seven targets, one `bber build <target>
--no-compile` after another in an APFS clone of the project, so the
read-only originals were never touched: 1,673 builds a run. It recorded each
build's exit code, its log, and a hash of every file in the project
afterwards, normalized like the golden test (random ids, timestamps, the
generated cover's name, the manifest's order). mobi and pdf ran up to
ebook-convert, which `--no-compile` skips.

**The baseline is not deterministic,** so it was run several times and a
value counts as unchanged when any baseline run produced it. Two runs of
`525b81f3` differed in 136 builds, all from four races:
- render's unwaited writes (#770): the last page rendered, and so
  content.opf, could be read before it was written;
- #768's manifest race;
- opf appending missing pages to `toc.yml` and the `<target>.yml` files with
  concurrent `appendFile`s, whose order varies;
- copy's three directory copies, which log their large-file warnings in
  whichever order they finish.

**Results:**

| Run | Differs from the baseline |
| --- | ------------------------- |
| after the target builds (`566e613e`) | only those races |
| after opf (`019f4bf0`) | only those races |
| after the rest (`5429e46a`) | those races, and one failing project (below) |
| after #770 (`fd10404b`) | the navigation-file append order and copy's log order, and the failing project. Two runs of this commit differ from each other in the same 34 builds: the render and manifest races are gone |
| final (`28099990`) | the navigation-file append order, the failing project, and #769's project, whose reader build now succeeds. Against `fd10404b`'s two runs, nothing else |

**One output change, in a build that already fails.**
`bber-theems-gen-test_ZUYAXHYK`'s `metadata.yml` does not parse
(`%PROJECT_TITLE%`). It failed at startup, when the cover module's instance
read the metadata at import. It now fails at the cover step, after clean and
container have written `mimetype` and `META-INF/container.xml`. The error and
the exit code are the same. Recorded as an output change; the project is
read-only test input.

### 2026-11-28: for the merge with TASK-177

- **render/index.ts is where they meet.** TASK-177 (PR #864) adds
  `documentInput` and `collect`, which write `renderDocument`'s results back
  into State, and a `createFootnoteNumbering()` per render. Here render takes
  `(ctx, { spine })`, reads the paths from the context, and returns
  `collected(ctx)` from `ctx.settings`. Merged, `collect` should append each
  document's results to render's return value (or to `ctx.settings`, for the
  grammar code that still reads State), and `documentInput` should read the
  target and paths from `ctx`.
- #770's fix is in render's write: `writeMarkupToFile` returns the write.
- Footnote numbering stays book-wide; nothing here touches it.

### 2026-11-28: left for later tasks

- `init`, `generate` and `validate` read State; they go with TASK-173.
- `step` does not tag the logger's events with the target yet: TASK-167.
- The races above that are not #770: #768 (opf's manifest) and the
  concurrent appends to the navigation files, which TASK-171's `bber toc`
  replaces. Both are why a differential needs several baseline runs.
- b-ber-lib's `BuildContext` still has a `sequence` field and State routes
  it; nothing reads or writes it now.
- `npm run check:circular` reports two cycles in b-ber-lib
  (BuildContext → Project → State), from TASK-163, not this task.
