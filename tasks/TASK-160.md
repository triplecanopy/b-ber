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
- [x] Confirm the `AsyncLocalStorage` shim against the call sites inside
      markdown-it render rules (synchronous, so the context propagates).
      Confirmed, with one exception: module-level state. See Findings
- [ ] File the implementation tasks in the Plan under #792 and update its
      sequencing

## Notes

- Depends on: TASK-153 (merged) and TASK-152 as the safety net, and TASK-159.
- Related: TASK-161 (directives), TASK-162 (config).
- No new dependencies: concurrency limiting, `AsyncLocalStorage` and
  staging/rename are all Node built-ins or a few lines of code.

## Findings

### 2026-11-24: every `state.build` branch, grouped

Line numbers are at `72066c35`. b-ber-reader and b-ber-reader-react are
excluded: they consume builds, they don't make them. The themes' SCSS is listed
separately at the end.

There are 37 branches. 28 of them are **behaviour**: they become feature
flags. The other 9 use the target's **name as an identifier** and become
`ctx.target.name`.

**1. Live embeds** (`web`, `reader`): inline iframe and Vimeo embeds render,
and everything else gets the "unsupported" fallback. 9 sites:

| Site | What it does |
| ---- | ------------ |
| `grammar-iframe/src/helpers.ts:36`, `index.ts:48` | `supported()`: inline iframe, or the unsupported message |
| `lib/src/utils/index.ts:371` | `ensureSupportedClassNames`: `embed supported` / `unsupported` |
| `grammar-vimeo/src/index.ts:42`, `:75`, `:149` | the same three for Vimeo |
| `templates/src/figures/helpers.ts:266` | `%SUPPORT_CLASS_NAME%` on the Vimeo figure page |
| `grammar-audio-video/src/helpers.ts:64` | `playsinline` attributes |
| `grammar-audio-video/src/index.ts:92` | allows `controls="<custom>"`; everything else is forced to `controls="controls"` for EPUBCheck |

**2. Full-bleed containers** (`web`, `reader`): gallery and spread open as
positioned full-screen containers instead of a plain `<section>`. 4 sites:
`grammar-gallery/src/index.ts:40`, `grammar-spread/src/index.ts:51`,
`grammar-section/src/index.ts:40` and `:48` (the matching close tags).

**3. Where figures live** (`reader` → one titlepage, the rest → a page each).
5 sites: the `href` in `grammar-image/src/image.ts:40`,
`grammar-audio-video/src/index.ts:147`, `grammar-iframe/src/helpers.ts:72` and
`grammar-vimeo/src/index.ts:97`, plus `tasks/src/loi/index.ts:118`, which
writes either `figures-titlepage.xhtml` or one file per figure.

**4. Markup for the reader-react runtime** (`reader` only). 3 sites:
- `grammar-vimeo/src/helpers.ts:141` and `templates/src/figures/helpers.ts:258`
  leave out the poster `<img>`, because the reader takes it from
  `data-vimeo-poster`;
- `grammar-section/src/index.ts:75` emits the empty `<div>` the reader's
  spread markers need.

**5. Figure templates.** `templates/src/figures/index.ts:25` is a table keyed by
target, `{ epub, mobi, reader, web }`. Anything else, meaning `pdf`, `sample`
and `xml`, silently falls back to `epub`. The table is reached through 3 call
sites that pass `state.build`: `grammar-image/src/image.ts:98` and
`tasks/src/loi/index.ts:66`, `:83`. 4 sites in all. The tables differ by:
- mobi doesn't link images (`linkImages: false`) and doesn't support iframes;
- reader applies the inline classes to images;
- Vimeo is live in reader and web, and unsupported in epub and mobi.

**6. Non-linear spine items** (`mobi` drops them).
`templates/src/Opf/Spine.ts:33`. 1 site.

**7. Cover page** (`pdf` has none; `config.yml` handles its cover).
`tasks/src/cover/index.ts:199` skips `cover.xhtml`, and
`tasks/src/opf/Navigation.ts:99` stops reporting `cover` as redundant. 2 sites.

**Not features: the name used as an identifier.** 9 sites. All of these are
user-facing contract:

