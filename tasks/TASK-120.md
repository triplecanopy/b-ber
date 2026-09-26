# TASK-120: Clear the dependency vulnerability backlog

**Epic:** Dependency health
**GitHub Issue:** #608 — https://github.com/triplecanopy/b-ber/issues/608
**Scope:** monorepo

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
- [x] Remove `sass-lint` — declared in root devDependencies, referenced by no
      script, config or source file since 2019; abandoned upstream (already marked
      DEPRECATED in `docs/diagrams/07-external-dependencies.md`). 6 alerts, and it
      dragged in `ajv`, `merge`, `minimist` and `shelljs`
- [x] Remove `redux`, `react-redux` and `redux-thunk` from the root
      devDependencies — TASK-106 removed Redux from `b-ber-reader-react` but left
      the root declarations. No import anywhere; the only source mentions are two
      comments describing what the built-in store replaced
- [x] Remove `bs-html-injector` — it was carrying the browser-sync file-watch
      config and nothing else; Browsersync's own `files` option takes the identical
      `{match, fn}` shape (`@types/browser-sync` `FileCallback`). Verified both
      forms fire before switching. Kills `request` and `xmldom`, whose 16 advisories
      (including a critical) have **no patch** — the packages are abandoned
- [x] lerna 8 → **10** (coordinate with TASK-116, which needs it anyway) — went
      to 10, not 9: 10.0.1 is `latest` and both carry the OIDC support TASK-116
      needs, so stopping at 9 would only mean doing this twice. Dependabot's #530
      (8 → 9) is stale and can be closed
- [ ] `axios`, `xmldom`, `postcss`, `js-yaml`, `undici` — vestigial check, then bump
- [ ] Triage and close/merge the 38 open PRs
- [x] `@types/node` 14 → **^24** (not 26: `@types/node`'s major should track the
      runtime, and we run Node 24). Introduces no new type errors — the six
      packages that fail `typecheck` fail identically without it, and are
      TASK-119's remit. **Dependabot closed #531 itself on 2026-09-24** once the
      major-ignore landed, so it will never propose this again; majors are now
      ours to do deliberately, which is the policy working rather than failing
- [ ] Re-measure alerts and record the new distribution

## Notes

- **Check "is it even used?" before bumping.** Every high-value action here so far
  has been a deletion, not an upgrade, and Dependabot cannot suggest one. Its
  proposal for `tar` was a risky major bump of dead weight; it had nothing to say
  about `sass-lint` or the Redux trio, which no version could have fixed.
- **A dependency removal is not finished until the root manifest is checked.**
  TASK-106 removed Redux from `b-ber-reader-react` and the root kept declaring
  `redux`, `react-redux` and `redux-thunk` for three months. Worth a sweep of the
  root devDependencies against actual imports as a follow-up — these three were
  found incidentally while auditing Dependabot group patterns, not by looking.

### lerna 8.2.4 → 10.0.1 (2026-09-23)

Verified against the published package and the v9/v10 release notes, then
exercised rather than assumed.

**Nothing in our usage changed.** The full surface — `lerna run --stream/--scope/
--concurrency`, `lerna exec --no-bail`, `lerna clean`, `lerna changed`,
`lerna version --no-git-tag-version --force-publish`, `lerna publish from-package`,
`--canary`, `--dist-tag` — is intact. `lerna repair` ran all 34 migrations and
reported the workspace already up to date, leaving `command.publish.message`
where it is.

Checked because they were the plausible breakages:

| Concern | Finding |
| ------- | ------- |
| `--force-publish` removed? | No. Still overloaded to boolean/string/array, so **`--force-publish="*"` works** — exercised, bumped all 37 in lockstep |
| `--no-git-tag-version` semantics | Unchanged: "Do not commit or tag version changes." Run logged `Skipping git tag/commit`, `Skipping git push`, `Skipping releases`, and left the bump uncommitted — which is exactly what `build-release-commit.js` consumes |
| `lerna clean` dropped with `@lerna/legacy-package-management`? | **No.** Only `add`, `bootstrap` and `link` were removed; `clean` is still a first-class command. `bootstrap:clean` is safe |
| lerna.json schema | `packages`, `npmClient`, `version`, `command.version.exact` all still valid. `command.publish.message` is undocumented in the v10 schema but still honoured — `lerna repair` declined to move it |
| conventional-changelog rewrite (v10) | No impact. Our `changelog` script calls `conventional-changelog-cli` directly and `command.version.conventionalCommits` is unset, so lerna never generates a changelog here |

**The one real behaviour change: `EBEHIND` (v10).** `lerna version` and
`lerna publish` now throw in CI when the checkout is behind the remote; previously
that only happened outside CI. Left at the default `error` in both workflows, on
purpose — the opt-out `--ci-behind-behavior=skip` exits 0 *without doing the work*,
so a release would appear to succeed and publish nothing. Documented inline in both
files.

Also: Node floor raised to 22.13.0 (lerna 10 is ESM-only), so the root `engines`
moved from `>= 22.x` to `>= 22.13.0` to match. CI already runs 24.

**Alert payoff:** `tar` goes 6.x → **7.5.22**, clearing the last critical (it wanted
7.5.19), and nx's `axios` goes to **1.18.1**, clearing that cluster. The only
remaining `axios` is `browser-sync` → `localtunnel` → `0.21.4`, which is the
browser-sync 3 decision.

### Re-measured 2026-09-23 (after the `tar` removal)

**194 open alerts**, down from 422. Critical 23 → 4.

The remaining backlog is mostly *not* ours to pin or bump:

| | Alerts |
| --- | ------ |
| On a dependency we declare | 72 |
| **Purely transitive** | **122 (62%)** |

And the transitive half concentrates into four roots:

| Root | Alerts | Pulls in |
| ---- | ------ | -------- |
| `browser-sync` | 37 | axios, cookie, immutable, send, serve-static, ws, socket.io-parser |
| `lerna` | 25 | brace-expansion, minimatch, nx, sigstore, tmp, postcss-selector-parser |
| `bs-html-injector` | 21 | request, xmldom, form-data |
| `cheerio` | 12 | undici |

`browser-sync` + `bs-html-injector` is 58 alerts — 30% of the total — from one
dev-server stack behind a single file, `packages/b-ber-tasks/src/serve/index.ts`.
`bs-html-injector` last shipped in 2022 and is what drags in the deprecated
`request` and `xmldom`. **Removed** — see the subtask above. `lerna`'s 25 go with
the 8 → 9 upgrade already on this list.

**`browser-sync` 2.29.3 → 3.0.4 is a separate decision**, not yet made. The case is
strong: v3 drops `localtunnel` entirely, which is the sole source of `axios@0.21.4`
and roughly 23 of those 37 alerts, and it pins `send: ^0.19.0`, `serve-static:
^1.16.2` and `immutable: ^3` (→ 3.8.4) — all the patched versions the advisories
ask for. The costs are that `@types/browser-sync` is stuck at 2.29.1 with no v3
types, and `serve/index.ts` reaches into `bs.instance.utils.openBrowser` and
`bs.instance.setOption`, which are not public API and are exactly what a major
moves. Dev-only, so the blast radius is `bber serve`.
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
