# TASK-123: Rewrite the Dependabot rules

**Epic:** Dependency health
**GitHub Issue:** #637 — https://github.com/triplecanopy/b-ber/issues/637
**Scope:** monorepo

## Description

Make Dependabot surface only what is worth a human's attention. The existing config
(TASK-037) has sensible grouping but no version-policy rules, and labels everything
`security` including plain version bumps.

### Rules to add

| Rule | Why |
| ---- | --- |
| `ignore: update-types: ["version-update:semver-major"]` | The "no majors" rule the user asked for. **Must be scoped this way** — an `ignore` naming only a dependency expands to `>= 0` and suppresses its *security* updates too |
| `versioning-strategy: increase` | With exact pins (TASK-122), bump the pin rather than widening the range |
| `rebase-strategy: disabled` | Dependabot auto-rebases open PRs when `main` moves. With TASK-117's gate required and `strict: true`, that means a CI storm on every merge. Rebase deliberately instead |
| `commit-message: {prefix: "chore(deps)", include: "scope"}` | commitlint enforces conventional commits; make Dependabot comply by construction |
| `labels: ["dependencies"]` | Stop labelling version bumps `security`. Reserve `security` for actual alerts so the label is usable for triage |
| `schedule: {interval: weekly, day: monday}` | Batch arrivals into one predictable window |
| `groups` | Keep the existing groups; **verify the `minor-patch` catch-all works** — it declares `update-types` with no `patterns`, which needs confirming |

### Settled 2026-09-23

- **`versioning-strategy: increase` is not in this config.** It bumps a range's
  lower bound, which means nothing against the `^` specifiers still in the tree. It
  lands with TASK-122 when specifiers are pinned exact. Dropping it is what
  un-blocks this task from TASK-122 — see Notes.
- **`open-pull-requests-limit` stays at 10.** Setting it to 0 would disable version
  updates entirely while keeping security PRs, which is tempting but lets everything
  rot. With majors ignored and the groups in place, 10 is not a constraint that will
  bind.
- **The `minor-patch` catch-all works.** PR #586 is a single grouped PR carrying 30
  updates, which is the catch-all doing its job. `patterns: ['*']` is now explicit
  rather than implied.
- **Dependabot is not erroring.** Its recent jobs all report `success`, and PRs
  already arrive scoped to `/packages/*` — it resolves the workspace manifests from
  the root lockfile on its own, so no per-directory entries are needed. The 37
  manifests are not causing timeouts.
- **GitHub Actions keeps its majors.** The major-ignore is scoped to the npm
  ecosystem only. Actions version their whole runtime in the major
  (`actions/checkout` v4 → v5 is the normal upgrade path) and Dependabot's advisory
  coverage for the ecosystem is thin, so ignoring majors there would freeze them on
  an old runtime with nothing to unfreeze them.
- **Group hygiene.** Dropped `eslint*`/`@eslint/*` (Biome replaced ESLint in
  TASK-015), `webpack*` (Vite, TASK-006/007) and `@reduxjs/*` (Redux removed in
  TASK-106) — none are declared anywhere any more. Added `@swc/*` (27 manifests)
  and `@testing-library/*` (1).

### Evidence from the first PR under these rules (#643, 2026-09-24)

The config merged at 04:09 UTC; Dependabot opened #643 at 04:22, so it is the
first real test. Three things came out of it.

**1. `chore(deps)(deps):` — the prefix was wrong.** `include: 'scope'` makes
Dependabot append `deps`/`deps-dev` *itself*, so `prefix` must not already carry
it. Fixed to `prefix: 'chore'` + `include: 'scope'`. `prefix-development` is only
needed to change the *type* word (e.g. `maint`) and has been dropped. The
`github-actions` block had the same bug and now uses `prefix: 'chore(actions)'`
with no `include`, since scoping it would produce `chore(deps)` and be
indistinguishable from an npm bump.

**2. A major got through the ignore.** #643 carried
`@types/use-sync-external-store` `^0.0.6 → ^1.7.0`, which is `0 → 1` and major by
any reading. GitHub's reference documents `dependency-name` as "optionally using
`*` to match zero or more characters" but says nothing about whether `*` crosses
the `/` in a scoped name, and there are no scoped examples. Rather than infer,
the config now carries a second rule for `@*/*`. **This needs confirming against
the next grouped PR** — if a scoped major still appears, the cause is something
other than the wildcard and the whole approach needs rethinking.

**3. "No majors" does not mean "no breaking changes."** Dependabot classifies
`0.x` bumps as minor, so the ignore correctly let these through:

| Package | Bump | Why it matters |
| ------- | ---- | -------------- |
| `pureimage` | `^0.1.6 → ^0.4.20` | generates the default cover (`cover/index.ts`) |
| `image-size` | `^0.8.3 → ^0.9.7` | three packages; 0.9 changed the export shape |
| `markdown-it-front-matter` | `^0.1.2 → ^0.2.4` | |

