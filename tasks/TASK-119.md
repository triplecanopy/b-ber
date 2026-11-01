# TASK-119: Make `npm run typecheck` green across the monorepo

**Epic:** Migrate JS→TS
**GitHub Issue:** #606 — https://github.com/triplecanopy/b-ber/issues/606
**Scope:** monorepo

## Description

**`npm run typecheck` has never been green**, and the extent was hidden. Asked to
add it to the CI gate (TASK-117), I found it red — and found that one failing
package was masking at least six more.

`lerna run typecheck` fails fast through the dependency graph. `b-ber-logger`
failed, so everything downstream reported "not run because their dependencies
failed" rather than running. Fixing `b-ber-logger` revealed:

| Package | `tsc --noEmit` errors |
| ------- | --------------------- |
| `b-ber-templates` | **90** |
| `b-ber-grammar-media` | 17 |
| `b-ber-grammar-renderer` | 8 |
| `b-ber-grammar-frontmatter` | 4 |
| `b-ber-grammar-footnotes` | 3 |
| `b-ber-grammar-attributes` | 1 |
| | **123 total** |

**And 19 further packages still have not run** — including `b-ber-cli`,
`b-ber-tasks`, `b-ber-markdown-renderer` and every remaining grammar/parser — so
the true total is higher than 123. Each fix will reveal the next layer.

This blocks adding `typecheck` to the PR gate: a required check that cannot pass
would block every merge.

### Why it was invisible

`npm run typecheck` exits non-zero, but the summary only names the packages that
actually ran and failed. With `b-ber-logger` failing first, that was a one-line
report — easy to read as "one package has a problem" rather than "the graph
stopped here". The TypeScript migration epic (TASK-019/032) is marked complete
because every package is *authored* in TypeScript; nothing ever asserted that it
*typechecks*.

## Progress so far

**`b-ber-logger`: 43 errors → 0.** Two causes:

- **`@types/node` was not in scope** (43 → 2 errors when added). The package uses
  `process` and `util` directly but, unlike its siblings, declares no `@types/*`
  dependencies — the others pull node types in transitively (`@types/fs-extra`
  depends on `@types/node`, for instance). Naming `types: ["node"]` explicitly is
  the honest fix. Note this also cleared the `Timer.ts` nullability errors, which
  were a *consequence* of `process.hrtime` being untyped, not real defects.
- **Two genuine type errors.** `printSummary` was declared as
  `(data: unknown) => void` while its implementation destructures four named
  fields — the declaration was simply wrong. And `this.settings as
  Record<string, unknown>` is not a sufficient overlap for `LoggerSettings`, which
  has no index signature, so it widens through `unknown`.

Both are type-level only. Verified: `npm test` 130/130 suites / 1022 tests, biome
0 errors, the built `dist/index.js` still loads with `printSummary`, `info` and
`configure` present.

## Approach: staged, adopted 2026-11-01

Get to green first and type properly second, in two separate passes.

**Pass 1: green, mechanically.** Clear each error with the smallest change that
makes `tsc` accept it, mostly an explicit `any` (`(self: any)`, `as any`). Mark
every one so pass 2 can find them all. Do not refactor or "fix properly" in this
pass. The point is to stop errors masking errors (each layer cleared reveals the
next) and to get `typecheck` into the CI gate, so no **new** errors land while
pass 2 is underway.

**Pass 2: real types.** Find each marker and replace the `any` with the real type,
package by package. This is where defects surface, as `b-ber-logger`'s did. Each
marker resolved is one less unchecked spot.

### The marker: decide before starting

The plan was an explicit `any` plus a `biome-ignore` comment. **That needs one
config change first:** `biome.json` has `"recommended": false` and does not
enable `lint/suspicious/noExplicitAny`, so Biome never flags `any`. A
`// biome-ignore lint/suspicious/noExplicitAny: …` comment would suppress
nothing, and Biome reports suppressions that have no effect. Two options:

| Option | Marker | Effect |
| ------ | ------ | ------ |
| **A. Enable the rule** | `noExplicitAny: "warn"` in `biome.json`, plus `// biome-ignore lint/suspicious/noExplicitAny: TASK-119 pass 1` on each new `any` | Pass-1 `any`s are suppressed and greppable by `TASK-119`. The **85 files that already use `any`** start warning, which makes all the existing debt visible too. Biome's output gets noisier until pass 2 works through it. |
| **B. Comment only** | `// TODO(TASK-119): type this` on each new `any`; no Biome change | Greppable and quiet. Biome stays blind to `any`, so nothing stops new `any`s appearing outside this task. |

A is closer to the original intent and puts `any` under lint for good. B is
less disruptive.

**Decided 2026-11-01: option A.** The first commit of pass 1 sets
`"noExplicitAny": "warn"` under `linter.rules.suspicious` in `biome.json`.
Measured that day, the rule reports **378 warnings** on code already in the repo.
That is the existing `any` debt becoming visible; it is not new. Warnings do not
fail `biome check`, so `npm test` stays green. Pass-1 `any`s carry
`// biome-ignore lint/suspicious/noExplicitAny: TASK-119 pass 1` so they are
suppressed individually and `git grep "TASK-119 pass 1"` lists them for pass 2.

Related, from the same measurement: Biome's recommended set also includes
`noImplicitAnyLet` (45 hits, error level), which overlaps this task's TS7006
errors. It belongs to the Biome-recommended adoption task, not here.

## Subtasks

- [x] Establish that typecheck has never been green, and that the graph was
      masking failures
- [x] Fix `b-ber-logger` (43 → 0)
- [ ] `b-ber-templates` (90) — by far the largest; assess whether it is one
      systemic cause or 90 separate issues before starting
- [ ] `b-ber-grammar-media` (17)
- [ ] `b-ber-grammar-renderer` (8)
- [ ] `b-ber-grammar-frontmatter` (4)
- [ ] `b-ber-grammar-footnotes` (3)
- [ ] `b-ber-grammar-attributes` (1)
- [x] Decide the pass-1 marker: option A (enable `noExplicitAny` at warn)
- [ ] Pass 1, first commit: enable `noExplicitAny: "warn"` in `biome.json`
- [ ] Re-run after each layer clears and fix whatever the next reveals
- [ ] Once green, add `npm run typecheck` to `.github/workflows/ci.yml` and make it
      part of the required check (TASK-117)

## Notes

- **Expect the error count to grow before it shrinks.** 19 packages have not run
  yet. Do not treat 123 as the total.
- **The missing-`@types/node` pattern does *not* explain the rest — checked
  2026-09-22.** It was a promising lead (it inflated `b-ber-logger`'s count 20-fold),
  but `b-ber-templates`, the largest at 90 errors, is **85× TS7006/TS7031
  implicit-`any`** — missing annotations, not wrong node types. That package needs
  real annotation work, not a config fix. Still worth a quick check on the smaller
  packages, but do not expect it to collapse the 123.
- Separately: the root `@types/node` is pinned at **14.18.12 while the repo runs Node
  24** — ten majors stale, worth fixing on its own merits. Tracked under the
  Dependency health epic (TASK-120 / TASK-124, Dependabot #531), not here.
- A good candidate for parallel subagents per AGENTS.md's large-task strategy: the
  packages are independent and each verifies in isolation with `npx tsc --noEmit`.
  Do `b-ber-templates` alone though — 90 errors in one package is not a chunk to
  share.
- Filed under **Migrate JS→TS** rather than Upgrade tooling: the epic is marked
  complete on the grounds that every package is authored in TypeScript, which is
  true but weaker than it sounds. This is the unfinished part of it.
- Blocks the `typecheck` half of TASK-117. Related: TASK-019 / TASK-032 (the
  migration epic), TASK-117 (the PR gate).