| Site | Use |
| ---- | --- |
| `tasks/src/sass/index.ts:190` | SCSS `$build`, which the themes branch on about 20 times |
| `tasks/src/inject/index.ts:24` | `window.bber.env` |
| `tasks/src/opf/Navigation.ts:45`, `lib/src/State.ts` `loadBuildSettings` | the `<target>.yml` navigation override |
| `grammar-media/src/index.ts:60` | the key into `media.yml` |
| `lib/src/State.ts` `loadBuildSettings` | the `config.yml` section, and the `<dist>-<target>` directory |
| `lib/src/SpineItem.ts:69`, passed by `loi/index.ts:87`, `footnotes/index.ts:37` | `project-<target>` (defect #757) |
| `tasks/src/clean/index.ts:9` | deletes `*.<target>` from the project root |

Because these are public, **target names are frozen API**. Renaming one breaks
users' themes and `media.yml` files.

**What the inventory turned up:**

- **`grammar-media` conflicts with parse-once.** It rewrites the Markdown
  **source** before parsing, splicing in a different directive per target from
  `media.yml`. So a document that uses `media` currently parses differently
  for each target. TASK-161's tree has to represent `media` as a node that is
  resolved per target at render time. Otherwise step 5 can't parse such a
  document once.
- **Embeds behave inconsistently, and this is preserved.** An epub *figure page*
  renders a live iframe (the `epub` figure template uses `iframe`), but an
  `iframe-inline` in an epub renders the unsupported message. Recorded here,
  not fixed: migration commits change no output.
- **Some packaged outputs land outside the dist directory.** epub, mobi and pdf
  write `<identifier>.<ext>` to the project root (`epub/index.ts`, zipper
  `output: process.cwd()`), xml writes `<uuid>.xml` there, and `clean` deletes
  `*.<target>` there. So `outputs()` has to list these root-level files.
  Staging-and-rename covers only `<dist>-<target>/`, so these files need their
  own write-then-rename.
- `sample` has no feature branches of its own. It is the epub pipeline with a
  `sample.yml` navigation and a no-op final task.

**Themes** (`$build` in SCSS, not part of the 37): `theme-serif` branches on
`reader` (×8), `web` (×2, one being the whole of `layout/_web.scss`), `mobi`
(×4) and `mobi or epub` (×2). `theme-sans` branches on `reader` and `web`.
These stay as they are: `$build` keeps carrying the name.

### 2026-11-24: spike, `AsyncLocalStorage` shim under concurrent targets

**Question:** does a `BuildContext` held in `AsyncLocalStorage` reach code
inside markdown-it render rules, and stay separate when several targets
render at once?

**Method.** A throwaway script (not committed). It patched the `State`
instance so that `build` and `config` were accessors reading
`als.getStore()`. It then rendered the kitchen-sink fixture's 9 documents
through the real `MarkdownRenderer` and grammar plugins, from built `dist/`:
- **serial:** one target per fresh process, through today's
  `state.update('build', …)`;
- **concurrent:** epub, reader, web and mobi in one process, each under
  `als.run`, with an `await setImmediate()` before every document. That forced
  35 target switches across 36 renders.

For each target, it compared the rendered HTML, `figures`, `frontMatter` and
`cursor` with the serial run. Footnote ids contain 8 random bytes per note
(`parser-footnotes/src/counter.ts:59`), so the comparison normalised them.

**Results:**

| Run | Result |
| --- | ------ |
| concurrent, with the shim | **identical** to serial for all four targets. The targets' outputs differ from each other, so the match means something |
| concurrent, **without** the shim (negative control) | fails immediately: `build leaked: mobi in epub` |
| shim, with footnotes in 3 chapters, `group_footnotes: true` (the default) | identical |
| shim, with footnotes in 3 chapters, `group_footnotes: false` | **differs**: epub's chapter 3 numbers its notes `10, 11` instead of `4, 5` |

**Conclusions:**

1. **The context propagates.** Render rules run synchronously inside the
   task's async chain, so `getStore()` returns the right context there. The
   riskiest assumption in the plan holds.
2. **The shim must scope more than `build`.** `config` has to be per-context,
   because CLI overrides mutate it per build. The spike checked this with a
   per-target marker that would have leaked otherwise. `hash` (sass's
   production filename) and `reset()` also need to be per-context: `reset()`
   currently re-reads `config.yml` and sets `build` back to `epub`.
   Collections in `state.builds[name]` only stayed separate because each target
   has a distinct name. Two runs of the *same* target would collide, so the
   collections belong on the context, as the design already says.
3. **`AsyncLocalStorage` cannot scope module-level state, and one instance of
   that breaks output.** `parser-footnotes/src/index.ts:23` keeps a single
   `Counter`. With `group_footnotes: false`, its `item` count carries across
   documents (correct within one target), and concurrent targets advance it
   for each other. The rule:
   - state that opens and closes within one synchronous `render()` call is
     safe. That covers pullquote's `citation` and `pullquoteIndices`,
     `state.cursor`, epigraph's `/g` regex, and `MarkdownRenderer.fileName`;
   - state that carries from one `render()` to the next is not. In the render
     path, `Counter` is the only instance.
4. **Task singletons would leak under fan-out too, but the plan already
   handles them.** `cover`, `container`, `footnotes` and `generate` are
   instances created at import time, and `web` keeps its paths in
   module-level `let`s. All of them hold fields across `await`s. Step 3
   migrates them to `(ctx) → outputs` before step 4 fans out, so the
   constraint is **ordering**: fan-out may only run targets whose every task
   is migrated.

**Changes to the Plan this implies:**
- Step 1 (the shim) routes `build`, `config` and `hash`, makes `reset()`
  context-scoped, and moves the per-target collections onto the context.
- Before step 4: the footnote `Counter` moves onto the context (one per
  target), and the fixture gets footnotes in more than one document under
  `group_footnotes: false`. Kitchen-sink has a single footnote, so neither
  TASK-152's golden test nor TASK-153's tests would catch the leak.
- Step 4 adds a concurrency test modelled on the spike: render every target
  concurrently and compare each with its serial output, normalising the random
  footnote ids. Include the no-shim negative control, so the test is known to
  be able to fail.
