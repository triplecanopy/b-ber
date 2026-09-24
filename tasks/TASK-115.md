# TASK-115: Automate releases so they work against protected `main`

**Epic:** Upgrade tooling
**GitHub Issue:** #591 — https://github.com/triplecanopy/b-ber/issues/591
**Scope:** monorepo

## Description

Two problems, one cause: `lerna publish` does too much.

**1. It cannot run against protected `main`.** `lerna publish` runs
`lerna version` first — bump, commit, tag, **push** — and that push targets
`main`. Branch protection rejects it, and it fails *after* creating the commit and
tag. This happened on 2026-09-20 releasing TASK-112/114: a `4.0.1` commit and
`v4.0.1` tag were created, the push was rejected, npm was never reached, and the
retry had to move to `4.0.2` because a burnt version number cannot be reused. The
rule had to be disabled twice to recover. A `v4.0.1` tag is still pushed with no
release behind it.

**2. Nothing builds the packages as part of publishing.** No package defines
`prepublishOnly`, `prepare` or `prepack`, and the root's `prepublishOnly` never
fires because the root is `private: true` and is never published. So
`lerna publish` ships whatever happens to be sitting in each `dist/`.

`b-ber-tasks` had this right until `c12c5aaf` (TASK-030):

```json
"prepare": "npm run clean && npm run prepare:dist"    // 3.1.0 — npm runs this before publish
"build":   "tsdown && npm run copy"                   // 4.x   — nothing runs it at publish time
```

`reader-react` likewise had `"prepublish": "npm test"` and `"preversion": "npm
test"`. The TypeScript conversions reshaped these into plain `build` scripts and
nothing re-wired them to the publish lifecycle. **`4.0.2` shipped correct
artifacts only because the tree happened to be freshly built by hand** — the same
"right by luck" pattern as TASK-114's version module.

Note that `c12c5aaf` is the same commit behind TASK-112. One conversion caused
three defects: the asset paths, the lost publish-time build, and (via the
`version.js → version.ts` rename in a sibling commit) the stale version module.

## Chosen approach

Two GitHub Actions workflows, splitting `lerna publish`'s two halves so neither
needs a branch-protection bypass. Decided with the user over the two
alternatives — a single one-click workflow authenticated as a bypass actor
(rejected: a standing hole in the rule that applies to anything else using that
token), and a tag-triggered publish with versioning left local (rejected: keeps
the manual run-around the automation is meant to remove).

| Workflow | Trigger | Does |
| -------- | ------- | ---- |
| `release-prepare.yml` | manual `workflow_dispatch`, bump input | build, test, bump, push `release/x.y.z`, open PR |
| `release-publish.yml` | push to `main` | build, test, `lerna publish from-package`, tag `vx.y.z` |

Release UX: click the workflow, review the PR, merge. Merging *is* the release.

Key design points, all verified against lerna 8.2.4's own option definitions
rather than from memory:

- **`lerna publish from-package` performs no git operations.** It publishes every
  package whose `package.json` version is not on the registry. Protection is never
  involved. It also makes `release-publish.yml` safe on *every* push to `main`:
  with nothing new, everything is already published and the job no-ops. It guards
  on that explicitly before doing any work.
- **`--no-git-tag-version` means "do not commit *or* tag"** in lerna — not just
  "don't tag". So the bump is left uncommitted and the workflow commits it itself,
  with the same `x.y.z` subject lerna used historically.
- **The tag is created last, on `main`, only after npm accepts the release.** A tag
  can therefore never point at a version that failed to publish, nor at a commit a
  squash-merge rewrote away — which removes the "must merge with a merge commit"
  constraint an earlier draft of this design needed.
- **`--force-publish`** because `lerna.json` is fixed-mode and the workspace has
  always moved in lockstep — at `4.0.2` even untouched packages
  (`b-ber-theme-sans`, `b-ber-grammar-vimeo`, `b-ber-shapes-sequences`) were
  published. Verified against the registry.
