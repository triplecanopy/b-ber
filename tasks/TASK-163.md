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

- [ ] `loadProject(root, overrides)`; no import-time I/O in `b-ber-lib`
- [ ] `BuildContext` type and a `runBuild` that creates one per target
- [ ] The `AsyncLocalStorage` shim: `build`, `config`, `hash`, per-context `reset()`, collections on the context
- [ ] Config layering; flip `build-config.test.js`'s defect test
- [ ] CLI flags are applied before anything reads config. Today `--theme` and `--dist` are ignored and `--src` breaks the build, because `State` computes paths at import ([TASK-162](./TASK-162.md) bug 1)
- [ ] The golden test passes unchanged; TASK-153's boundary tests pass

## Notes

- Design: [TASK-160](./TASK-160.md), "The pieces", "Config resolution", "Migrating without a
  big bang: the State shim", and Findings, "spike".
- Do alongside TASK-180, [TASK-162](./TASK-162.md)'s schema, so every config read changes once.
- Unblocks TASK-164, TASK-165 and TASK-177.
