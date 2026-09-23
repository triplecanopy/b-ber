# AGENTS.md — b-ber monorepo

Agent working standards for the `b-ber` monorepo. This document describes the
repository structure, package inventory, task system, commit conventions, and
coding standards that apply across all packages.

**Start here:** Run `git branch --show-current` before doing anything. The
active branch determines where your commits land. `main` is the trunk — the
`feat/upgrades` integration cycle merged into it at `4.0.0`, so there is no
long-lived integration branch any more. Implementation work belongs on a task
branch named `TASK-NNN-<short-descriptive-title>`, cut from `main`. If you are
on `main` with changes to make, create the task branch before making them.

Then read `PLAN.md`. It shows what is in progress, what is blocked, the
dependency graph, and which branches are pending merge. This file (AGENTS.md)
contains the standards and conventions; PLAN.md contains the current state.

Package-specific AGENTS.md files extend this document with package-local
details (architecture, dev commands). Always read both this file and the
relevant package AGENTS.md before starting work. Note: tasks are **not** tracked
per package — all tasks live in the root `tasks/` directory (see Task System).

---

## What This Is

b-ber is a build framework and EPUB reader for producing publications in
multiple formats — EPUB 3, Mobi/KF8, static website, PDF, and InDesign XML —
from a single plain-text source. Source files are written in Markdown extended
with custom directives derived from the EPUB 3 Structural Semantic Vocabulary.
Themes are written in SCSS. The framework is distributed as a set of npm
packages in this Lerna-managed monorepo.

### How it works (high level)

```
Author writes Markdown + YAML config + SCSS overrides
  → b-ber-cli orchestrates the build
  → b-ber-tasks runs ordered build steps (parse → render → package)
  → b-ber-grammar-* transforms custom directives into HTML/XML
  → b-ber-parser-* handles specific content types (figures, footnotes, etc.)
  → b-ber-lib provides shared utilities across all build steps
  → b-ber-templates generates EPUB container/manifest files
  → b-ber-theme-* provides base SCSS (serif, sans)
  → Output: EPUB / website / PDF / XML in _project/builds/
  → Browser reading: b-ber-reader-react serves the EPUB via S3 manifest
```

---

## Package Inventory

### Entry / CLI

| Package     | Scope token | Purpose                                                      |
| ----------- | ----------- | ------------------------------------------------------------ |
| `b-ber-cli` | `cli`       | Command-line interface; entry point for all `b-ber` commands |

### Core library

| Package                   | Scope token         | Purpose                                                       |
| ------------------------- | ------------------- | ------------------------------------------------------------- |
| `b-ber-lib`               | `lib`               | Shared utilities used across the build pipeline               |
| `b-ber-logger`            | `logger`            | Logging utility; use this instead of `console.log`            |
| `b-ber-tasks`             | `tasks`             | Ordered build task definitions (parse, render, package, etc.) |
| `b-ber-markdown-renderer` | `markdown-renderer` | Converts Markdown source to intermediate HTML                 |
| `b-ber-validator`         | `validator`         | Validates OPF/NCX/spine output against EPUB spec              |

### Grammar (directive transformers)

These packages each handle one custom Markdown directive type. They transform
b-ber-extended Markdown into the HTML/XML structures required for EPUB output.