- **Build precedes test** in both workflows, because several packages' tests import
  a sibling's built `dist`. Mirrors CircleCI's ordering.

GitHub Actions was chosen over extending CircleCI (which owns build/test today)
because the release flow needs `GITHUB_TOKEN`, the `gh` CLI and PR creation
natively; doing it in CircleCI would mean managing a GitHub PAT as a secret.

## Subtasks

- [x] Confirm the `prepare`/`prepublish` regression and pin it to a commit
- [x] Audit every package for publish lifecycle hooks; confirm the root's
      `prepublishOnly` cannot fire
- [x] Verify `--no-push`, `--no-git-tag-version`, `--force-publish`, `--yes` and
      `from-package` all exist in lerna 8.2.4, and what each actually does
- [x] Confirm fixed-mode lockstep against the registry
- [x] Write `release-prepare.yml` and `release-publish.yml`
- [x] Validate both: YAML parses, every `run` block passes `bash -n`
- [x] Exercise the registry guard both ways (published version skips, unpublished
      version releases)
- [x] Remove the `publish:latest` footgun; add `release:version` and
      `release:publish` so a hand publish cannot skip the build
- [x] Rewrite AGENTS.md § Releases around the workflows, with the manual fallback
- [ ] **Add the `NPM_TOKEN` secret** (npm automation token, publish rights to
      `@canopycanopycanopy`) — the publish workflow cannot work without it
- [x] Dry-run: triggered `release-prepare.yml` (run 35540625846). **It failed at
      Build, which is exactly what the dry run was for** — see below. Re-run needed
      after the fix
- [ ] Delete the orphan `v4.0.1` tag:
      `git push origin :refs/tags/v4.0.1 && git tag -d v4.0.1`
- [x] Merge (PR #592)
- [ ] Close #591 once the three items above are done
      (#591 auto-closed on merge via a `Closes` line and was reopened — the
      code landing is not the task finishing)

## Verification

What could be checked without a GitHub runner:

| Check | Result |
| ----- | ------ |
| Both workflows parse as YAML | ✅ |
| Every `run` block parses under `bash -n` (with `${{ }}` stubbed) | ✅ 11/11 |
| `node -p 'require("./lerna.json").version'` → `4.0.2` | ✅ |
| Registry guard on a published version (`4.0.2`) | ✅ `publish=false` |
| Registry guard on an unpublished version (`9.9.9`) | ✅ `publish=true` |
| Every lerna flag used exists in 8.2.4 | ✅ checked against `command.js` |
| `biome check` | ✅ 0 errors |

**Not yet verified, and cannot be locally:** the workflows have never run. The
first `release-prepare.yml` run is the real test, which is why the dry-run subtask
is explicit and sits before any merge.

## Dry-run findings (2026-09-20)

The first `release-prepare.yml` run failed at the Build step:

```
./copy.sh: line 24: node_modules/.bin/uglifyjs: No such file or directory
npm error code 127
```

**`copy.sh` hardcoded `node_modules/.bin/uglifyjs`, a package-local path.** A fresh
`npm ci` under npm workspaces hoists `uglify-js` to the *workspace root*
`node_modules/.bin`, so the package-local path does not exist in CI. It resolves on
a dev machine only because an incremental install happens to leave a package-local
bin link behind — `uglifyjs` exists in both places locally, which is why this never
surfaced.

Fixed by calling `uglifyjs` bare and letting npm's run-script PATH resolve it (npm
prepends every ancestor `node_modules/.bin`), plus a `command -v` check that fails
with a clear message instead of exit 127. Verified by hiding the package-local bin
and rebuilding: all four minified web scripts still produced.

