# TASK-163: Load the project explicitly and add BuildContext behind a State shim

**Epic:** Build pipeline & directive redesign
**GitHub Issue:** #826 — https://github.com/triplecanopy/b-ber/issues/826
**Scope:** b-ber-lib, b-ber-cli, b-ber-tasks

## Description

Plan step 1 of [TASK-160](./TASK-160.md): "`loadProject` + `BuildContext` + the `State` shim".

`State` reads the whole project when it is imported, and "the current build"
is one global string. This task adds the explicit replacement and keeps
`State` working on top of it, so the rest of the migration can move one task
at a time:

- `loadProject(root, overrides)` reads `config.yml`, `metadata.yml`,
  `media.yml`, the navigation and the theme, explicitly. Nothing reads the
  disk at import time.
- `BuildContext` (project, target, resolved config, paths, logger), one per
  target per run, passed down.
- **The shim.** `runBuild` stores the context in an `AsyncLocalStorage`, and
  `State`'s getters read it. TASK-160's spike showed this reaches code inside
  markdown-it render rules and stays separate under concurrent targets, and
  what the shim has to scope: `build`, `config` and `hash`, a per-context
  `reset()`, and the per-target collections on the context.
- **Config layering:** defaults ← `config.yml` ← its `<target>:` section ←
  `--config` ← CLI flags. This restores per-build sections, ignored since
  2019. No GitLab project has one, so no existing output changes.

The only behaviour change is that per-build config starts being applied.
TASK-152's golden output is otherwise unchanged.

## Subtasks

- [x] `loadProject(root, overrides)`; no import-time I/O in `b-ber-lib`
- [x] `BuildContext` type and a `runBuild` that creates one per target
- [x] The `AsyncLocalStorage` shim: `build`, `config`, `hash`, per-context `reset()`, collections on the context
- [x] Config layering; flip `build-config.test.js`'s defect test
- [x] CLI flags are applied before anything reads config. Today `--theme` and `--dist` are ignored and `--src` breaks the build, because `State` computes paths at import ([TASK-162](./TASK-162.md) bug 1)
- [x] The golden test passes unchanged; TASK-153's boundary tests pass

## Notes

- Design: [TASK-160](./TASK-160.md), "The pieces", "Config resolution", "Migrating without a
  big bang: the State shim", and Findings, "spike".
- Do alongside TASK-180, [TASK-162](./TASK-162.md)'s schema, so every config read changes once.
- Unblocks TASK-164, TASK-165 and TASK-177.

## Findings

### 2026-11-25: how it was done

**`b-ber-lib`:**
- `Project.ts` holds the reading. `loadProject(root, overrides)`, plus the
  loaders `State` and `loadProject` now share, so there is one implementation.
  The overrides apply before anything is read.
- **Layering:** `resolveConfig` gives defaults ← `config.yml` ← the
  `<target>:` section ← the overrides. `mergeConfig` replaces arrays rather
  than merging them by index (TASK-162's audit bug 3).
- **Limit:** the source directory, theme and themes directory come from
  `config.yml` and the overrides only. A target's section can't change them,
  because the project is read once for every target.
- `BuildContext.ts`: `createBuildContext`, `runInBuildContext`,
  `currentBuildContext` and `runBuild`. Targets still build one at a time;
  running them concurrently is TASK-166.

**The shim.** `State`'s constructor replaces ten fields with accessors:
- **The fields:** `build`, `config`, `hash`, `sequence`, `builds`, and
  `metadata`, `media`, `theme`, `video`, `audio`.
- **In a context** they read and write the context. `builds` returns one
  object per context, keyed by its target, because callers mutate it.
  `reset()` re-resolves the target's config and gives a new hash, and never
  changes the target.
- **Outside a context** they behave as before.
- **Checked by mutation:** with the routing turned off, 4 of the 17 new tests
  fail.

**No I/O at import.** `State` reads nothing until a field is read, and then
only that field's part of the project, after the config. Two consequences:
- **Part by part matters.** `sass` and `scripts` read an option from
  `state.config` when they are imported (TASK-162's audit bug 4). When that
  loaded the whole project from `config.yml`'s `src`, `--src` failed on
  `_project/toc.yml` before the build's context existed.
- **Theme packages:** the built-in themes are required on first use too,
  since each lists its fonts and images directories as it loads.

**The CLI** validates the flags and the `--config` file against `config.yml`
(`readConfig`), with the same warnings as before, each now once rather than
once per format. It calls `loadProject` with them, then
`runBuild(project, targets, …)`. It no longer resets `State` or sets
`state.build`.

**Two more fixes were needed for `--src`:**
- **`ensure`** hardcoded `_project/` and `_project/toc.yml`. It takes the
  source directory now, defaulting to `_project`.
- **`cover`** worked out the path of `metadata.yml` when it was imported. It
  now does so when it runs. This flips TASK-153's defect test.

**Verified with the real CLI on kitchen-sink:**

| Run | Result |
| --- | ------ |
| `bber build web --dist other` | writes `other-web/` |
| `bber build epub --theme b-ber-theme-sans` | the stylesheet is the sans theme's |
| `bber build web --src content`, with `_project` renamed | builds all 25 pages, and scaffolds no `_project/` |
| `web: { private: true }` in `config.yml`, then `bber build web reader` | all 25 web pages are `noindex`; no reader page is |

`bber build web --theme b-ber-theme-sans` fails in sass. So does
`theme: b-ber-theme-sans` in `config.yml`: the sans theme's web build is
broken, which is TASK-142 (#711), not the flag.

**Gates:**
- `npm test`: 168 suites, 1,663 tests;
- `typecheck` passes;
- the golden test passes unchanged for epub, web, reader and sample;
- the CLI e2e project passes, 31 of 31.

**Left for later tasks:**
- **`cover` still draws a generated cover's text from metadata read at
  import.** With `--src`, a project that lists no cover gets a generated
  cover with the text from `config.yml`'s `src`. TASK-165 makes the task a
  function of the context.
- **`sass` and `scripts` read their options at import**, so those two
  options come from `config.yml`, not from the build's context or flags.
  TASK-180 moves the reads into the tasks.
- **A single test file run on its own from the repo root** still fails where
  it uses TASK-153's `createProject`. Jest runs a lone file in-band, where
  `process.argv` looks like a command, so `State` loads from the repo root.
  It is better than before: on `main` those files fail at import and run no
  tests, while now only the tests that touch `State` first fail.
