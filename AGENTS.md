# AGENTS.md — b-ber monorepo

Agent working standards for the `b-ber` monorepo. This document describes the
repository structure, package inventory, task system, commit conventions, and
coding standards that apply across all packages.

**Start here:** Run `git branch --show-current` before doing anything. The
active branch determines where your commits land. Implementation work belongs
on the appropriate feature branch (e.g. `feat/ts-stage-1`, `feat/vite-migration`);
planning and docs belong on the integration branch (`feat/upgrades`). If you are
not on the right branch, switch before making any changes. PLAN.md shows which
branch each task belongs on.

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
group tasks by feature in `PLAN.md`. The six features are:

- **Upgrade tooling**
- **Migrate JS→TS**
- **Unit test coverage**
- **E2E testing**
- **Node.js modernization**
- **React 19 (reader-react)**

Every task created going forward must fall under one of these. If a task does
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

**Integration branch** (`feat/<cycle-name>`, e.g. `feat/upgrades`): long-lived
branch for planning, docs, and completed feature branches. Commit task PRDs,
AGENTS.md updates, research, and small bug fixes here. Check
`git branch --show-current` before committing.

**Feature branches:** Use for implementation work that touches the build system,
changes package outputs, or spans many files. Keeps the work isolated and
reversible.

- Use a feature branch for: build system changes, TypeScript conversions,
  Node.js modernization, any change where a clean revert matters
- Commit directly to the integration branch for: task PRDs, docs, research,
  small self-contained fixes

Naming: `feat/<descriptive-slug>` or `feat/<descriptive-slug>-<pkg>` for
per-package slices.

Feature branches merge into the integration branch. The integration branch
merges to `main` when `npm test` passes cleanly. Do not force-push to `main`.

### 🛑 Dispatching subagents in isolated worktrees — read before spawning

**Worktree isolation bases the new worktree off the repository's DEFAULT branch
(`main`), NOT the branch you are currently on.** `main` tracks the last release
and is usually far behind the active integration branch (`feat/upgrades`). A
subagent cannot detect this from `git branch --show-current` (it sees its own
fresh `worktree-agent-*` branch) and AGENTS.md alone will not save it. This bit
us on 2026-06-19: three worktree subagents branched off `main` (the `3.1.0`
commit), edited stale task files and an old `package.json`, and their branches
could not be merged without clobbering newer work — the orchestrator had to
reconcile by hand.

**The orchestrator (the spawning agent) MUST, in every worktree subagent's
prompt:**

1. **Pin the base trunk as the first step:** instruct the subagent to run
   `git reset --hard <trunk>` (e.g. `git reset --hard feat/upgrades`) before
   doing anything else. This re-points the fresh worktree branch (and its working
   tree) at the correct trunk; it is safe even though that trunk is checked out
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

- the **six feature epics**, and
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