| Package                     | Scope token           | Directive handled                          |
| --------------------------- | --------------------- | ------------------------------------------ |
| `b-ber-grammar-attributes`  | `grammar-attributes`  | Inline attribute blocks                    |
| `b-ber-grammar-audio-video` | `grammar-audio-video` | Audio and video embeds                     |
| `b-ber-grammar-dialogue`    | `grammar-dialogue`    | Dialogue markup                            |
| `b-ber-grammar-epigraph`    | `grammar-epigraph`    | Epigraph blocks                            |
| `b-ber-grammar-footnotes`   | `grammar-footnotes`   | Footnote definitions and references        |
| `b-ber-grammar-frontmatter` | `grammar-frontmatter` | Front matter (title page, copyright, etc.) |
| `b-ber-grammar-gallery`     | `grammar-gallery`     | Image gallery layouts                      |
| `b-ber-grammar-iframe`      | `grammar-iframe`      | Inline frame embeds                        |
| `b-ber-grammar-image`       | `grammar-image`       | Single image directives                    |
| `b-ber-grammar-logo`        | `grammar-logo`        | Logo/wordmark blocks                       |
| `b-ber-grammar-media`       | `grammar-media`       | General media container                    |
| `b-ber-grammar-pullquote`   | `grammar-pullquote`   | Pull-quote blocks                          |
| `b-ber-grammar-renderer`    | `grammar-renderer`    | Core grammar rendering engine              |
| `b-ber-grammar-section`     | `grammar-section`     | Section/chapter boundaries                 |
| `b-ber-grammar-spread`      | `grammar-spread`      | Full-bleed spread images                   |
| `b-ber-grammar-vimeo`       | `grammar-vimeo`       | Vimeo video embeds                         |

### Parsers (content-type handlers)

| Package                  | Scope token        | Purpose                                 |
| ------------------------ | ------------------ | --------------------------------------- |
| `b-ber-parser-dialogue`  | `parser-dialogue`  | Parses dialogue markup into HTML        |
| `b-ber-parser-figure`    | `parser-figure`    | Parses figure/caption structures        |
| `b-ber-parser-footnotes` | `parser-footnotes` | Parses footnote markers and definitions |
| `b-ber-parser-gallery`   | `parser-gallery`   | Parses gallery directive content        |
| `b-ber-parser-section`   | `parser-section`   | Parses section/chapter boundary markers |

### Shapes (data schemas)

| Package                    | Scope token          | Purpose                                    |
| -------------------------- | -------------------- | ------------------------------------------ |
| `b-ber-shapes-directives`  | `shapes-directives`  | Data shapes for custom directive arguments |
| `b-ber-shapes-dublin-core` | `shapes-dublin-core` | Dublin Core metadata schemas               |
| `b-ber-shapes-sequences`   | `shapes-sequences`   | Sequence/spine ordering schemas            |

### Templates and resources

| Package           | Scope token | Purpose                                                    |
| ----------------- | ----------- | ---------------------------------------------------------- |
| `b-ber-templates` | `templates` | Handlebars templates for EPUB container/manifest/NCX files |
| `b-ber-resources` | `resources` | Static assets (fonts, icons) bundled into builds           |

### Themes

| Package             | Scope token   | Purpose                                               |
| ------------------- | ------------- | ----------------------------------------------------- |
| `b-ber-theme-serif` | `theme-serif` | Serif SCSS theme (base styles for serif publications) |
| `b-ber-theme-sans`  | `theme-sans`  | Sans-serif SCSS theme                                 |

### Readers

| Package              | Scope token    | Purpose                                         |
| -------------------- | -------------- | ----------------------------------------------- |
| `b-ber-reader`       | `reader`       | Legacy browser-based EPUB reader (not React)    |
| `b-ber-reader-react` | `reader-react` | Current React + Redux EPUB reader (user-facing) |

---

## Task System

**All tasks live in `tasks/` at the monorepo root. There are no package-level
task directories** — `packages/*/tasks/` was flattened into root on 2026-06-11
(the nesting added no value and forced a separate, colliding ID sequence).

### Features (epics)

Every task belongs to exactly one **feature** — the larger body of work it
contributes to. Record it in the task header with a `**Feature:**` field, and
group tasks by feature in `PLAN.md`. The features are:

- **Upgrade tooling**
- **Migrate JS→TS**
- **Unit test coverage**
- **E2E testing**
- **Node.js modernization**
- **React 19 (reader-react)**
- **Dependency health** — added 2026-09-22

