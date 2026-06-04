# TASK-054: Research build dependency ordering for reader → reader-react

**Status:** not started
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

## Notes

Current root `build` script for reference:

```
lerna run build --scope=@canopycanopycanopy/b-ber-reader-react
&& npm run reader:shim
&& lerna run build --scope="@canopycanopycanopy/{all-except-reader-react}"
```

The `reader:shim` step runs `npm install` inside `b-ber-reader` so that the
symlink in its `node_modules` resolves to the freshly-built dist. This is the
step that would disappear if reader-react were resolved via the workspace root
instead.
