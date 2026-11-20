# TASK-160: Design the build pipeline: BuildContext, targets, parallel builds

**Epic:** Build pipeline & directive redesign
**GitHub Issue:** #808 — https://github.com/triplecanopy/b-ber/issues/808
**Scope:** tasks, lib, cli

## Description

This is a design task. Its output is this document, agreed and refined.
Implementation follows in tasks filed from the Plan section. The epic (#792)
holds the sequencing; this document holds the design.

### How a build runs today

1. `b-ber-cli/src/index.ts` configures the logger, then imports `app.ts`
   dynamically. It has to wait because importing anything that touches
   `b-ber-lib/State` reads the project from disk.
2. **`State` is a module singleton** (`export default new State()`). Its
   constructor reads `config.yml`, `metadata.yml`, `media.yml`, `_media/` and
   the theme, and builds a `BuildSettings` object for **every** build type up
   front. Whether it does any of that is decided by checking `process.argv`
   for `new`, `--help` or `-v`.
3. `bber build` picks formats from argv. For each one, in turn, it does
   `state.reset()` → `state.update('build', name)` → applies CLI config
   overrides → `serialize(sequences[name])`.
4. `serialize` turns a list of task names into a promise chain, looking each
   name up in `task-handlers.ts`.
5. **Every format re-runs the same 11-step prefix** (`clean, container,
   cover, sass, copy, scripts, render, loi, footnotes, inject, opf`) before
   its last step. `bber build` therefore parses all Markdown seven times.
6. **The "current build" is one global string.** The getters `state.spine`,
   `state.figures`, `state.dist.*` and the rest read `builds[state.build]`.
   About 30 call sites in grammar packages, templates, `lib/utils` and tasks
   branch on `state.build === 'reader'` and similar.

### What tasks read and write through State

Every task also uses the `state.src.*` / `state.dist.*` path helpers.

| Task | Reads | Writes |
| ---- | ----- | ------ |
| clean | build | |
| cover | build, metadata, version | `metadata.yml` and `_images/` in the **source** tree |
| sass | build, config, hash, theme | |
| copy, scripts | config | |
| render | (through the grammar plugins) | figures, footnotes, guide, cursor, remoteAssets, spine.frontMatter |
| loi | build, figures, loi, spine | guide, loi, spine.entries, spine.flattened |
| footnotes | build, footnotes | spine.flattened |
| inject | build, config | |
| opf | build, config, guide, metadata, remoteAssets, spine, version | |
| web | config, metadata, spine | |
| reader | config, metadata | |
| pdf | config | |
| xml | loi, spine | |

The data flow between tasks (render → loi → footnotes → opf) exists only as
writes to lodash path strings on a shared object.

### Problems this design fixes

- **Per-build config is ignored.** The `epub:`/`web:` sections of
  `config.yml` are loaded into `builds[x].config` and never merged, ever since
  `6f2dfa3d` (2019). Pinned in TASK-153 (`build-config.test.js`).
- **Paths fixed at import time or hardcoded.** `cover` ignores `--src` for
  `metadata.yml`. `SpineItem.absolutePath` hardcodes `project-<build>`.
  `serve` ignores `src` and `dist`. All pinned in TASK-153.
- **No isolation.** Builds cannot run in parallel, and `serve` also changes
  `state.build`.
- **Import-time I/O.** It makes the CLI's startup order fragile and tests
  awkward. TASK-153 found that running a single test file from the repo root
  fails because `State` initialises against the root.

## Design

### Prior art

| Project | What we take from it |
| ------- | -------------------- |
| Rollup / Vite | One build graph, several `output` configs: `bundle.generate(output)` per format. The shared phase and the per-output phase have separate hooks. This is "parse once, render per target". |
| Sphinx | One document tree, several builders (html, epub, latex). Each node type has a visitor per builder. Its parallel builds (`-j`) split into a read phase and a write phase. |
| Quarto | Multi-format publishing where `format: { html: …, epub: … }` merges over the top-level options. This is what b-ber's per-build sections were meant to do. |
| Turborepo / Nx / Bazel | Tasks declare their outputs. That declaration is what lets a runner prove that concurrent tasks don't write the same paths. |
| Write-then-rename | Build into a staging directory and `rename` into place on success, so a failure never leaves a half-written build. |
| `AsyncLocalStorage` (`node:async_hooks`) | How Node servers scope context to a request without passing it everywhere (OpenTelemetry, Next.js `headers()`). Used here only for the compatibility shim. |

### The pieces

```ts
// Read once, explicitly, from a directory. No I/O at import time
interface Project {
  root: string
  config: ProjectConfig            // config.yml, validated (shape set by TASK-162)
  metadata: Metadata               // metadata.yml
  media: MediaMap                  // media.yml
  navigation: Navigation           // toc.yml plus any <target>.yml overrides
  theme: ThemeModule
}
function loadProject(root: string, overrides?: Partial<ProjectConfig>): Promise<Project>

// What a target *is*: its name, what it supports, and how it builds.
// Replaces the `state.build === 'x'` branches
interface Target {
  name: 'epub' | 'mobi' | 'pdf' | 'web' | 'reader' | 'sample' | 'xml'
  features: TargetFeatures         // e.g. interactiveMedia, figuresOn: 'page' | 'titlepage'
  outputs(ctx: BuildContext): string[]   // paths it will write: checked for overlap
  build(ctx: BuildContext, shared: SharedArtifacts): Promise<BuildResult>
}

// One per target per run. Passed down; never global
interface BuildContext {
  project: Project
  target: Target
  config: ResolvedConfig           // project.config merged with its <target>: section
  paths: { src: PathHelpers; dist: PathHelpers; staging: PathHelpers }
  log: TargetLogger                // the logger, tagged with this target
}
```

**Tasks become typed functions.** Inputs are explicit and outputs are
returned. A target's `build` is a plain async function, so the sequence reads
top to bottom:

```ts
async build(ctx, shared) {
  await step(ctx, 'clean', () => clean(ctx))
  await step(ctx, 'assets', () => Promise.all([container(ctx), sass(ctx), copy(ctx), scripts(ctx)]))
  const pages = await step(ctx, 'render', () => render(ctx, shared.documents))   // → { pages, figures, footnotes, guide, remoteAssets }
  const loiPages = await step(ctx, 'loi', () => loi(ctx, pages.figures))
  const notes = await step(ctx, 'footnotes', () => footnotes(ctx, pages.footnotes))
  await step(ctx, 'opf', () => opf(ctx, { ...pages, loiPages, notes }))
  return step(ctx, 'package', () => packageEpub(ctx))
}
```

`step(ctx, name, fn)` replaces `serialize`. It emits the logger's start and
stop events, tagged with the target, and nothing else. **There is no task
runner dependency.** `serialize` already is one, and plain functions are
easier to read and debug.

### Running a build: plan, prepare, fan out

1. **Plan.** Resolve the requested targets and each `BuildContext`. Collect
   every target's `outputs` and **fail before doing any work if any two
   overlap**. Each target's dist is already `${dist}-${target}`, so in
   practice this check guards against mistakes.
2. **Prepare, once and serially:**
   - everything that writes to the **source** tree: `ensure` (project
     scaffolding), and cover generation, which today rewrites `metadata.yml`
     and prunes `_images/` from inside the cover task. Cover generation
     becomes a prepare step that runs once, not once per target;
   - **parsing**: Markdown → directive tree for every document (TASK-161).
     This is target-independent, so it happens once, and the trees are
     shared read-only.
3. **Fan out.** Run the targets' `build` functions under a concurrency limit
   (`--concurrency`, default: number of CPUs, capped). Each writes to
   `<dist>-<target>.tmp-<hash>/` and is renamed to `<dist>-<target>/` only if
   it succeeds. `--concurrency=1` gives today's one-at-a-time behaviour for
   debugging.

What runs in parallel in practice: markdown-it and rendering are
synchronous, so in one process concurrency overlaps I/O and child processes
(dart-sass, Calibre's ebook-convert, EPUBCheck, zip). Parsing once removes
the largest repeated CPU cost. `worker_threads` is a possible later step,
not part of this design.

**The logger.** Its events carry no build id, it has one `Timer`, and
`CompactReporter` tracks a single `currentBuild`. It needs:
- events tagged with the target;
- a timer per target;
- in the progress reporter, one line per running target (as Turborepo and
  lerna prefix output by package).

The `lines` reporter prefixes each line with the target.

### Config resolution

`ResolvedConfig = defaults ← config.yml ← config.yml's <target>: section ←
--config file ← CLI flags`, each layer overriding the previous one, as in
Quarto. This restores per-build sections, broken since 2019. Note in the
release notes that a project which has such a section will see it take
effect.

The **shape** of the config (which keys, their names, camelCase) is TASK-162.
This design depends only on the layering.

### Migrating without a big bang: the State shim

`State` stays importable while tasks move over one at a time:

- `runBuild` stores the active `BuildContext` in an `AsyncLocalStorage`.
  `State`'s getters (`state.build`, `state.spine`, `state.dist.*`,
  `state.config`) read from `currentContext()`. Code that hasn't migrated
  keeps working, and keeps working when targets run concurrently, because
  each async chain sees its own context. Without that, the shim would force
  serial builds until the last call site moved.
- `state.add('figures', …)` and the other collection writes go to the
  context's collectors, and are deprecated with a warning in development.
- Each migrated task takes `ctx` and stops importing `State`. When nothing
  imports it, `State` and the `AsyncLocalStorage` are deleted. The shim is
  scaffolding, not the end state.

The TASK-153 boundary tests and TASK-152's golden-output test are the gate
for every step. A migration commit changes no output.

### The CLI after this

`bber build [targets…]` does three things: parse arguments, `loadProject`,
then `runBuild(project, targets, { concurrency })`. The logger is configured
from flags as today (TASK-158). `index.ts`'s dynamic import, which only exists
to delay `State`'s import-time I/O, can go.

### Deployment (later, noted here for shape)

`deploy` is hardwired to S3 through the aws CLI. Later it becomes a pluggable
step, `defineDeployer({ name, options, deploy(ctx, builds) })`, chosen in
`config.yml`, with S3, rsync/SSH and directory copy built in. A deployer
throws on failure and never exits. **Not in this task's implementation
plan.** The public API waits until the new pipeline is stable (#792).
TASK-153 pinned the current defects (#798).

### Not in scope

- The public `defineDirective` / `defineDeployer` APIs, and user-loaded
  directives or deployers. These are future work once the new code is stable.
  The internal shapes here are designed so they can be exposed later.
- Config key names and casing (TASK-162).
- The directive grammar (TASK-161), beyond the "parse once in prepare"
  contract.

## Plan (tasks to file once this is agreed)

1. **`loadProject` + `BuildContext` + the `State` shim.** No behaviour
   change, except per-build config, which starts being applied. Flip
   `build-config.test.js`'s defect test.
2. **`Target` definitions with feature flags.** Replace the
   `state.build === 'x'` branches. Fix the hardcoded `project-<build>` path
   and serve's `src`/`dist` (flip those defect tests).
3. **Migrate tasks to `(ctx, inputs) → outputs`**, one commit each, in data-
   flow order: render → loi → footnotes → opf → the packagers. Remove
   `serialize`.
4. **Plan/prepare/fan-out with staging and rename.** Cover moves to prepare.
   Logger events carry the target.
5. **Parse once** (needs TASK-161's tree).
6. **Delete `State`** when nothing imports it.

Steps 1–3 can ship in minor releases behind the shim. Step 6, together with
TASK-161's package consolidation, is the 5.0 major.

## Subtasks

- [ ] Review this design; record decisions and changes below
- [ ] Decide `TargetFeatures`: list every `state.build` branch (~30) and
      group them into named features
- [ ] Decide the default concurrency and the progress reporter's multi-target
      layout
- [ ] Confirm the `AsyncLocalStorage` shim against the call sites inside
      markdown-it render rules (synchronous, so the context propagates)
- [ ] File the implementation tasks in the Plan under #792 and update its
      sequencing

## Notes

- Depends on: TASK-153 (merged) and TASK-152 as the safety net, and TASK-159.
- Related: TASK-161 (directives), TASK-162 (config).
- No new dependencies: concurrency limiting, `AsyncLocalStorage` and
  staging/rename are all Node built-ins or a few lines of code.

## Findings
