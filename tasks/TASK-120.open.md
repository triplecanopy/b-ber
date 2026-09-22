# TASK-120: Clear the dependency vulnerability backlog

**Status:** in progress
**Feature:** Upgrade tooling
**Scope:** monorepo
**Priority:** high
**GitHub Issue:** (pending)

## Description

GitHub reports **422 open Dependabot alerts** on `main` and there are **38 open
Dependabot PRs**, the oldest from 2026-07-17. Every push prints the warning.

Measured 2026-09-22:

| Severity | Count |
| -------- | ----- |
| critical | 23 |
| high | 255 |
| medium | 131 |
| low | 13 |

**The count is dominated by a handful of packages, not spread thin:**

| Package | Alerts | Share |
| ------- | ------ | ----- |
| `tar` | **248** | 59% |
| `axios` | 28 | 7% |
| `xmldom` | 16 | |
| `postcss` | 15 | |
| `js-yaml` | 14 | |
| `undici` | 12 | |
| `brace-expansion` | 9 | |
| `image-size` | 8 | |
| `minimatch`, `markdown-it` | 4 each | |

So "422 vulnerabilities" is far more tractable than it reads — it is a small number
of stale packages counted across many manifest paths.

### Safety check first

These branches date from 2026-07-17, days after the
[[worm incident]] force-push (2026-07-09, recovered 07-13). All 38 Dependabot
branches were scanned for the `_$_f9de` marker: **0 hits.** Safe to work with.

## Progress: `tar` removed from 19 packages (59% of the alerts)

`tar@^6.1.11` was declared as a **runtime dependency by 19 packages** — including
implausible ones like `b-ber-grammar-epigraph`, `b-ber-resources` and
`b-ber-reader-react`, which is a browser bundle — and referenced **nowhere** in any
source, script, or built `dist`. A copy-paste artifact.

Removed from all 19. This is better than the version bump Dependabot proposed
(#549, `tar` 6 → 7): it is a **major** bump of a package nothing uses, so removing
it is both safer and more complete.

After removal, `tar@6.2.1` survives only as a **dev**-transitive of lerna
(`lerna → @lerna/create → pacote → node-gyp → make-fetch-happen → cacache → tar`).
The consumer-facing improvement is the real win: `tar` was previously installed by
anyone depending on those 19 published packages, and now is not installed at all.

**Verified:** `npm run build` exit 0, `biome check` clean, 130/130 suites and 1022
tests, no circular deps, and a real `bber new` project builds both `epub` and
`reader` — the EPUB path being exactly where a tar dependency would have mattered.

**Audited for the same pattern elsewhere:** every runtime dependency declared by 3
or more packages was checked for source references. All 14 are genuinely imported.
`tar` was the only vestigial one — this is bounded, not the tip of an iceberg.

## Remaining work, in value order

1. **lerna 8.2.4 → 9** (Dependabot #530). Removes the last `tar@6` path *and*
   unblocks TASK-116 (OIDC trusted publishing needs lerna 9). One upgrade, two
   problems — do this next.
2. **`axios` (28), `xmldom` (16), `postcss` (15), `js-yaml` (14), `undici` (12).**
   Check each for the `tar` pattern — declared but unused — before bumping.
   `xmldom` in particular is long deprecated and may be replaceable rather than
   upgraded.
3. **Triage the 38-PR backlog.** Several are majors needing their own assessment:
   `typescript` 6 → 7, `@types/node` 14 → 26, `mime-types` 2 → 3, `css-tree` 2 → 3.
   Decide which to take, close the rest with a reason so the list stops being noise.
4. **`@types/node` is at 14.18.12 while the repo runs Node 24** — ten majors stale.
   Worth fixing on its own merits. Note it does **not** explain TASK-119's
   typecheck failures: 85 of `b-ber-templates`' 90 errors are TS7006/TS7031
   implicit-`any`, i.e. missing annotations, not wrong node types.

## Subtasks

- [x] Measure the real distribution rather than trusting the headline count
- [x] Scan all 38 Dependabot branches for the worm marker
- [x] Remove vestigial `tar` from 19 packages; verify build, tests, circular deps
      and a real EPUB/reader build
- [x] Audit every runtime dep declared by 3+ packages for the same pattern
- [ ] lerna 8 → 9 (coordinate with TASK-116, which needs it anyway)
- [ ] `axios`, `xmldom`, `postcss`, `js-yaml`, `undici` — vestigial check, then bump
- [ ] Triage and close/merge the 38 open PRs
- [ ] `@types/node` 14 → current
- [ ] Re-measure alerts and record the new distribution

## Notes

- **Check "is it even used?" before bumping.** The single highest-value action here
  was a deletion, not an upgrade, and Dependabot cannot suggest that. Its proposal
  for `tar` was a risky major bump of dead weight.
- With TASK-117's gate now required on `main`, each Dependabot PR must pass
  `build-and-test` and be up to date — so they can no longer be merged blind, but
  stale ones will need refreshing.
- The alert count is per manifest path, so removing a dependency from N workspace
  manifests clears roughly N× its advisories. Expect the headline number to drop
  much faster than the number of packages touched.
- Related: TASK-116 (needs the lerna 9 upgrade this task also wants), TASK-037
  (configured Dependabot grouping/target branch), TASK-119 (typecheck — the
  `@types/node` staleness is adjacent but not its cause), TASK-117 (the gate these
  PRs now have to satisfy).
