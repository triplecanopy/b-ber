# TASK-052: Test the published artifact without touching the real registry

**Status:** not started
**Scope:** monorepo
**Priority:** medium
**GitHub Issue:** #519 — https://github.com/triplecanopy/b-ber/issues/519

## Description

`lerna publish --dry-run` does not exist in any version of Lerna. Before
landing the Lerna v8 upgrade (TASK-036), we need a reliable way to exercise the
*installed, published* artifacts — especially the CLI — without touching the
real npm registry.

**Design constraint: prefer the lowest-tooling solution that works.** We do not
want to take on a new long-lived dependency (a registry server to run, version,
and maintain in CI) unless it earns its keep with concrete benefits over a
home-rolled approach. The bar for adding Verdaccio is: *what can it do that a
plain `npm pack` + install script cannot do reliably?* If nothing concrete, we
ship the script.

Evaluate two approaches and recommend one:

- **(A) Home-rolled `npm pack` + install (preferred starting point).** Build all
  packages, `npm pack` each publishable package into a staging dir, then
  `npm install` the resulting tarball(s) into a throwaway consumer project and
  run smoke tests against the installed CLI. Can live entirely as an npm script,
  delegating to a small Node script if the orchestration grows. No server, no
  new service to maintain. The one hard part to prove out: a packed
  `@canopycanopycanopy/b-ber-cli` tarball depends on the other first-party
  scoped packages, so a naive `npm i cli.tgz` will try to resolve those from the
  real registry. The script must install *all* first-party tarballs together (or
  rewrite the install to point at the local tarballs) so inter-package deps
  resolve to the freshly built code, not whatever is on npm.

- **(B) Verdaccio (only if A has a concrete gap).** A local npm proxy/registry
  that stands in for npm. It resolves the inter-package dependency problem
  "for free" because `lerna publish --registry <local>` publishes the whole set
  and a subsequent `npm i` resolves scoped deps locally (proxying everything
  else to real npm). The cost is a running service to manage in dev and CI.
  Justify adoption only if it tests something A cannot — e.g. exercising the
  actual `lerna publish` canary code path (dist-tags, version bumping, the
  publish lifecycle scripts) rather than just the packed artifact.

**Motivation (concrete, 2026-06-07):** a canary publish shipped two bugs that
were invisible in workspace/dev mode and only surfaced in the *installed,
published* artifacts:

1. `bber --version` crashed with `ENOENT … _project/toc.yml` — the bundled CLI
   eagerly loads `State`, which read project files even for a version query.
2. `bber serve` rendered a blank screen — re-bundling `b-ber-reader-react`'s
   pre-built dist left React unresolved (`Cannot read properties of undefined
   (reading 'prototype')`, then `Calling require for "react" in an environment
   that doesn't expose the require function`).

Both only reproduce after `pack`/`publish` + install, because dev mode bundles
from source. A registry-backed publish + `bber --version` + `bber serve` smoke
test would have caught them. Fixes landed on
`feat/fix-cli-version-reader-interop`.

The canary publish command in question:
```sh
lerna publish --canary --preid <name> --dist-tag <name> --force-publish="*"
```

And the simultaneous full publish:
```sh
lerna publish --force-publish="*"
```

## Subtasks

- [ ] **Prototype approach A (home-rolled `npm pack`).** Build all packages,
      `npm pack` each publishable one into a staging dir, and install into a
      throwaway consumer project. Confirm the install resolves first-party
      scoped deps to the local tarballs (not the real registry) — this is the
      make-or-break detail. Capture the exact command sequence (and whether an
      npm script alone suffices or a small Node orchestration script is needed).
- [ ] **Identify any concrete gap in A.** Enumerate what, if anything, A cannot
      test that matters: the `lerna publish` canary path itself (dist-tags,
      version bumping, lifecycle scripts), multi-package resolution edge cases,
      or `.npmrc`/auth behaviour. If A covers the real failure modes (see
      Motivation), recommend A and stop — do not add Verdaccio.
- [ ] **Only if a gap exists — scope approach B (Verdaccio).** Confirm it works
      with `@canopycanopycanopy` scoped packages and the `--registry` flag,
      determine auth requirements (`npm adduser` without a real token), and map
      the full canary run from server start through publish to install. Weigh
      the maintenance cost (running/versioning the service in dev + CI) against
      the specific gap it closes.
- [ ] **Check git-tag side effects (applies to whichever approach exercises
      `lerna publish`).** Lerna creates git tags during publish; determine
      whether a test run pollutes local git history and whether
      `--no-git-tag-version` / `--no-push` should be standard on the test command.
- [ ] **Add a published-artifact smoke test.** Using the chosen approach,
      install `@canopycanopycanopy/b-ber-cli` into a throwaway project and assert
      (a) `bber --version` prints a version from a non-project dir and (b)
      `bber serve` boots and the reader mounts without console errors. Wire into
      the `b-ber-testing` Playwright harness so the "only breaks when published"
      class of bug is caught in CI. See Motivation.
- [ ] **Evaluate for CI use.** Whatever is chosen, define the CI step that gates
      publish-path changes (CircleCI, building on the now-green pipeline from
      TASK-035/044). Favour a step that needs no persistent service.
- [ ] **Document the final workflow** — write the complete command sequence
      into TASK-036's Notes or a `docs/` file so it is repeatable by anyone
      on the team.

## Notes

Branch: `feat/upgrades`

**Bias: home-rolled first.** The two bugs in the Motivation (eager `State` load
on `--version`; React unresolved in the re-bundled reader dist) both reproduce
from a plain packed-and-installed CLI — neither requires a registry to surface.
That suggests approach A is sufficient for the failure modes we actually hit, so
start there and only reach for Verdaccio if a concrete gap appears.

**Approach A sketch (to validate):**
```sh
# build everything, then for each publishable package:
npm pack --workspace <pkg> --pack-destination ./.pack-staging
# in a throwaway consumer dir, install all first-party tarballs together so
# inter-package scoped deps resolve locally instead of from the real registry:
npm i ./.pack-staging/*.tgz
bber --version          # must print without a project dir
bber serve              # reader must mount, no console errors
```
The crux to prove out is that installing all first-party tarballs at once makes
the scoped inter-package deps resolve to local code. If npm insists on fetching
those from the registry, a small Node script can rewrite the tarballs' install
specifiers (or use `overrides`) — still no server required.

**If Verdaccio is chosen anyway:** it stores published packages in
`~/.config/verdaccio/storage` by default (delete to reset), proxies unknown
packages to real npm, and the `--no-git-tag-version --no-push` flags matter so a
test publish doesn't pollute git history. Document why they're included.

Related: [[TASK-036]] (Lerna upgrade), [[TASK-035]] (CircleCI),
[[TASK-039]] (E2E testing umbrella — natural home for the smoke test),
[[TASK-054]] (reader → reader-react build ordering — the source-bundling fix
removes the dist build-order dependency), [[TASK-058]] (reader-react polyfill
audit — the reader shell now replicates those polyfills).