Every task created going forward must fall under one of these.

**Dependency health** is unlike the other six: they are bounded (there is a state
in which the migration is finished), whereas keeping dependencies current and
vulnerability-free is continuous. It does not "complete" — it reaches a working
footing and then needs maintaining. Treat a quiet Dependabot queue as the
definition of done for any given task under it, not for the feature. If a task does
not fit any of them, that is a signal to either reframe the task or raise a new
feature with the team — do not leave it unclassified.

### Task ID and file naming

`TASK-NNN` — zero-padded three-digit integer in a single root-wide sequence,
assigned sequentially, never reused. (Before the flatten there were separate
per-package sequences; those were renumbered into the root sequence.)

- **Open / in-progress:** `tasks/TASK-NNN.open.md`
- **Complete / closed:** `tasks/TASK-NNN.md` (remove `.open` suffix)

Never delete a task file — except when explicitly consolidating duplicate/stub
tasks into a single canonical task (record the consolidation in the survivor).

### Status transitions

Set status to `in progress` when starting; `complete` when done; `superseded`
when another task absorbs it (add a pointer to the survivor). Update subtask
checkboxes as work progresses — do not batch.

### Closed tasks

Do not edit a task file once it is `complete` and the `.open` suffix is removed.
If work needs to continue after a task closes, open a new task referencing the
original. Exception: minor factual corrections (wrong issue number, broken link,
obvious typo) — note the correction in the task's Notes section.

For full PRD template, parent task guidance, and sub-task conventions, run
`/task-prd`.

---

## Commits

Format: `<type>(<scope>): <short imperative description>`

Scope token matches the package name (see Package Inventory). Use `monorepo`
for cross-package or root changes.

**Types:** `fix`, `feat`, `chore`, `refactor`, `test`, `docs`

```
fix(reader-react): removes transition from leaf elements
docs(monorepo): add root AGENTS.md
```

- Imperative mood: "removes", "adds" — not "removed"
- Subject line under 72 characters
- One logical change per commit
- `npm test` passes before committing

---

## Branch Strategy

**`main` is the trunk, and it is protected.** The `feat/upgrades` integration
cycle merged into `main` and shipped as `4.0.0`; there is no long-lived
integration branch any more.

> ### 🛑 Never push or merge directly to `main`
>
> `main` requires a pull request. Push your task branch to `origin` and open a
> PR — do not `git checkout main && git merge <branch>`, even when the merge is a
> clean fast-forward and the gates are green. This bit us on 2026-09-20: TASK-112
> and TASK-114 were merged locally into `main`, which forced the branch
> protection rule to be disabled to get them pushed. Local gates passing is not
> the thing the rule is protecting.
>
> This applies to **every** change, including a one-line docs fix. There is no
> "too small for a PR" exception; a protected branch has no size threshold.

**Task branches — one branch per task, named for it:**

```
TASK-NNN-<short-descriptive-title>
```

e.g. `TASK-112-dirname-asset-paths`, `TASK-109-scss-toolchain`. The task number
comes first so the branch, the PRD in `tasks/`, and the GitHub issue all carry
the same identifier and sort together. Keep the slug short and descriptive —
kebab-case, a few words, no package prefix (the PRD's `**Scope:**` field records
the package).

The workflow:

1. Open the task PRD first (`/task-prd`) so the number exists — it names the
   branch.
2. `git checkout -b TASK-NNN-<slug>` from an up-to-date `main`.
3. Do the work, committing with conventional messages scoped to the package.
4. Run the Quality Gates below, then open the issue (`/sync-task-issues`).
5. `git push -u origin TASK-NNN-<slug>` and open a PR against `main`:
   ```bash
   gh pr create --base main --title "TASK-NNN: <title>" --body "Closes #NNN …"
   ```
6. Merge the PR once `npm test` passes cleanly. Then close the issue, drop the
   task file's `.open` suffix, and update `PLAN.md`.