**This was silently broken before TASK-112, not introduced by it.** The pre-TASK-112
`copy.sh` had no `set -e`, so a missing `uglifyjs` printed two errors, skipped every
file, and then **exited 0** because `cp` was the last command. Reproduced: exit code
0, zero web JS files produced. So any hoisted install — i.e. every CI build — has
been shipping `b-ber-tasks` without its browser scripts, and nothing caught it
because no test exercises the `web` task and the published artifacts came from local
builds. TASK-112's `set -euo pipefail` is what turned it loud.

The re-run (35540909420, against the fix branch) passed every step — Build, Lint and
test, Bump versions, Commit and open the release PR — confirming the fix and the
`@v7` action bumps in the real CI environment. It also surfaced a footgun now
documented in AGENTS.md § Releases: because it ran against a feature branch, the
"4.0.3" PR it opened (#595) carries that branch's two unmerged commits alongside the
version bump. `release-prepare.yml` must be run from `main` for a bump-only release
PR.

### Signed commits (the second dry-run failure)

With the uglifyjs fix merged, a `prepare` run from `main` produced PR #596 — and it
could not be merged: `main`'s ruleset includes `required_signatures`, and the
workflow's `git commit` as `github-actions[bot]` is unsigned
(`verified: false, reason: unsigned`). Every commit authored locally is
`verified: true / valid`, so the rule was working; the workflow was the gap.

The ruleset has **no bypass actors** (`bypass_actors: []`), so `--admin` was not a
reliable escape either. Removing the requirement was rejected — it is doing its job.

Fixed by authoring the version commit through GitHub's `createCommitOnBranch`
GraphQL mutation, which GitHub signs itself. Verified empirically before building
on it, since the size limits are undocumented:

| Probe | Result |
| ----- | ------ |
| 2.54 MB payload (lockfile + lerna.json) | accepted, `isValid: true`, signer "GitHub Web Flow" |
| 3.12 MB payload (the real 40-file bump) | accepted, `isValid: true` |
| REST view of a probe commit | `verified: true, reason: valid` |

Both probes ran against throwaway branches that were deleted afterwards. The
payload builder was also tested against a real local `lerna version` run — 40
files, base64 round-tripping to the bumped contents — and it correctly **refused**
when an unrelated file was dirty, which it caught in my own working tree during
testing.

Abandoned the 4.0.3 bump rather than merging it with a bypass: nothing had been
published, so the version number was never burnt and the fixed pipeline produces
4.0.3 again. Also deleted the orphan `v4.0.1` tag.

Also bumped `actions/checkout` and `actions/setup-node` from `@v4` to `@v7`; the run
warned that v4 targets the deprecated Node 20. Checked that setup-node v7 still
supports `registry-url` + `NODE_AUTH_TOKEN` — it does, but it removed the dummy
token fallback, so the token must be set explicitly, which `release-publish.yml`
already does.

## Notes

- The nested-heredoc approach first used for the PR body could not work — a
  heredoc terminator cannot be indented inside a YAML block scalar. Replaced with
  `printf` into a file and `gh pr create --body-file`.
- **Known gaps recorded in AGENTS.md rather than fixed here**, to keep this task
  reviewable:
  - The root `postpublish` (`scripts/run-ci.js`, triggering a remote CircleCI
    pipeline) is inert for the same `private: true` reason. Left in place rather
    than deleted, since removing it would drop a feature someone intended.
  - `publish:canary` and `publish:lts-2` still call `lerna publish` directly.
    Canary creates no version commit so it is unaffected; `publish:lts-2` works
    only while `lts-2` stays unprotected.
  - CircleCI builds in staged `--concurrency=1` steps while these workflows use
    plain `npm run build`. Two definitions of "build the monorepo" is one too
    many; consolidating is follow-up.
- Related: TASK-045 (release/changelog workflow refactor) owns further
  refinement — this task is the minimum to make releasing possible without
  disabling branch protection. Branched off `main` at `f2a399ea` (the TASK-112/114
  closeout, merged as PR #590 — the first change here to land via a PR rather than
  a local merge). TASK-112 and TASK-114 share the `c12c5aaf` root
  cause.