Under the 0.x convention each of these is breaking. The policy as written does not
protect against them, and that is worth an explicit decision rather than a
surprise — either accept it, or add `0.x` minors to the ignore and upgrade those
deliberately.

**Also in #643: a js-yaml downgrade.** `packages/b-ber-testing` would go
`^4.1.0 → ^3.15.2` while its specs call `yaml.load()`, the v4 API — in v3 that
name is the *unsafe* loader, and `@types/js-yaml@^4` would no longer match what is
installed. This is the `js-yaml` 3-vs-4 split TASK-122 flagged, and Dependabot
resolving it downward. Do not let a grouped PR settle that conflict; TASK-122
should.

### Resolved 2026-09-25: the major-ignore does not suppress security updates

**#649 is the proof.** `image-size` `0.8.3 -> 2.0.4` — a major, under a config that
ignores majors — arrived as a security fix, because the four open `image-size`
advisories are first patched in 2.0.3. That was the one rule that could quietly
reduce coverage, and it behaves as documented: **no majors as routine
maintenance, majors when an advisory requires one.** Exactly the stated policy.

### The scoped-major hole was the groups, not the ignore

`@*/*` alone did **not** work. #648 was built on the very commit that added it and
still carried `@types/use-sync-external-store` `0.0.6 -> 1.7.0`.

The cause is grouping: a group with no `update-types` accepts every update type,
and `types` matched `@types/*` with no such filter. Every group now declares
`update-types: ['minor', 'patch']` via a YAML anchor, so a major cannot join one
regardless of how `ignore` and grouping interact. The `@*/*` rule is kept as belt
and braces with a note recording that it was not sufficient on its own.

### 0.x minors are now held back, by enumeration

Semver treats a minor bump below 1.0.0 as breaking; Dependabot classifies it
`semver-minor`, so the major rule never covered it. #643 would have taken
`pureimage` 0.1 -> 0.4 — the library that renders the default cover — as routine
maintenance.

There is no general switch for this, so the nine 0.x dependencies are enumerated
with `version-update:semver-minor` ignores. An enumerated list of something that
changes is exactly the shape that drifts, so
**`scripts/check-zero-major-deps.js`** fails the build when the list and the
manifests disagree — in either direction, including an entry left behind after a
package reaches 1.0.0. It runs inside `npm test`.

### js-yaml is held until TASK-122

Both #643 and #648 proposed `b-ber-testing`'s `^4.1.0 -> ^3.15.2` — a downgrade,
because a grouped update resolves the repo's 3-vs-4 split downward. Its specs call
`yaml.load()`, the v4 API, which in v3 is the *unsafe* loader. Ignored outright
until TASK-122 settles the conflict deliberately; the entry carries its own
removal condition.

### Still to verify

**Does a security fix requiring a major still arrive?** This is the one rule that
could quietly reduce security coverage, and the sources disagree: GitHub's options
reference says `ignore` does not suppress security updates at all, while the
community write-up in the References warns that a bare `dependency-name` with no
`update-types` expands to `>= 0` and does suppress them. This config always carries
`update-types`, which should be the safe form — but it is worth confirming against a
real advisory rather than trusting either source.

## Subtasks

- [x] Add the rules above to `.github/dependabot.yml`
- [x] Verify the `minor-patch` catch-all group actually catches everything
- [x] Test that a major-version *security* fix is not suppressed by the major
      ignore — **confirmed by #649** (`image-size` 0.8.3 -> 2.0.4, advisory
      patched in 2.0.3)
- [x] Fix the doubled `chore(deps)(deps)` prefix
- [x] Confirm the `@*/*` rule actually stops scoped majors — **it does not**;
      closed instead by putting `update-types` on every group
- [x] Hold back 0.x minor bumps, with a check so the list cannot drift
- [x] Check Dependabot run logs for timeouts or manifest errors — clean
- [x] Decide on `open-pull-requests-limit` and record the reasoning — stays at 10
- [x] Split `security` / `dependencies` labels and confirm both exist

## References

- [Optimizing PR creation for version updates](https://docs.github.com/en/code-security/tutorials/secure-your-dependencies/optimizing-pr-creation-version-updates)
  — grouping, limits, and scheduling
- [Customizing Dependabot security PRs](https://docs.github.com/en/code-security/dependabot/dependabot-security-updates/customizing-dependabot-security-prs)
  — which `dependabot.yml` keys leak into the security path
- [Ignoring a dependency without blocking security updates](https://pydevtools.com/handbook/how-to/how-to-ignore-a-dependency-in-dependabot-without-blocking-security-updates/)
  — the scoping trap this task must verify

## Notes

- **Re-sequenced 2026-09-23: this no longer waits on TASK-122.** The only rule that
  needed exact pins was `versioning-strategy: increase`, and it has been deferred to
  TASK-122 itself. The major-ignore works against caret ranges perfectly well — it
  concerns the update Dependabot proposes, not how the specifier is written. So the
  policy ships now and pinning is decided separately, on its own merits.
- Parent: TASK-121. Feeds TASK-124 — the backlog should be regenerated under these
  rules, not the old ones.
