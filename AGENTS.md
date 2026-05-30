# AGENTS.md — b-ber monorepo

Agent working standards for the `b-ber` monorepo. This document describes the
repository structure, package inventory, task system, commit conventions, and
coding standards that apply across all packages.

**Start here:** Read `PLAN.md` at the repo root before starting any task. It
shows what is in progress, what is blocked, the dependency graph, and which
branches are pending merge. This file (AGENTS.md) contains the standards and
conventions; PLAN.md contains the current state.

Package-specific AGENTS.md files extend this document with package-local
details (architecture, dev commands, open tasks). Always read both this file
and the relevant package AGENTS.md before starting work.

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

Project-wide tasks (those that affect multiple packages or require cross-package
coordination) are tracked in `tasks/` at the monorepo root, using the same
conventions as package-level tasks.

Package-level tasks are tracked in `packages/<name>/tasks/` within each package.

### Task ID format

`TASK-NNN` where NNN is a zero-padded three-digit integer. IDs are assigned
sequentially within their scope (root vs. package) and never reused.

### File naming

- **Open / in-progress:** `tasks/TASK-NNN.open.md`
- **Complete:** `tasks/TASK-NNN.md`

Remove `.open` when the task is marked complete. Never delete a PRD.

### PRD structure

```markdown
# TASK-NNN: Short title

**Status:** not started | in progress | complete
**Scope:** monorepo | <package-name>
**Priority:** high | medium | low

## Description

What needs to be done and why.

## Subtasks

- [ ] Discrete step
- [x] Completed step

## Notes

Decisions, blockers, relevant context.
```

### Updating progress

- Set status to `in progress` when starting; `complete` when done.
- Update subtask checkboxes as work progresses — do not batch.
- When complete: remove `.open` from filename.

---

## Commits

Follow the conventional commit format:

```
<type>(<scope>): <short imperative description>
```

The scope token matches the package being changed (see Package Inventory table above).
For changes that span multiple packages or affect the monorepo root, use `monorepo`.

**Types:** `fix`, `feat`, `chore`, `refactor`, `test`, `docs`

**Examples:**

```
fix(reader-react): removes transition from leaf elements
feat(grammar-spread): support verso/recto classification
chore(cli): update lerna to v7
refactor(lib): extract slug normalization into shared helper
docs(monorepo): add root AGENTS.md
test(parser-footnotes): add unit tests for nested footnote refs
```

Rules:

- Use imperative mood ("removes", "adds" — not "removed")
- Keep the subject line under 72 characters
- One logical change per commit; do not bundle unrelated changes
- Commit only after `npm test` passes (or the relevant package test suite passes)

---

## Branch Strategy

### Integration branch

There is one long-lived branch above `main` used for planning, documentation,
and task coordination. Its name follows the pattern `feat/<cycle-name>` (e.g.
`feat/upgrades`). All research tasks, task PRDs, and cross-cutting docs commits
land here before being merged to `main`.

Agents should commit planning and documentation work to whichever integration
branch is currently active. Check `git branch --show-current` if unsure.

### Feature branches

Implementation tasks that touch the build system, change package outputs, or
span many files should use a dedicated feature branch off the integration branch.
This keeps the work isolated and reversible — if something breaks, the branch can
be abandoned without affecting other work in progress.

**When to use a feature branch:**

- Build system changes (bundler migration, tsconfig infrastructure)
- TypeScript conversion of one or more packages
- Node.js modernization work (async/await refactor, fs-extra replacement)
- Any change where a clean revert is more valuable than a simpler history

**When to commit directly to the integration branch:**

- Task PRD creation or updates
- AGENTS.md / CLAUDE.md / README updates
- Research findings
- Small, self-contained bug fixes with no blast radius

### Naming convention

```
feat/<descriptive-slug>          # implementation work
feat/<descriptive-slug>-<pkg>    # per-package slice of a larger migration
```

**Examples in use:**

```
feat/upgrades           # current planning integration branch
feat/vite-migration     # webpack → Vite (TASK-006, TASK-007)
feat/ts-stage-1         # TypeScript Stage 1 (TASK-008 through TASK-012)
feat/ts-stage-2         # TypeScript Stage 2 (parsers, grammars)
feat/node-modernization-tasks   # Node.js modernization for b-ber-tasks
```

### Merge policy

Feature branches merge into the integration branch (not directly to `main`).
The integration branch merges to `main` when a coherent set of work is complete
and `npm test` passes cleanly. Do not force-push to `main`.

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

---

## Adding AGENTS.md to a New Package

When starting work on a package that does not yet have an AGENTS.md:

1. Read the package's `package.json`, `README.md`, and key source files
2. Create `AGENTS.md` in the package root with:
   - What this package does (one paragraph + data flow if relevant)
   - Dev commands (`npm test`, `npm run build`, etc.)
   - Package-specific code standards (beyond the monorepo standards above)
   - Architecture notes (key files, major abstractions)
   - A task system section pointing to `tasks/` within the package
3. Create `CLAUDE.md` containing only `@AGENTS.md`
4. Do not copy-paste the monorepo-level standards verbatim — reference this file instead

---

## Monorepo Dev Commands

```bash
# Bootstrap all packages (install + link)
npm run bootstrap

# Build all packages
npm run build

# Run all tests
npm test

# Run lerna commands
npm run lerna -- <command>

# Watch mode (all packages)
npm run watch
```

See individual package `AGENTS.md` files for package-specific commands.