A task that splits into genuinely parallel slices may use
`TASK-NNN-<slug>-<pkg>` per slice, each with its own PR.

### 🛑 Dispatching subagents in isolated worktrees — read before spawning

**Worktree isolation bases the new worktree off the repository's DEFAULT branch
(`main`), NOT the branch you are currently on.** Since `main` became the trunk
this is usually what you want — but it is still wrong whenever you are working
on a task branch that the subagent needs to build on. A subagent cannot detect
this from `git branch --show-current` (it sees its own fresh `worktree-agent-*`
branch) and AGENTS.md alone will not save it. This bit us on 2026-06-19, back
when `main` trailed the integration branch: three worktree subagents branched
off the `3.1.0` commit, edited stale task files and an old `package.json`, and
their branches could not be merged without clobbering newer work — the
orchestrator had to reconcile by hand. The `npm install` step below still
applies unconditionally.

**The orchestrator (the spawning agent) MUST, in every worktree subagent's
prompt:**

1. **Pin the base trunk as the first step:** instruct the subagent to run
   `git reset --hard <trunk>` (e.g. `git reset --hard main`, or your task
   branch when the subagent must build on it) before doing anything else. This
   re-points the fresh worktree branch (and its working tree) at the correct
   trunk; it is safe even though that trunk is checked out
   in the main tree (reset moves the *current* branch pointer, it does not check
   out the trunk branch).
2. **Install deps:** then run `npm install` — a fresh worktree shares git history
   but **not** `node_modules` (gitignored), so `jest`, `madge`, build/watch tools
   are absent until installed. A source-touching agent that cannot run the test
   suite cannot verify its own change.
3. **Leave bookkeeping to the parent:** the subagent should edit task-file
   *content* only (status, findings) and NOT rename `*.open.md → *.md` or edit
   `PLAN.md` — the parent does those after merge, to avoid add/add merge
   conflicts.

After the subagents finish, **verify each branch's base before merging**
(`git merge-base <trunk> <branch>` should be at/near `<trunk>` HEAD, not an old
release). If you skipped step 1, do not merge — lift the artifacts file-by-file
and reconcile onto the trunk by hand. For branch-sensitive work that also needs
`node_modules`, prefer running the subagent **non-isolated in the main checkout**
(sequentially, to avoid concurrent-commit index races) over worktree isolation.

---

## Code Standards

These apply to all JavaScript/TypeScript in the monorepo.

- **Use `const` and `let`. Never `var`.**
- **Async/await over callbacks** wherever the calling environment supports it.
- **Named exports preferred** over default exports for library code; default exports are
  acceptable for React components.
- **No `console.log` in production paths.** Use `b-ber-logger` for all output.
- **No magic numbers without a comment** explaining why the value is what it is.
- **No polling.** Use observers, event listeners, or promise chains.
- **No deprecated Node.js APIs.** Keep compatibility with the engine range in `package.json`.
- Comments should explain the WHY, not the WHAT. Do not restate the code.
- Do not add error handling for scenarios that cannot happen. Only validate at
  system boundaries (CLI input, external API responses, file system reads).

### React-specific (b-ber-reader-react and any future React packages)

> **🛑 React 19 migration tasks — read the conventions first.** Before writing
> any code for a **React 19 (reader-react)** task (TASK-068, 073, 091, and
> TASK-094–100), you **must** read
> [`packages/b-ber-reader-react/MIGRATION-CONVENTIONS.md`](./packages/b-ber-reader-react/MIGRATION-CONVENTIONS.md).
> It is the binding spec for those tasks: behavior-preservation rules, the
> per-commit verification gate, the class→functional and HOC→hook patterns, and
> the cross-version pitfalls that snapshots do **not** catch — state batching
> (§3c), effect cleanup/idempotency + StrictMode (§3d), and render purity (§3e).
> Each task also names the model best suited to it (`**Model:**` field).

