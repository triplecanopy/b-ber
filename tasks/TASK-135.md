# TASK-135: Move every Node runtime past CVE-2026-111497

**Epic:** Node.js modernization
**GitHub Issue:** #691 — https://github.com/triplecanopy/b-ber/issues/691
**Scope:** monorepo

## Description

**CVE-2026-111497 ("Node2Shell")** is an out-of-bounds write in the Brotli
decoder bundled with Node.js. Node's advisory (October 21, 2026 security
releases) says: "An attacker who can supply Brotli data that an application
decompresses with `node:zlib` can corrupt process memory", leading to "a crash,
disclosure of process memory, or remote code execution". NVD scores it **9.8
critical**, and it is in CISA's Known Exploited Vulnerabilities catalogue.

| Line | Affected | Fixed in |
| ---- | -------- | -------- |
| 22.x and earlier | < 22.23.4 | **22.23.4** |
| 23.x – 24.x | 23.0.0 – < 24.22.1 | **24.22.1** |
| 25.x – 26.x | 25.0.0 – < 26.12.1 | **26.12.1** |

End-of-life lines (23.x, 25.x) get no fix.

### Exposure (assessed 2026-11-01)

**Our code: not affected.** Nothing in `packages/*/src` uses `node:zlib` or
Brotli. The only HTTP client call in the repo is `https.request` in
`scripts/run-ci.js`, the root `postpublish` hook, which never fires because the
root package is private. b-ber does not decompress anything from an untrusted
source, so it does not create exposure for its users. The risk is the runtime
underneath it, wherever it runs:

| Where | Node before this task | Status |
| ----- | --------------------- | ------ |
| GitHub Actions (`ci`, `release-prepare`, `release-publish`, `task-hierarchy`) | 24.22.1 | fixed, **by luck**: `node-version: 24` takes the runner image's cached 24.x without `check-latest` |
| CircleCI `build` | `cimg/node:24.14` (24.14.x) | **vulnerable** |
| CircleCI `e2e` | `node:24-bookworm`, a floating tag (updated 2026-10-28) | fixed when pulled fresh |
| Root `engines.node` | `>= 22.13.0` | admitted vulnerable versions |
| Published packages' `engines` | none declared | consumers get no signal at all (see Notes) |

### Why no bot caught this

Renovate's `[security]` PRs come from GitHub's **npm** advisories, and the Node
runtime is not an npm package. Renovate does bump `cimg/node` as a routine
version update, but that PR was held by the 3-day `minimumReleaseAge` and the
Monday schedule. So a critical runtime CVE is invisible to the policy as it
stands. This task records the manual check in AGENTS.md.

## Changes

- `.circleci/config.yml`: `cimg/node:24.14` → `cimg/node:24.22`.
- `check-latest: true` on `setup-node` in all four workflows, so each run takes
  the newest 24.x rather than the runner image's copy. The `e2e` job added by
  TASK-130 carries it too.
- Root `engines.node`: `>= 22.13.0` → `^22.23.4 || ^24.22.1 || >=26.12.1`. This
  admits exactly the patched releases on each supported line. It is advisory:
  `.npmrc` sets no `engine-strict`, so npm warns rather than refuses.
- AGENTS.md "Dependency Updates": a note that Node runtime advisories are
  outside Renovate, and the checklist for handling one.

## Subtasks

- [x] Confirm our code does not reach `node:zlib` Brotli decoding
- [x] Inventory every place a Node runtime is chosen
- [x] Pin CircleCI `build` to `cimg/node:24.22`
- [x] `check-latest: true` on every `setup-node`
- [x] Raise root `engines.node` to the patched minimums
- [x] Document the runtime-CVE gap and checklist in AGENTS.md
- [ ] Confirm the next CI run logs Node ≥ 24.22.1 in each workflow
- [ ] Update local dev machines to ≥ 26.12.1 / 24.22.1 (yours is 26.12.1 already)

## Notes

- **Published packages declare no `engines`.** `b-ber-cli` users can install it
  on any Node, including vulnerable ones. Adding `engines` to published packages
  changes what consumers see, and on the wrong range would break installs under
  `engine-strict`. That is a Node.js modernization decision, so it is not made
  here. Worth a task.
- **Should runtime updates skip `minimumReleaseAge`?** Node and the `cimg/node`
  images come from the Node project and CircleCI, not arbitrary npm publishers,
  so the supply-chain argument for a delay is weaker for them. A `packageRules`
  entry setting `minimumReleaseAge: null` for those would make Renovate's
  routine bump arrive the next Monday rather than up to 3 days later. It would
  still not raise a security PR. Not done here; a judgement for TASK-132's
  policy.
- Related: TASK-118 (retire CircleCI, which removes two of the pins), TASK-129
  (Renovate), TASK-130 (the `e2e` job), TASK-132 (dependency update policy).
