# TASK-129: Replace Dependabot with Renovate

**Epic:** Dependency health
**GitHub Issue:** #674 — https://github.com/triplecanopy/b-ber/issues/674
**Scope:** monorepo

## Description

Replace Dependabot with Renovate for **both** version updates and security updates.
It is a full switch, not a hybrid. Running two bots means two queues, two configs,
and duplicate PRs for the same advisory, so we take Renovate's shortcomings rather
than split the job.

### Why switch

TASK-123 got Dependabot doing what it is told to, but several things that matter
here are things Dependabot cannot do at all:

| Need | Dependabot | Renovate |
| ---- | ---------- | -------- |
| Hold back 0.x minors (breaking under semver) | an enumerated list of nine `ignore`s, plus `scripts/check-zero-major-deps.js` so the list cannot drift | one rule: `matchCurrentVersion: "<1.0.0"` |
| See held-back majors | invisible: `ignore` drops them | listed on the Dependency Dashboard, opened on approval |
| Cap security PRs | not configurable (separate internal limit) | `vulnerabilityAlerts.prConcurrentLimit` |
| Tell security PRs apart | same `labels` for both paths | `vulnerabilityAlerts.labels` |
| Delay brand-new releases | `cooldown` | `minimumReleaseAge` |

Fighting the config format also had a cost. Four of the five commits after TASK-123
fixed Dependabot quirks: the doubled commit scope (#647), the scoped-name wildcard
and group `update-types` (#650), and YAML anchors its parser rejects (#652).

### What we give up: targeted transitive fixes

**Renovate has no transitive remediation.** `transitiveRemediation` was dropped in
v38 (renovatebot/renovate#27985, April 2024). Before that it only worked on npm v6
lockfiles. `vulnerabilityAlerts` only fixes dependencies Renovate extracts from a
`package.json`, so an advisory on a transitive-only package gets no PR of its own.

The substitute is `lockFileMaintenance`. Once a week it deletes `package-lock.json`
and regenerates it, which pulls every transitive dependency up to the newest version
its parents' ranges allow. That is a weekly batch rather than a targeted PR within
days, and it is the trade we are accepting.

## Spike findings (2026-10-31, against `main` @ `7995ea65`)

### A lockfile rebuild clears two thirds of the advisories

Regenerated with `npm install --package-lock-only --ignore-scripts`, then audited
with `npm audit --package-lock-only` before and after:

| | Before | After |
| --- | --- | --- |
| Packages carrying an advisory | 46 | **15** |
| Critical | 3 | **0** |
| High | 41 | 18 |

**Cleared (31):** `@babel/runtime`, `@tootallnate/once`, `ajv`,
`baseline-browser-mapping`, `body-parser`, `brace-expansion`, `browserslist`,
`cookie`, `cross-spawn`, `debug`, `diff`, `engine.io`, `express`,
`follow-redirects`, `handlebars`, `immutable`, `ip-address`, `js-yaml`, `lodash`,
`nanoid`, `pacote`, `path-to-regexp`, `picomatch`, `proxy-addr`, `qs`,
`smol-toml`, `socket.io-parser`, `source-map-js`, `vite`, `ws`, `yaml`.

That covers most of what Dependabot's targeted transitive PRs were for: #661, #664,
#665, #666, #667, #668 and #670.

**Remaining (15).** 14 of them need a major somewhere in the chain, so no tool can
fix them within range:

| Advisory on | Blocked by |
| ----------- | ---------- |
| `markdown-it`, `linkify-it` | `markdown-it` 8 → 15 |
| `image-size` | 0.8 → 2 |
| `postcss` | 7 → 8 (with `autoprefixer` 9 → 10) |
| `glob`, `minimatch` | `glob` 7 → 14 |
| `axios`, `send`, `serve-static` | `browser-sync` 2 → 3 |
| `jpeg-js` | `pureimage` 0.1 → 0.4 |
| `semver` | `nodemon` |
| `undici` | `nx` (via `lerna`) |
| `uuid` | `conventional-changelog-cli` 2 → 5 |
| `deepmerge` | `jest-config` |
| `decode-uri-component` | audit reports an in-range fix; it did not resolve — investigate |

These belong to TASK-120 and to new per-package tasks, not to the bot.

### The rebuilt lockfile is green

`npm ci --ignore-scripts`, `npm run build` and `npx jest` all passed on the rebuilt
lockfile: 130 suites, 1022 tests. This ran on Node 26 locally; CI uses 24.

**The first rebuild is large.** It bumps `lockfileVersion` 2 → 3 and changes
roughly 480 package versions (376 added, 550 removed). Later weekly rebuilds should
be small. Review the first one on its own, not as part of a batch.

### Renovate dry run

`renovate@44.198.3` with `--dry-run=full` against `triplecanopy/b-ber` and a
candidate config. Nothing was pushed. Under that config:

- **Security PRs (6):** `browserslist`, `express`, `lodash`, `image-size`,
  `markdown-it` (8 → 15), `postcss` (7 → 8). All are direct deps, as documented.
  Majors bypass approval, which is correct for a security fix.
- **~35 majors on the dashboard awaiting approval, with no PRs opened.** This is the
  human-readable backlog: typescript 7, jest 30, husky 1 → 9, yargs 13 → 18,
  commitlint 16 → 21, and so on.
- **0.x minors are held correctly:** `pureimage`, `markdown-it-front-matter`,
  `tsdown`.
- **`lock-file-maintenance` was planned,** status `not-scheduled`. A top-level
  `lockFileMaintenance: {enabled: true}` was enough; it did not need a
  `packageRules` entry.

### Config problems the dry run exposed

1. **A held 0.x package holds its whole group.** `tsdown` 0.22 → 0.23 pulled the
   entire `build-tools` group (27 updates) into "needs approval". 0.x packages must
   be excluded from groups.
2. **No catch-all group.** About 12 minor/patch updates each got a branch of their
   own (`classnames`, `css-tree`, `sass`, `lint-staged`, `html-to-react`, …). The
   Dependabot config had a `minor-patch` catch-all, and this needs one too.
3. **The github-actions rule was too broad.** It also matched `node-version` in the
   workflows, so it would have taken CI from Node 24 to 26 with no approval. Node
   majors belong to the Node.js modernization epic, not to a bot.
4. **CircleCI and Docker images are picked up too.** `cimg/node` gets digest-pinned
   and bumped, both minor and major. Either gate it or disable those managers while
   CircleCI is on its way out.

### How each was fixed in `renovate.json5`

| Problem | Fix |
| ------- | --- |
| 1. 0.x package holds its group | `groupName: null` on the 0.x rule pulls it into a branch of its own (`renovate/tsdown-0.x`) |
| 2. No catch-all | a `minor-patch` group on `*`, declared first so the specific groups override it |
| 3. Actions rule too broad | `matchDepTypes: ['action']`. `node-version` now sits behind the major gate, grouped with `@types/node` as `renovate/node-26.x` |
| 4. CircleCI | its own `circleci` group, majors gated; `pin`/`pinDigest` updates disabled everywhere (pinning is TASK-122's call) |

Further iterations turned up three more:

5. **`config:recommended`'s monorepo groups outrank ours.** They split react,
   swc, lerna, commitlint and jest back out into a PR each. Fixed with
   `ignorePresets: ['group:monorepos']`.
6. **A security PR that fixes nothing.** image-size 0.8.3 has two update
   buckets, 0.9.7 (minor) and 2.0.4 (major). The advisory rule sends both to the
   security branch, the lower one wins the "upgrade collision", and the PR would
   carry 0.9.7. But GHSA-w3rx-r6r6-pgpr covers `>= 0.6.3, <= 2.0.2`.
   `separateMajorMinor: false` did not merge the buckets, and it pushed express to
   5.x. Fixed with a targeted `allowedVersions: '>=2.0.3'` that carries its
   removal condition. This looks like an upstream bug, worth reporting.
7. **`fix(deps)` titles.** `:semanticPrefixFixDepsChoreOthers` (in
   `config:recommended`) gives runtime deps `fix`. It is ignored so every update
   stays `chore(deps)`, matching the history.

Also set: `vulnerabilityFixStrategy: 'highest'`. One PR then clears every
advisory on a package, rather than one fix line per round.

**Not carried over: the js-yaml hold.** Dependabot needed it because it resolved
the `^3`/`^4` split downward across packages. Renovate updates each manifest on
its own, so there is no downgrade. The `^3` copy gets a security PR (3 → 5) and
the `^4` copy a gated 4 → 5 major. TASK-122 still decides the split; the security
PR just makes it visible.

### Final dry run (2026-10-31)

| Bucket | Count | Contents |
| ------ | ----- | -------- |
| Security, opened immediately | 7 | browserslist 4.29.5, express 4.22.3, lodash 4.18.1, image-size 2, js-yaml 5, markdown-it 15, postcss 8 |
| Routine, Monday window | 7 | `minor-patch` (11 packages), `react`, `types`, `testing`, `linting`, `build-tools`, `lock-file-maintenance` |
| Pending release age | 1 | `circleci` (`cimg/node` 24.14 → 24.22, under 3 days old) |
| Dashboard, awaiting approval | 39 | 3 × 0.x minors, 36 majors |

The security cap is 5, so two of the seven wait their turn. Every title is
`chore(deps): update dependency <x> to <v> [security]` or
`chore(deps): update <group>`, which is commitlint-clean.

## Subtasks

### Config (this branch)

- [x] Write `renovate.json5` from the candidate config, fixing the four problems
      above (and the three more the dry runs found)
- [x] Re-run the dry run until the branch list matches intent, and record the final
      list here
- [x] Commit-message format matches commitlint (`chore(deps): …`,
      `chore(actions): …`)
- [x] Delete `.github/dependabot.yml`
- [x] Delete `scripts/check-zero-major-deps.js` and the `check:deps` script
- [x] Update AGENTS.md (new "Dependency Updates" section), and the TASK-121 parent
      so it names TASK-129

### Rollout (needs a repo admin, after merge)

- [ ] Install the Renovate GitHub App on `triplecanopy/b-ber`, with read access to
      Dependabot alerts
- [ ] Settings → Advanced Security: turn **off** Dependabot security updates and
      **keep** Dependency graph + Dependabot alerts on. Renovate reads the alerts.
- [ ] Confirm the first run opens the Dependency Dashboard issue and no unexpected
      PRs
- [ ] Close the open Dependabot PRs once Renovate has recreated whatever is still
      relevant, with a comment pointing here
- [ ] Review and merge the first `lock-file-maintenance` PR on its own; re-measure
      the alerts afterwards

### Bookkeeping on sibling tasks

- [ ] TASK-123 (#637): its Dependabot rules are retired by this task. Close it as
      superseded; its findings carry over in this PRD.
- [ ] TASK-124 (#638): rescope auto-merge from `dependabot/fetch-metadata` to
      Renovate's `automerge` / `platformAutomerge`
- [ ] TASK-125 (#639): the answer is now "weekly `lockFileMaintenance`, then
      `overrides`, then remove the dep". Fold this spike's numbers into it.
- [ ] Epic #618 body: replace "Dependabot producing signal rather than noise" and
      the order-of-work diagram

## References

- [Renovate configuration options](https://docs.renovatebot.com/configuration-options/)
  — `vulnerabilityAlerts`, `lockFileMaintenance`, `prConcurrentLimit`,
  `dependencyDashboardApproval`
- [renovatebot/renovate#27985](https://github.com/renovatebot/renovate/pull/27985)
  — `feat(npm)!: drop transitiveRemediation option`
- [renovatebot/renovate#14173](https://github.com/renovatebot/renovate/issues/14173)
  — why surgical lockfile patching stopped working with npm 7+
- [Discussion #46581](https://github.com/renovatebot/renovate/discussions/46581)
  — vulnerability PRs only cover extracted (direct) dependencies

## Notes

- The Dependabot "out-of-range" PRs that prompted this (#672 markdown-it 8 → 15,
  #649 image-size 0.8 → 2) were **security** updates whose first fixed version is a
  major. Renovate proposes the same majors (see the dry run). Switching does not
  make those go away; it only labels them so they are recognisable.
- Renovate's CLI requires Node `^24.11.0`. That only matters for local dry runs; the
  hosted app brings its own runtime.
- Dry-run recipe, so the config can be tested without a merge:
  `RENOVATE_TOKEN=$(gh auth token) RENOVATE_CONFIG_FILE=config.json LOG_FORMAT=json LOG_LEVEL=debug renovate`.
  `config.json` is `renovate.json` plus `platform: github`,
  `repositories: ["triplecanopy/b-ber"]`, `onboarding: false`,
  `requireConfig: "ignored"` and `dryRun: "full"`. The branch summary is the log
  line carrying `branchesInformation`.
- Parent: TASK-121.
