# TASK-054: Research build dependency ordering for reader → reader-react

**Status:** complete
**Feature:** Upgrade tooling
**Scope:** monorepo
**Priority:** medium
**GitHub Issue:** #521 — https://github.com/triplecanopy/b-ber/issues/521

## Description

`b-ber-reader` consumes the compiled output of `b-ber-reader-react` (via a
`file:` devDependency pointing to `../b-ber-reader-react`). Because reader
imports from `dist/` of reader-react, reader-react must be fully built before
reader's Vite build starts. This forces a two-phase root `build` script:

1. Build `b-ber-reader-react` in isolation
2. Run `reader:shim` (`npm i` inside b-ber-reader to pick up the new dist)
3. Build all other packages (excluding reader-react)

Steps 1–2 are sequential and block the rest of the parallel build. The goal of
this task is to find the lowest-friction way to model a single A→B build
dependency so that every other package builds in parallel, and only
`b-ber-reader` waits for `b-ber-reader-react`.

## Investigation areas

1. **Lerna topological builds** — Does `lerna run build` with `--sort` /
   `--concurrency` respect `dependencies` / `devDependencies` declared in
   `package.json`? Would adding `b-ber-reader-react` as a real (non-`file:`)
   workspace dependency let Lerna infer the correct order automatically?

2. **npm workspaces `--workspaces` flag** — Can `npm run build --workspaces`
   honour intra-workspace dependency ordering for build scripts, or is it
   always parallel/unordered?

3. **Turborepo / Nx pipeline configuration** — Both tools model task
   dependencies explicitly (`dependsOn: ["^build"]`). Evaluate the cost of
   adopting one purely for build orchestration versus the benefit of removing
   the hand-rolled two-phase script.

4. **Changing the consumer relationship** — Instead of reader importing from
   reader-react's `dist/`, could reader import reader-react as a _peer_ and
   resolve it via the monorepo's shared `node_modules` after a single `npm run
   build` in reader-react? What changes to the vite config and the symlink
   resolution would that require?

5. **Pre-built artefact check** — Could the build script skip rebuilding
   reader-react when its source hasn't changed (e.g. using a content hash or
   `git diff --name-only` against `packages/b-ber-reader-react/src`)? This
   would keep the current two-phase structure but eliminate the wait on cache
   hits.

6. **Lerna `nx` integration** — Lerna v8 ships with optional Nx integration.
   If the monorepo is already configured for it, a `project.json`
   `targetDependencies` entry may be all that is needed.

## Deliverables

- A recommendation (one of the approaches above, or a combination) with a
  rationale explaining why it fits this repo better than the alternatives.
- An estimate of the change surface (which files change, how invasively).
- A follow-up task (TASK-055 or later) for the implementation, if the
  recommended approach requires non-trivial work.

## Findings

### Lerna v8 topological sort (Option 1) — recommended

Lerna 8.2.4 sorts builds **topologically by default** — the `--no-sort` flag is
what disables ordering. Lerna's package graph includes `devDependencies` (confirmed
from source: it iterates `["dependencies", "devDependencies", "optionalDependencies"]`
when building the graph). The `"file:../b-ber-reader-react"` entry in
`b-ber-reader`'s devDependencies already gives Lerna the graph edge it needs:
reader-react builds before reader, every other package builds in parallel.

The `reader:shim` step (`cd packages/b-ber-reader && npm i`) is also unnecessary:
the root npm workspace already creates a symlink at
`node_modules/@canopycanopycanopy/b-ber-reader-react → ../../packages/b-ber-reader-react`,
and Node's module resolution walks up the directory tree so Vite finds it without
a local copy in `b-ber-reader/node_modules`. Vite's `commonjsOptions.include:
[/b-ber-reader-react\/dist/]` in `packages/b-ber-reader/vite.config.js` already
handles the symlink-resolves-outside-node_modules case.

**One risk to verify empirically:** Confirm Lerna respects `devDependencies`
(not just `dependencies`) when sorting. If reader builds before reader-react,
move the `file:` dep from devDependencies → dependencies in reader's package.json.

### Why other options are weaker

- **npm workspaces `--workspaces` flag**: No topological ordering guarantee.
- **Turborepo/Nx**: Correct solution, but adding a full build orchestrator for one
  dependency edge is disproportionate. Lerna v8 already solves this natively.
- **Lerna Nx integration**: Nx is not configured (`nx.json` absent, no `useNx` in
  `lerna.json`). Enabling it for one edge adds config and conceptual overhead.
- **Pre-built artefact check**: Keeps the two-phase structure and adds complexity.
  No benefit over the topological approach.
- **Changing the consumer relationship**: The workspace root symlink already provides
  the correct resolution path. No vite config changes needed.

## Recommendation

Replace the root `build` script with a single `lerna run build` call (topological
sort is on by default). Remove `reader:shim` from `bootstrap:clean`. The `file:`
dep in reader's devDependencies stays — it documents the dependency and drives
Lerna's sort order.

**Change surface:** 2 lines in root `package.json`.

See TASK-057 for the implementation.

## Notes

Current root `build` script for reference:

```
lerna run build --scope=@canopycanopycanopy/b-ber-reader-react
&& npm run reader:shim
&& lerna run build --scope="@canopycanopycanopy/{$(echo `ls packages` | sed 's/ /,/g' | sed -E 's/b-ber-reader-react,?//')}"
```

The `reader:shim` step runs `npm install` inside `b-ber-reader` so that the
symlink in its `node_modules` resolves to the freshly-built dist. This is the
step that would disappear if reader-react were resolved via the workspace root
instead.

### Addendum (2026-06-07) — premise superseded

This task assumed `b-ber-reader` consumes reader-react's compiled `dist/`,
which is what created the A→B build-order edge. On
`feat/fix-cli-version-reader-interop`, `b-ber-reader` now bundles reader-react
**from source** (`vite.config.js` aliases the package to
`../b-ber-reader-react/src/index.jsx`) to fix a React-resolution bug — see
[[TASK-052]] motivation. As a result `b-ber-reader` no longer depends on
reader-react's build output at all, so the build-order dependency this task
addressed effectively goes away (reader-react's own `build` is now only for the
published standalone package). The Lerna topological-sort recommendation and
[[TASK-057]] are still valid for other graph edges, but the reader → reader-react
edge is no longer a build-ordering concern. The `commonjsOptions.include:
[/b-ber-reader-react\/dist/]` referenced in the Findings has also been removed.
