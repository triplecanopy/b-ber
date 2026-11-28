# TASK-164: Define targets with feature flags instead of state.build checks

**Epic:** Build pipeline & directive redesign
**GitHub Issue:** #827 — https://github.com/triplecanopy/b-ber/issues/827
**Scope:** b-ber-tasks, b-ber-templates, grammar packages, b-ber-lib

## Description

Plan step 2 of [TASK-160](./TASK-160.md).

37 places branch on `state.build`. 28 of them are behaviour, and become six
`TargetFeatures` flags plus a figure-template table that each target owns.
The other 9 use the name as an identifier and become `ctx.target.name`.
[TASK-160](./TASK-160.md)'s Findings list every site with file and line.

```ts
interface TargetFeatures {
  liveEmbeds: boolean              // web, reader
  fullbleedContainers: boolean     // web, reader
  figuresOn: 'page' | 'titlepage'  // reader: 'titlepage'
  readerRuntime: boolean           // reader
  nonLinearSpine: boolean          // false for mobi
  coverPage: boolean               // false for pdf
}
```

Render code branches on features, never on the name. A check fails on a
`target.name` comparison in grammar, parser or template code. pdf, sample
and xml name the epub figure templates explicitly, ending today's silent
fallback.

## Subtasks

- [x] `Target` definitions for the seven targets, with `features` and `figureTemplates`
- [x] Replace the 28 behaviour branches, one group per commit, with no output change
- [x] The check against `target.name` comparisons in render code
- [x] Fix `SpineItem.absolutePath`'s hardcoded `project-<build>` (#757), which also fixes `bber build xml` (#766)
- [x] Fix serve's `src`/`dist`; flip TASK-153's defect tests

## Notes

- Design: [TASK-160](./TASK-160.md), "The pieces", "What a target exposes to a project", and
  Findings, "every `state.build` branch, grouped".
- Depends on TASK-163.

## Findings

### 2026-11-27: how it was done

**The targets** are in `b-ber-lib/src/Target.ts`. `BuildContext.target` is a
`Target` now, not its name, and render code reads it as `state.target`, which
the shim routes to the context. Outside a build it is the target of
`state.build`, so the unit tests that set `state.build` keep working.
`state.build` still gives the name, for the nine places that use it as an
identifier. Those move to `ctx.target.name` when TASK-165 passes the context
to the tasks.

**`figureTemplates` names a table, `'epub' | 'mobi' | 'reader' | 'web'`,
rather than holding it** as the design's sketch had. b-ber-templates depends on
b-ber-lib, so lib can't import the tables. `figure(data, target)` takes the
target and looks the table up; there is no fallback.

**The branches**, one commit per feature: `liveEmbeds` (9 sites),
`fullbleedContainers` (4), `figuresOn` (5), `readerRuntime` (3), the figure
template table (4), `nonLinearSpine` (1), `coverPage` (2). The two
`supported(build)` helpers in grammar-iframe and grammar-vimeo are gone, and
`ensureSupportedClassNames` no longer takes one. `__tests__/target.test.js`
pins each feature to the set of targets TASK-160's inventory found for it.

**The check** is `scripts/check-target-names.js`, run as `npm run
check:targets` in `npm test`. It reads the grammar, parser, renderer and
template packages' `src` and fails on `===`/`!==`/`==`/`!=` with a target name,
or with `build`, `buildType`, `target.name` or `env`, and on a `switch` or
`case` on one. It allows using the name as a value: grammar-media's key into
media.yml, a log message. `src/Project/` in b-ber-templates is exempt: it is
the `application.js` that `bber new` scaffolds, which branches on
`window.bber.env` on purpose. Run over `main`'s sources it finds all 21
comparison lines in render code; the `supported(state.build)` calls are
caught where `supported` compares.

**#757 and #766.** `SpineItem` and `Spine` take the build's `dist` directory
instead of a build name, so `absolutePath` is `<dist>-<target>/OPS/…`, not
`project-<target>/OPS/…`. `bber build xml` works on kitchen-sink
(`dist: _builds`), and xml joins the golden test. Its document, which it
writes to the project root, is compared under `xml/_root/`.

**The LOI title page, an intended output change.** When the navigation file
does not list `figures-titlepage`, loi adds it. The flat spine got a plain
object with no `linear` and no `absolutePath`, so:
- the OPF marked the page `linear="no"`, where a listed one is `yes`;
- the web build dropped it from the reading order (it keeps `linear` items);
- the xml build read `undefined.xhtml` and failed.

It now gets the `SpineItem` a listing would, in both spine lists. No GitLab
project with figure pages leaves the page out of its navigation (15 have
figure pages, all list it, and so do their per-target files). Kitchen-sink's
`toc.yml` and `web.yml` do, so the golden snapshot changes in that commit:
sample's OPF marks the page linear, and web links it between the colophon and
the first figure, with a search index and manifest entry.

**`serve`** serves `state.distDir` and watches `state.srcDir`, worked out
after it sets the build. It used to serve `project-<build>` and watch
`_project/`, fixed when the module was imported. `serve` still runs outside a
`BuildContext`; TASK-165 gives it one.

### 2026-11-27: verification

- `npm test`: 172 suites, 1,830 tests. `typecheck` passes for 32 projects.
- Playwright, every project: 51 passed, 7 skipped (TASK-131's six, and Vimeo
  under `NO_NETWORK`). The golden test passes for epub, web, reader, sample and
  xml, after the one intended change above.
- **A differential run** (a scratch harness, not committed) rendered every
  Markdown file of the GitLab projects for all seven targets, 17,423 renders,
  once with `main`'s build and once with this branch's, and wrote each
  figure's page from `state.figures` through the figure templates (1,761
  pages). Every render was identical: the XHTML (footnote ids normalized), the
  figure pages, the 676 errors thrown, the 8,614 warnings and errors logged,
  and the ids left in `state.cursor`. As a check that the harness sees the
  target, the same files' output differs from epub's in 596 files for mobi
  and 547 for reader.
- **Not covered by that run:** the OPF spine (`nonLinearSpine`) and the cover
  (`coverPage`), which are not rendered from Markdown. Their unit tests cover
  them, and the golden test covers epub's and sample's OPFs.

### 2026-11-27: left for later tasks

- `state.build` is still read by name in the tasks: `sass` (`$build`),
  `inject` (`window.bber.env`), `clean`, `opf/Navigation` (`<target>.yml`)
  and the Spine template's log message. TASK-165 makes them
  `ctx.target.name`.
- A top-level `xml` command is still commented out of
  `b-ber-cli/src/commands/index.ts`. `bber build xml`, which works now, is the
  way in. Not changed here.

