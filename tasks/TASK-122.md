# TASK-122: Pin and dedupe every dependency specifier

**Epic:** Dependency health
**GitHub Issue:** #636 — https://github.com/triplecanopy/b-ber/issues/636
**Scope:** monorepo

## Description

**388 of 392 specifiers use `^`.** Pin them all to exact versions so the manifests,
not the resolver, decide what is installed — and so Dependabot's
`versioning-strategy` has something to act on (it cannot meaningfully bump a caret
range).

`syncpack` is already a devDependency (TASK-053) with `npm run deps:dedupe`
(`syncpack lint`) and `deps:dedupe:fix` wired up. It needs a config declaring the
pinned-exact policy.

### The dedupe half is small

Only **3** dependencies disagree across packages:

| Dep | Specs | Decision |
| --- | ----- | -------- |
| `js-yaml` | `^3.12.0`, `^4.1.0` | **needs care** — v4 removed `safeLoad`/`safeDump`; check every call site |
| `@types/js-yaml` | `^3.12.10`, `^4.0.9` | follows whatever `js-yaml` lands on |
| `sass` | `^1.49.8`, `^1.70.0` | same major; take the higher |

Everything else is already consistent, so this is mostly mechanical.

### Why pin, given it means more PRs

Pinning makes every patch bump an explicit, reviewable change instead of something
that varies by install date — which is exactly the class of problem that produced
TASK-115 (a binary present locally, absent after `npm ci`). The extra PR volume is
acceptable *because* Dependabot exists and TASK-123/124 make that volume cheap.

## Re-scoped 2026-11-06

Two facts changed the plan from "pin all 388 exactly".

**Most manifests are published.** 36 of the 38 belong to packages users install
with `npm i -g @canopycanopycanopy/b-ber-cli`, and npm resolves their runtime
`dependencies` on the user's machine, without our lockfile. Exact pins there
stop consumers deduping and hold back every upstream patch, security fixes
included, until we release. So only what never reaches a user is pinned
exactly.

**Renovate, not Dependabot, now acts on specifiers.** With no `rangeStrategy`
set it used `auto`, which updates only the lockfile when the new version still
satisfies the range. 85 specifiers had fallen behind what was installed that
way, `express ^4.17.3` among them, below its 4.22.3 security fix. The same
behaviour produced the `@types/lodash` lockfile drift that TASK-139 to 141
kept reverting.

| Specifiers | Count | Now |
| ---------- | ----- | --- |
| `devDependencies` of published packages, and everything in the private root and `b-ber-testing` | 260 | exact, the installed version |
| `dependencies` of published packages | 74 | `^<installed version>` |
| `peerDependencies` | 2 | unchanged (reader-react's React range) |
| `@canopycanopycanopy/*` | — | unchanged (lerna) |

The Dependabot subtasks (`versioning-strategy: increase` in
`.github/dependabot.yml`) are dropped with Dependabot. Renovate's
`rangeStrategy: 'bump'` is the equivalent.

## Subtasks

- [x] Add a `syncpack` config with the policy above (`.syncpackrc`): one
      version per dependency, exact for dev and private, `^` for published
      runtime; peers and first-party ignored
- [x] Resolve `sass` and `@types/js-yaml` to their highest in-use version.
      `sass` is 1.100.0 everywhere; `@types/js-yaml` went with js-yaml 5
      (TASK-140)
- [x] Decide `js-yaml` 3 vs 4: neither, 5 (TASK-140)
- [x] Set every specifier from the lockfile's installed version: 311 changed,
      23 already matched
- [x] Verify nothing installed moved. All 1973 lockfile entries have the same
      version before and after. The lockfile diff is only the 38 workspace
      entries' specifier mirrors, and `npm ls` reports the same 5 pre-existing
      problems
- [x] Full gate: build, `npm test` (131/131 suites, syncpack clean),
      `check:circular`, Playwright `cli` (16/16), and the kitchen-sink
      scenarios (see Findings for the one difference)
- [x] `npm run deps:dedupe` in the gate: it is part of `npm test`, which CI's
      `build-and-test` runs on every PR that touches a manifest. It runs on PRs,
      not on a timer, because specifiers only change through commits
- [x] Renovate: `rangeStrategy: 'bump'` for npm, `widen` for peer
      dependencies, so specifiers and the lockfile move together from now on
- [x] Document the policy in AGENTS.md "Dependency Updates"

## Findings

- **Under `bump`, Renovate measures a vulnerability from the specifier's floor,
  not the locked version.** In a dry run against `main`'s manifests, the
  markdown-it security PR (#699) changed from `^8.4.1 → ^15.0.0` to
  `^8.4.1 → ^8.4.2`: the floor said 8.4.1, so 8.4.2 looked like a fix, though
  8.4.2 is what is installed and is still vulnerable. That is the stale-floor
  drift this task removes. A dry run with this branch as the base confirms it:
  - #699 goes back to `^8.4.2 → ^15.0.3`;
  - exact pins bump as exact (`16.2.3 → 16.3.0`) and carets as carets
    (`^19.1.0 → ^19.3.1`);
  - no peer range is touched;
  - the weekly `minor-patch` group shrinks from 79 updates to 25, because the
    other 54 were only stale floors catching up.
- **A kitchen-sink reader bundle can be stale after `npm run build`.** Against
  TASK-141's baseline, the reader assets differ in one hunk: source-map-js
  1.2.1 → 1.2.2, which TASK-141 itself merged. On this branch and on `main`
  every install resolves 1.2.2, so this branch's bundle is the correct one.
  TASK-141's own "after" run still carried 1.2.1 although `b-ber-reader`
  rebuilt with no cache hits. That cause is not established. TASK-141's
  conclusion stands (it diffed reader-react's `dist` directly), but a reader
  bundle in a scenario baseline should not be trusted without checking it.

## Notes

- Do **not** pin the first-party `@canopycanopycanopy/*` cross-dependencies by hand
  — lerna manages those, and `lerna.json` already sets `command.version.exact`.
- Pinning changes nothing about what is currently installed if done from the
  existing lockfile; verify that by diffing installed versions before and after.
- **Re-sequenced 2026-09-23: this no longer blocks TASK-123.** Only
  `versioning-strategy: increase` needed exact pins, and it moved here — adding it
  to `.github/dependabot.yml` is now a subtask of *this* task, to land with the
  pins. Everything else in the policy (the major-ignore in particular) works against
  caret ranges, so the rules shipped first.
- That makes this task discretionary rather than blocking. Its case stands on its
  own: manifests that state what was actually tested against, and closing the
  `npm install` drift class that produced TASK-115. The cost is a ~388-line diff and
  more PR volume, against a lockfile that already makes `npm ci` reproducible.
- Parent: TASK-121.