- No new class components. All new components must be functional.
- No deprecated lifecycle methods (`UNSAFE_*`). Use `useEffect` + `useRef`.
- No `setInterval` / `requestAnimationFrame` loops for DOM measurement.
  Use `ResizeObserver` or `MutationObserver`.

---

## Releases

**Releases are automated. Do not run `lerna publish`.**

`lerna publish` bundles two jobs: `lerna version` (bump, commit, tag, **push**)
and the npm publish. That push targets `main`, which is protected — so it cannot
work here, and it fails *after* creating the commit and tag. That is exactly how
it failed on 2026-09-20: it produced a `4.0.1` commit and a `v4.0.1` tag, the push
was rejected, npm was never reached, and the retry had to move to `4.0.2` because
a rejected version still burns the number. The root `publish:latest` script that
invoked it has been removed.

Two workflows split the halves so neither needs a protection bypass:

| Workflow | Trigger | Does |
| -------- | ------- | ---- |
| [`release-prepare.yml`](.github/workflows/release-prepare.yml) | manual (`workflow_dispatch`, pick `patch`/`minor`/`major`) | builds, tests, bumps versions, pushes `release/x.y.z`, opens a PR |
| [`release-publish.yml`](.github/workflows/release-publish.yml) | push to `main` | rebuilds, tests, `lerna publish from-package`, tags `vx.y.z` |

### To cut a release

1. Actions → **Release · prepare version PR** → Run workflow → choose the bump.
   **Leave the branch selector on `main`.**
2. Review the PR it opens. Merging it **is** the release.
3. `release-publish.yml` publishes and tags. Nothing else to do.

> ⚠️ **Run it from `main`, not a feature branch.** `release-prepare.yml` cuts the
> release branch from whatever ref it runs on, so running it against a feature
> branch produces a release PR containing that branch's **unmerged** commits — the
> version bump plus whatever else is sitting there. Verified on 2026-09-20: a run
> against `TASK-115-uglifyjs-path` opened a "4.0.3" PR carrying two unmerged
> commits alongside the bump. Harmless if you notice, a surprise release if you do
> not. Running against a branch is only useful for *testing* the workflow itself,
> and the release PR it produces should be closed rather than merged.

Merge that PR by whatever method you like — the tag is created afterwards from
`main`, so a squash cannot orphan it.

### Why it is built this way

- **`lerna publish from-package` performs no git operations.** It publishes every
  workspace package whose `package.json` version is not yet on the registry. No
  commit, no tag, no push — so protected `main` is never in its way. It is also
  what makes `release-publish.yml` safe to run on *every* push to `main`: when
  there is nothing new, every version is already published and the job no-ops.
  It guards on that explicitly before doing any work.
- **The tag is created last, on `main`, only after npm accepts the release.** So a
  tag can never point at a version that failed to publish, nor at a commit a
  squash-merge rewrote away. `lerna version` runs with `--no-git-tag-version`,
  which in lerna means "do not commit *or* tag" — the workflow commits the bump
  itself.
- **`--force-publish`** because `lerna.json` is in fixed mode and this workspace
  has always moved in lockstep (at `4.0.2`, even untouched packages like
  `b-ber-theme-sans` were published). Bump together rather than letting change
  detection split the workspace.
- **The version commit is authored through GitHub's `createCommitOnBranch`
  GraphQL mutation, not `git commit`.** `main`'s ruleset requires verified
  signatures, and a runner has no signing key — a plain commit by
  `github-actions[bot]` comes back `verified: false, reason: unsigned` and the
  release PR is unmergeable. Commits made through that mutation are signed by
  GitHub itself ("GitHub Web Flow"), which satisfies the rule **without** putting
  a private key in secrets. `.github/scripts/build-release-commit.js` builds the
  payload from the bump `lerna version` leaves in the working tree, and refuses to
  run if anything other than `package.json`/`package-lock.json`/`lerna.json` is
  dirty — so an unrelated stray edit cannot ride out inside a commit titled
  "4.0.3". The workflow then asserts `signature.isValid` before opening the PR.
