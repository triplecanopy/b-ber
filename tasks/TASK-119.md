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