- **Both workflows build before publishing, and that is not belt-and-braces.** No
  package defines `prepublishOnly`, `prepare` or `prepack`, and the root's
  `prepublishOnly` never fires because the root is `private: true` and is never
  published. So **nothing builds these packages as part of publishing** —
  `lerna publish` ships whatever is sitting in each `dist/`. `b-ber-tasks` had a
  `prepare` script that did this correctly until `c12c5aaf` (TASK-030) replaced it
  with a plain `build`; `4.0.2` shipped correct artifacts only because the tree
  happened to be freshly built by hand. Build precedes test because several
  packages' tests import a sibling's built `dist`.

### Requiring the CI gate

`.github/workflows/ci.yml` runs build + test on every pull request, but a workflow
alone blocks nothing — it has to be a **required status check** on `main`. Until it
is, a red PR can still be merged, which is how the 4.0.3 bump reached `main`
unpublishable.

GitHub only offers a check in the ruleset UI after it has reported at least once,
so the order matters:

1. Merge `ci.yml`, then open or push any PR so the `build-and-test` check runs once.
2. Repository **Settings → Rules → Rulesets → "Base Rules"**.
3. Under **Branch rules**, tick **Require status checks to pass**.
4. Click **Add checks**, search `build-and-test`, and select it. If it does not
   appear, the check has not reported yet — go back to step 1.
5. Optionally tick **Require branches to be up to date before merging**. It is
   safer (the check runs against `main` merged in) at the cost of re-running CI
   when `main` moves.
6. Leave **Do not require status checks on creation** unticked.
7. **Save changes** at the bottom.

Verify it worked by opening a throwaway PR with a deliberate lint error: the merge
button should be blocked, not just red.

`required_status_checks` is what the ruleset calls this rule; confirm it with
`gh api repos/triplecanopy/b-ber/rulesets/<id> --jq '[.rules[].type]'`.

### Required secrets

`NPM_TOKEN` — an npm automation token with publish rights to the
`@canopycanopycanopy` scope. Everything else uses the default `GITHUB_TOKEN`.

### Manual fallback

If the workflows are unavailable, the same two steps by hand — note that the
version PR still has to go through `main`'s protection:

```bash
npm run release:version          # bump only; leaves the change uncommitted
git checkout -b release/x.y.z && git commit -am "x.y.z" && git push -u origin release/x.y.z
gh pr create --base main --title "x.y.z"      # then merge

git checkout main && git pull
npm run release:publish          # build + test + lerna publish from-package
git tag vx.y.z && git push origin vx.y.z
```

Both `release:*` scripts exist so a hand publish cannot skip the build.

### If a release fails partway

Check `npm view <pkg> versions` before retrying. A version already on the
registry cannot be republished, so the retry has to move to the next number —
which is why `4.0.1` is a pushed tag with no release behind it. `from-package`
makes a partial failure recoverable: rerun it and it publishes only the packages
that did not make it.

### Known gaps

- The root `postpublish` hook (`scripts/run-ci.js`, which triggers a remote
  CircleCI pipeline) never fires either, for the same `private: true` reason. It
  has been inert since the root became private.
- `publish:canary` and `publish:lts-2` still call `lerna publish` directly. The
  canary path creates no version commit so it is unaffected; `publish:lts-2`
  targets the `lts-2` branch and only works while that branch is unprotected.
- CircleCI still owns build/test on PRs, and builds in staged `--concurrency=1`
  steps rather than the plain `npm run build` these workflows use. Consolidating
  the two definitions is follow-up work.

Refining all of this further is TASK-045's remit.

---

## Quality Gates

Before marking any task complete:

1. `npm test` passes in the affected package(s)
2. The task PRD is updated (subtasks checked, status set to `complete`)
3. Changes committed with a conventional commit message
4. `PLAN.md` is updated: task status table, coverage table if applicable,
   and "What To Do Next" if the completed task unblocks something new
5. If the task changes how the monorepo is configured or structured: update this file

**Run tests before committing.** Always run `npm test` (or the affected
package's test suite) before creating a commit. `npm test` runs `biome check .`
followed by the Jest suite. Pre-commit hooks via Husky should enforce this
automatically, but hooks are not always reliable — treat manual verification as
the primary gate, not the hook. Do not commit code that has not passed its tests.

**Linting and formatting.** The monorepo uses [Biome](https://biomejs.dev) for
linting and formatting (`biome.json` at the repo root). `biome check .` lints and
checks formatting; `biome check --write .` auto-fixes violations. Biome replaces
ESLint + Prettier — do not add ESLint or Prettier dependencies or configs.

**Test propagation rule:** After any change to a shared library, run the test
suite of every package that imports it — not just the package being changed.
Many packages mock shared libs (e.g. `b-ber-logger`, `b-ber-lib`) in their own
tests; a change to the real module may require updating both the module tests
and the mock-based tests in dependent packages.

**Large task strategy:** Before starting a task that will require editing many
files (e.g. converting a package with 20+ source files to TypeScript), assess
the scope and break it into independently-completable chunks. Use parallel
subagents to work on disjoint file groups simultaneously — for example, split
a TypeScript conversion into groups of 5–8 files per agent and run them in
parallel. This avoids context-limit failures mid-task, reduces total elapsed
time, and produces checkpointable progress. A task is a good candidate for
parallel subagents when: (1) the files to change are independent of each other,
(2) each chunk can be verified in isolation, and (3) the total estimated edits
exceed what comfortably fits in one context window.

---

## GitHub Issues

GitHub issues mirror **only the work that benefits from a public, trackable
thread** — not every task. Create/maintain an issue for:

- the **feature epics**, and
- any task that is **in progress or next-up** (the active working set).

Do **not** mass-create issues for backlog stubs or already-completed tasks.
Keep existing issue links where they exist. Close the issue when its task is
marked complete or superseded.

Cross-reference both directions when an issue exists: `**GitHub Issue:** #NNN — <url>`
in the task header; a `**Task file:**` link in the issue body.

Use the **`gh` CLI** for all issue operations. Run `/sync-task-issues` to audit
and sync both sides — it has the full procedure, label table, and exact commands.

---

## Adding AGENTS.md to a New Package

When starting work on a package that does not yet have an AGENTS.md:

1. Read the package's `package.json`, `README.md`, and key source files
2. Create `AGENTS.md` in the package root with:
   - What this package does (one paragraph + data flow if relevant)
   - Dev commands (`npm test`, `npm run build`, etc.)
   - Package-specific code standards (beyond the monorepo standards above)
   - Architecture notes (key files, major abstractions)
   - Do **not** add a task system section or a `tasks/` directory — all tasks
     live in the root `tasks/` (see Task System)
3. Create `CLAUDE.md` containing only `@AGENTS.md`
4. Do not copy-paste the monorepo-level standards verbatim — reference this file instead

---

## Monorepo Dev Commands

```bash
# Install all packages and link first-party deps (npm workspaces)
npm install

# Clean all package node_modules and reinstall from scratch
npm run bootstrap:clean

# Build all packages
npm run build

# Run all tests (biome check, then jest)
npm test

# Lint and format check only (no tests)
npm run check

# Auto-fix lint and formatting violations
npm run format

# TypeScript type-check across all packages
npm run typecheck

# Check for circular imports
npm run check:circular

# Run lerna commands
npm run lerna -- <command>

# Watch mode (all packages)
npm run watch
```

See individual package `AGENTS.md` files for package-specific commands.
