# b-ber monorepo — Project Plan

_Last updated: 2026-09-20 (TASK-115 release automation merged as PR #592, awaiting
an `NPM_TOKEN` secret + dry run; TASK-116 opened to move off tokens to OIDC before
npm's January 2027 deadline; TASK-112 + TASK-114 done and **released in 4.0.2**;
TASK-113 opened for the watch-mode gap; branch strategy switched to
`main`-as-trunk + `TASK-NNN-<slug>` branches **via PRs** — `main` is protected,
and AGENTS.md § Releases now documents the two-step `lerna version` /
`lerna publish from-package` flow that works with it)._

This file is the **current state**. Conventions, standards, and the task-file
format live in [AGENTS.md](./AGENTS.md). All tasks live in `tasks/` at the repo
root (one flat `TASK-NNN` sequence). Regenerate coverage numbers any time with
`npm run test:coverage`.

---

## 🎯 Goal

Modernize the b-ber monorepo to a stable, maintainable baseline. All work is
organized under **seven features (epics)**. Every task belongs to exactly one;
every new task must too. **Dependency health** was added 2026-09-22 and is the only
one that is continuous rather than bounded.

| Feature | What "done" means |
| ------- | ----------------- |
| 🔧 **Upgrade tooling** | Vite, Biome, Lerna v8, Jest 29, modern CI/coverage, sane dep + release workflow |
| 🔤 **Migrate JS→TS** | Every package authored in TypeScript |
| ✅ **Unit test coverage** | ≥ 75% statement coverage repo-wide |
| 🧪 **E2E testing** | CLI + reader browser tests running in CI against a real fixture build |
| ⚙️ **Node.js modernization** | Current Node standards (no deprecated APIs, modern engines, no `process.exit` in libs) |
| ⚛️ **React 19 (reader-react)** | Reader on modern React: functional components, observers (no polling), correct spreads, ESM, TS |
| 🔒 **Dependency health** | Dependencies pinned and deduped, Dependabot producing signal not noise, a quiet alert queue. **Continuous — reaches a working footing rather than completing** |

---

## 📊 Feature progress at a glance

| Feature | Done | Active | Backlog | State |
| ------- | ---- | ------ | ------- | ----- |
| 🔧 Upgrade tooling | 25 | 2 | 3 | Core toolchain shipped; scripts cleaned + watch scripts applied (TASK-038). **TASK-112 + TASK-114 ✅ done & released in 4.0.2** — 4.0.0 shipped unbuildable (tsdown's flat bundle broke `__dirname` asset reads) and reader-react misreported its version; both fixed and verified against the published artifacts. **TASK-115 active** — releases automated via two GitHub Actions workflows so they work against protected `main`, and the publish-time build regression from TASK-030 fixed. TASK-117 done (PR gate merged + required). Dependency work moved to its own **Dependency health** epic. Previously: **no PR in the repo was gated on CI** (CircleCI reports nothing to GitHub and the ruleset has no `required_status_checks`); that is how the 4.0.3 bump merged unpublishable. Remaining: **TASK-116 (high — OIDC trusted publishing; npm kills the token path Jan 2027)**, TASK-113 (watch-mode asset gap, from TASK-112), TASK-118 (retire CircleCI — port coverage + e2e to Actions first), TASK-045 (release/changelog refinements), TASK-109 (SCSS toolchain) |
| 🔤 Migrate JS→TS | 18 | 0 | 0 | ✅ **Epic complete** — reader-react (TASK-032) merged; every package except legacy `b-ber-reader` is TypeScript |
| ✅ Unit test coverage | 2 | 1 | 2 | Epic in progress; most packages at target, a few laggards |
| 🧪 E2E testing | 5 | 1 | 2 | Pipeline green in CI; skill + iframe fix remain |
| ⚙️ Node.js modernization | 1 | 0 | 2 | Barely started; epic + logger refactor pending |
| 🔒 Dependency health | 0 | 2 | 4 | **Just started.** 422 alerts / 38 stale PRs. TASK-120 removed `tar` (59% of alerts, imported nowhere). TASK-121 is the parent for putting Dependabot on a working footing: TASK-122 → 123 → 124 in order, TASK-125 in parallel |
| ⚛️ React 19 (reader-react) | 33 | 0 | 11 | **Steps 1 + 2 complete and merged into `feat/upgrades`** (TASK-095–100): no class components/HOCs, no selfRef shim. **Step 3 (TASK-073) done** — recommendation: drop Redux → `useSyncExternalStore` + stable API context (`STATE-MIGRATION-PLAN.md`). **Step 4 (TASK-106) ✅ done & merged** — Redux removed, built-in store + ReaderApiContext shipped, browser QA passed. **TASK-101 (page-nav race) done.** **TASK-107/108 ✅ done & QA'd.** **Housekeeping TASK-102/103 + TASK-068 (phase-1 cleanup: dead code, ErrorBoundary, SpreadFigure→useContext, Layout debounce fix) ✅ done & merged.** **TASK-111 (material-icons font → inline SVGs, dep removed) ✅ done & merged.** Next: TASK-091 (react-player v3) or TASK-104 (a11y) — independent leaves. TASK-105 (colocation) **superseded/dropped** 2026-06-21. |

_"Active" = in progress. "Backlog" = not started (excludes superseded)._

---

## 🔧 Upgrade tooling

**Shipped:** Vite (TASK-006/007), Biome (TASK-015), Jest 29 (TASK-034), Lerna v8
+ drop bootstrap (TASK-036), CircleCI modernization (TASK-035), Codecov
(TASK-049, CLI validation fix TASK-092), build-script simplification (TASK-054/057/058), circular-import audit
(TASK-016) + enforcing circular-dep CI gate (TASK-022), GitHub issue setup (TASK-014),
dependabot reconfigured (TASK-037), architecture diagrams expanded (TASK-017).

| Task | Pri | Outstanding work |
| ---- | --- | ---------------- |
| TASK-112 | **high** | ✅ **Done, released in 4.0.2** ([#587](https://github.com/triplecanopy/b-ber/issues/587)). `4.0.0` cannot build a default project: tsdown bundles `src/` to a single `dist/index.js`, so `__dirname` is `dist/`, but `copy.sh` still mirrored `src/` into `dist/cover/` + `dist/web/`. Broke the cover font (every format, for projects with no `cover` in metadata.yml) and all four `web` browser scripts. Fallout from TASK-030. Also fixed a cheerio default-import interop break from the same bundling change |
| TASK-113 | med | Discovery ([#588](https://github.com/triplecanopy/b-ber/issues/588)) — `b-ber-tasks`'s `watch` runs `tsdown --watch` but not `copy.sh`, and `clean: true` wipes `dist/`, so watch-mode `dist/` is missing the assets TASK-112 just fixed. Survey build/watch asymmetry across packages; evaluate tsdown `hooks['build:done']` / built-in `copy` to retire `copy.sh` |
| TASK-115 | **high** | ⏳ **Merged (PR #592), not finished** ([#591](https://github.com/triplecanopy/b-ber/issues/591)) — `lerna publish` cannot run against protected `main` (it pushes its own version commit; this is what burnt `4.0.1`), and nothing built the packages at publish time since TASK-030 dropped `b-ber-tasks`'s `prepare` script. Split into `release-prepare.yml` (bump → PR) + `release-publish.yml` (build → `lerna publish from-package` → tag). Needs an `NPM_TOKEN` secret (granular, **Bypass 2FA**, 90-day expiry), a dry run, and the orphan `v4.0.1` tag deleted |
| TASK-117 | **high** | ⏳ **In progress** ([#600](https://github.com/triplecanopy/b-ber/issues/600)) — add `ci.yml` (build + test on every PR) and make `build-and-test` a required status check on `main`. Nothing gates PRs today: CircleCI posts no statuses or check runs, and the ruleset has no `required_status_checks`. `release-prepare.yml` runs its gates *before* the bump, so a bump-induced failure can only be caught on the release PR |
| TASK-118 | med | ([#604](https://github.com/triplecanopy/b-ber/issues/604)) Retire CircleCI — it reports nothing to GitHub and gates nothing. **Not a straight deletion:** its `build` job is covered by TASK-117's `ci.yml`, but coverage→Codecov (TASK-049/092) and the Playwright e2e suite (TASK-039–044) are not. Port both to Actions, then delete `.circleci/` plus the now-dead `scripts/run-ci.js` + `postpublish` hook |
| TASK-116 | **high** | ([#593](https://github.com/triplecanopy/b-ber/issues/593)) Move releases to OIDC trusted publishing, dropping `NPM_TOKEN`. Blocked on upgrading lerna 8.2.4 → 9+ (OIDC landed in lerna v9). Deadline is external: write-scoped granular tokens expire every 90 days, and npm removes direct publishing with Bypass-2FA tokens in **January 2027** |
| TASK-114 | med | ✅ **Done, released in 4.0.2** ([#589](https://github.com/triplecanopy/b-ber/issues/589)) — `src/lib/version.ts` now does `import { version } from '../../package.json'`; `scripts/version.js` + the `version` lifecycle hook are gone. Chosen over a Vite `define` (which would have needed the value registered in five separate compile paths); the leakage worry was measured away — the lib bundle is byte-identical to published 4.0.0 bar one comment character. Test strengthened to assert equality with `package.json`. Also fixed `b-ber-reader`'s stale `src/index.jsx` alias |
| TASK-109 | med | Modernize project/theme SCSS compile path — drop the custom `~` importer, move off the legacy dart-sass `render` API, `@import`→`@use`/`@forward`, refresh autoprefixer/PostCSS (from TASK-076 findings) |
| TASK-045 | med | Refactor changelog generation + release workflow (incl. `postpublish`/`run-ci.js` + `publish:*` scripts deferred from TASK-038) |

> TASK-023 (Lerna research) is **superseded** by TASK-036; TASK-020 (Vite+Biome
> umbrella, complete) and TASK-018 (issue back-links, obsolete) were closed
> 2026-06-11. **TASK-092 closed** (Codecov CLI validation fixed via the `binary:`
> workaround in `.circleci/config.yml`; build job green, verified 2026-06-19).
> **TASK-021 superseded** (obsolete — `lerna bootstrap` removed in TASK-036;
> repo uses npm workspaces with single root lockfile) on 2026-06-19.
> **TASK-037 / TASK-017 / TASK-022 done** 2026-06-19 (parallel Sonnet subagents,
> merged to `feat/upgrades`): dependabot reconfigured (target branch + grouping +
> version updates + github-actions ecosystem); architecture diagrams expanded
> (tooling matrix, dependency audit, per-package pages, cross-links); circular-dep
> check fixed for TS source and wired into CI as an **enforcing** gate (the
> reader-react `import type` cycles were removed by extracting shared media-control
> prop types to a `types.ts`).
> **TASK-053 / TASK-047 / TASK-052 done** 2026-06-19 (parallel Sonnet subagents,
> reconciled by parent onto `feat/upgrades`): `lerna-update-wizard` replaced with
> pinned-devDep `syncpack`/`npm-check-updates`; watch-mode scripts researched
> (applied in TASK-038); publish-artifact testing settled on home-rolled `npm
> pack` + install-all-tarballs (prototype `scripts/test-pack.sh`, Verdaccio rejected).
> **TASK-038 done** 2026-06-20: applied the TASK-047 `watch` scripts across all
> build-producing packages, removed failing theme `test`/no-op `clean` + the
> reader TODO-test placeholder, fixed the broken `browserslist:update`, and fixed
> a latent root-jest CSS-module gap (TASK-076) that had `npm test` red. Release
> scripts (`postpublish`/`publish:*`/`changelog`) and theme SCSS scripts deferred
> to TASK-045 / TASK-109.

---

## 🔤 Migrate JS→TS

✅ **Epic complete (TASK-019, closed 2026-06-13).** Every monorepo package is
authored in TypeScript except the intentionally-excluded legacy `b-ber-reader`.

**Shipped:** strategy + infra (TASK-002/003/008), Stage 1 shapes/lib/logger
(009–012), Stage 2 grammar/parser/templates/markdown (024–028), Stage 3
tasks/cli (029–031), resources (048), Stage 4 reader-react (TASK-032 — strict
`tsc` clean, Vite build + 458 tests green; merged `feat/ts-stage-4` → `feat/upgrades`
in `ceb3d636`).

> TASK-072 (reader-react TS adoption) is **superseded** by TASK-032.
> TASK-032 conversion stayed type-only/behavior-preserving (class components
> kept as classes); the densest pragmatic-`any` clusters dissolve in the React
> 19 class→functional + Redux modernization passes. See TASK-032 "Type debt" —
> it is the seeding input for the React 19 epic's typing cleanup.

---

## ✅ Unit test coverage

Epic: **TASK-004** (≥ 75% repo-wide). Per-package status lives in TASK-004 as a
checklist — regenerate with `npm run test:coverage`. The 26 old per-package
coverage stubs were consolidated there on 2026-06-11.

**At/above target:** all grammar, all parsers,
shapes-directives/dublin-core, templates 96%, validator 92%, lib 76%, logger
77%, markdown-renderer 92%.

| Task | Pri | Outstanding work |
| ---- | --- | ---------------- |
| TASK-004 | high | Drive laggards to 75%: cli 54%, b-ber-tasks 13% (~25% ceiling). reader-react now 85%, shapes-sequences 100% — both at target |
| TASK-050 | high | CLI command inventory + handler test coverage (also the gate for TASK-046) |
| TASK-051 | med | Theme docs + SCSS compilation test coverage |

---

## 🧪 E2E testing

Epic: **TASK-039**. Pipeline is green in CI (build + e2e jobs, 24 Playwright
reader tests + CLI smoke tests). Shipped: research (040), kitchen-sink fixture
(041), CLI smoke (042), reader browser tests (043), CI integration (044).

| Task | Pri | Outstanding work |
| ---- | --- | ---------------- |
| TASK-055 | low | Create a testing skill — **now unblocked** (E2E setup defined) |
| TASK-056 | med | Fix iframe template EPUB 3 compliance (surfaced by the fixture) |
| TASK-039 | high | Umbrella — close once 055/056 land |

---

## ⚙️ Node.js modernization

**Shipped:** build-target/engine bumps to Node ≥ 22 (TASK-059).

| Task | Pri | Outstanding work |
| ---- | --- | ---------------- |
| TASK-013 | med | Node.js modernization **epic** — per-package audits (deprecated APIs, async/await, modern engines) |
| TASK-046 | med | Refactor b-ber-logger — remove `process.exit` from `log.error` |

> ⚠️ TASK-046 is **blocked by TASK-050** (need CLI handler tests asserting
> `process.exit` behavior before changing it). Cross-feature dependency.

---

## 🔒 Dependency health

**Continuous epic, started 2026-09-22.** Unlike the other six, this one does not
complete — it reaches a working footing and then needs maintaining. "Done" applies
to individual tasks, not the feature.

### Where it stands

| | Measured 2026-09-22 |
| --- | --- |
| Open Dependabot alerts | **422** — 23 critical, 255 high, 131 medium, 13 low |
| Open Dependabot PRs | **38**, oldest 2026-07-17 |
| Specifier styles | **388 `^`**, 3 other, 1 exact |
| Deps whose specs conflict across packages | **3** (`js-yaml`, `@types/js-yaml`, `sass`) |
| `overrides` in root `package.json` | none |
| Workspace manifests | 37 — inside Dependabot's timeout-risk territory |

Alerts are concentrated, not spread thin — which is what makes this tractable:

| Package | Alerts | Share |
| ------- | ------ | ----- |
| `tar` | 248 | 59% — **removed, TASK-120** |
| `axios` | 28 | 7% |
| `xmldom` | 16 | deprecated; may want replacing, not upgrading |
| `postcss` | 15 | |
| `js-yaml` | 14 | |
| `undici` | 12 | |

### Order of work

```
TASK-120  vulnerability remediation  ──────────────────┐  (independent, in progress)
                                                       │
TASK-122 ──► TASK-123 ──► TASK-124                     │
 pin+dedupe   rules        automate + clear backlog     │
                                                       │
TASK-125  transitive strategy  ────────────────────────┘  (parallel, any time)
```

**122 → 123 → 124 is a hard order:**

- **122 before 123** — `versioning-strategy: increase` is meaningless against `^`
  ranges, so the rules cannot be written until specifiers are exact.
- **123 before 124** — the backlog should be *regenerated under the new rules*, not
  cleared under the old ones. Clearing first wastes the work.

TASK-125 touches nothing the others touch. TASK-120 is the content (actual
vulnerabilities) while 121–125 are the process; they inform each other but neither
blocks the other.

| Task | Pri | State | What |
| ---- | --- | ----- | ---- |
| [TASK-121](tasks/TASK-121.open.md) | **high** | ⏳ parent ([#610](https://github.com/triplecanopy/b-ber/issues/610)) | Umbrella + the findings that shape the rest |
| [TASK-120](tasks/TASK-120.open.md) | **high** | ⏳ in progress ([#608](https://github.com/triplecanopy/b-ber/issues/608)) | Remediate actual vulnerabilities. `tar` removed (59%). Next: lerna 8→9, then `axios`/`xmldom`/`postcss`/`js-yaml`/`undici` |
| [TASK-122](tasks/TASK-122.open.md) | **high** | next up | Pin all 388 `^` specifiers exactly; resolve the 3 conflicts via `syncpack` |
| [TASK-123](tasks/TASK-123.open.md) | **high** | blocked on 122 | Rewrite `dependabot.yml`: scoped major-ignore, `versioning-strategy`, `rebase-strategy`, commit-message, labels |
| [TASK-124](tasks/TASK-124.open.md) | **high** | blocked on 123 | Auto-merge patch/minor; regenerate the backlog instead of grinding it |
| [TASK-125](tasks/TASK-125.open.md) | med | ready | Transitive strategy: parent-bump → `overrides` → removal |

### Findings that shape the plan

Established by measurement and research on 2026-09-22. Recorded here so later
sessions do not re-derive them.

1. **`open-pull-requests-limit` does not apply to security updates.** The limit is
   10 and there are 38 PRs; that is the entire explanation. The limit cannot be used
   to control backlog size. Setting it to `0` disables *version* updates while
   leaving security PRs flowing — a real lever, but it lets versions rot.

2. **⚠️ An `ignore` entry naming only a dependency expands to `>= 0` and applies to
   the security path as well as the version path.** So a naive "no major bumps" rule
   silently suppresses that package's security fixes. It must be scoped as
   `update-types: ["version-update:semver-major"]`, and TASK-123 has to verify in
   practice that a major *security* fix still arrives.

3. **Dependabot already unlocks npm transitive dependencies** (since 2022-09): when
   a parent constrains a child to a vulnerable range it bumps *the parent*. So
   `overrides` is the fallback, not the strategy. Order: parent bump → `overrides`
   when no parent fix exists → remove the dependency. `npm audit fix` is not on the
   list — it cannot fix anything needing a major.

4. **The highest-value action is one Dependabot cannot suggest: deletion.** `tar`
   was 59% of all alerts, declared a runtime dependency by 19 packages, and imported
   nowhere. Always ask "is this even used?" before bumping. An audit of every runtime
   dep declared by 3+ packages found `tar` was the only vestigial one, so this is
   bounded.

5. **Pinning is smaller than it sounds.** Only 3 of ~100 deps disagree across
   packages. `js-yaml` 3 → 4 is the one real decision (v4 dropped
   `safeLoad`/`safeDump`).

6. **Do not grind the 38 PRs.** With TASK-117's gate required and `strict: true`,
   each needs to be up to date and individually green — and every merge invalidates
   the other 37. Reconfigure, then regenerate. Cherry-pick only what is
   independently valuable: **#530 lerna 8→9** (removes the last `tar@6` path *and*
   unblocks TASK-116's OIDC work) and **#531 `@types/node` 14→26** (the repo runs
   Node 24 against Node 14 types).

7. **`@types/node` staleness is not the typecheck problem.** Tempting lead, checked
   and false: 85 of `b-ber-templates`' 90 errors are TS7006/TS7031 implicit-`any`,
   i.e. missing annotations. See TASK-119.

8. **37 manifests is timeout territory.** Monorepos with many manifests can time out
   during Dependabot's assessment, which would show up as packages that never get
   PRs. Check the Dependabot run logs before concluding the config works.

### References

- [Dependabot security updates](https://docs.github.com/en/code-security/concepts/supply-chain-security/dependabot-security-updates) — security vs version updates
- [Ignoring a dependency without blocking security updates](https://pydevtools.com/handbook/how-to/how-to-ignore-a-dependency-in-dependabot-without-blocking-security-updates/) — finding 2
- [Dependabot unlocks transitive dependencies for npm](https://github.blog/changelog/2022-09-07-dependabot-unlocks-transitive-dependencies-for-npm-projects/) — finding 3
- [Optimizing PR creation for version updates](https://docs.github.com/en/code-security/tutorials/secure-your-dependencies/optimizing-pr-creation-version-updates) — grouping and limits
- [Using GitHub merge queue to ease Dependabot churn](https://fredrikaverpil.github.io/blog/2023/03/29/using-github-merge-queue-to-ease-the-dependabot-churn/) — TASK-124

---

## ⚛️ React 19 (reader-react)

The 32 former `b-ber-reader-react/tasks/*` were flattened into root as
TASK-060–091 on 2026-06-11. Prior passes converted the orchestrators
(`Reader/index`, `Ultimate`) to functional components, rewrote pollers as
observers, and landed loader/keyboard fixes, regression infra, and ESM
packaging. The **TS conversion (TASK-032)** and the **spread/layout-stability
cluster (TASK-081–085)** are now complete (cluster QA verified 2026-06-13;
reusable checklist retained at
[`SPREAD-CLUSTER-QA.md`](./packages/b-ber-reader-react/SPREAD-CLUSTER-QA.md)).

This unblocks the **modernization migration** — the main remaining surface.

### Goals (set by user, 2026-06-13)

1. Relieve tech debt; be ready to drop `UNSAFE_*` lifecycles entirely.
2. Reduce cognitive overhead: today's mix of Context + Redux + hooks + class
   components + HOCs makes behavior hard to reason about.
3. Converge on a small set of robust, modern APIs — the current mix causes
   non-deterministic rendering, especially under React 19 state batching.
4. **Preserving current behavior is critical** — the app must function exactly
   as before after each change.

Spread-rendering bugs and sentinel polling are **explicitly deferred** to *after*
the migration (see Deferred below).

### Remaining surface (verified 2026-06-13; Steps 1+2 resolved 2026-06-14)

- ~~**9 class components:**~~ ✅ all functional (Step 1: TASK-095/096/097).
- ~~**4 class HOCs:**~~ ✅ all hooks (Step 2: TASK-098 measurement + TASK-099
  position; `with-last-spread-index` was already functional).
- ~~**`UNSAFE_*` lifecycles** + the `selfRef` shim in `Reader/index`~~ ✅ lifecycles
  replaced by effects across Steps 1–2; selfRef removed in TASK-100
  (`navigation`/`loader`/`resize` are now `useNavigation`/`useLoader`/`useResize`).
- **State:** plain Redux + `redux-thunk` + `connect()` **and** two React Contexts
  (`reader-context`, `spread-context`) **and** hooks — the mix to consolidate.
  Remaining reader-react work; the TASK-073 research → Step 4 migration.

### Migration plan (maps to the 5-step approach)

Conventions for every wave task live in
[`MIGRATION-CONVENTIONS.md`](./packages/b-ber-reader-react/MIGRATION-CONVENTIONS.md)
(**TASK-094**) — read it first. Each task carries a `**Model:**` field (Sonnet
for mechanical conversions, Opus for the high-judgment ones).

**Components convert before HOCs** — an HOC wraps a functional component fine,
but a hook can only be called from one, so making consumers functional first
turns every HOC→hook step into a mechanical swap with no half-wired state.

| Task | Step | Converts | Model |
| ---- | ---- | -------- | ----- |
| **TASK-094** ✅ | 0 | Conventions doc (foundation) | Opus |
| TASK-095 ✅ | 1 | Leaf components: `Footnote`, `Marker`, `SidebarSettings` | Sonnet |
| TASK-096 ✅ | 1 | Media subtree: `Media`, `Vimeo`, `Iframe`, `MediaControls`, `MediaButtonVolume` | Opus (Media→`useMediaPlayer` hook; Vimeo render-phase update) |
| TASK-097 ✅ | 1 | `App` (async `UNSAFE_` + `connect`) | Opus |
| TASK-098 ✅ | 2 | Measurement HOCs→hooks: `with-dimensions`, `with-navigation-actions` | Sonnet |
| TASK-099 ✅ | 2 | Position HOCs→hooks: `with-node-position`, `with-iframe-position` (**absorbs deferred TASK-084 `getPageWidth`**) | Opus |
| TASK-100 ✅ | 2 | Remove `selfRef` shim: `navigation`/`loader`/`resize` → hooks | Opus |

**Step 3 (evaluate deps) — TASK-073 ✅ complete.** Recommendation:
**drop Redux → tiny `useSyncExternalStore` store + stable API context** (hybrid;
RTK not needed — no blocker; thunks are a non-issue, 2 dead + 1 trivial). Full
write-up in
[`STATE-MIGRATION-PLAN.md`](./packages/b-ber-reader-react/STATE-MIGRATION-PLAN.md).
Also TASK-091 (react-player v3, independent).

**Step 4 (migrate state per findings) — TASK-106 ✅ complete
(`feat/reader-react-state-migration`).** Executed the plan slice by slice (cold →
warm → hot → `book.content` → drop `connect()`/deps). **What landed:** scaffold
(`createReaderStore`/`StoreContext`/`useStore`/`renderWithStore`), `markers`
(dead subscription removed), cold `readerSettings`, and the warm
`userInterface` + `readerLocation` slices (store-backed action bundles in
`store/userInterfaceActions.ts` + `store/readerLocationActions.ts`; dead
`viewerSettings` thunks deleted; App is now connect-free) and the hot `view` +
`viewerSettings` slices (`store/viewActions.ts` + `store/viewerSettingsActions.ts`;
render-count parity test proves selector-level bailout; Ultimate settle
consolidated per §3c). **Redux is fully removed** — deps, Provider, reducers,
actions, and constants deleted; every component is plain functional reading the
built-in store. `book.content` moved into the store as `{ spineItemURL, node }`
(BookContent self-keys; the chapter-change remount that re-arms Ultimate is
preserved). `ReaderApiContext` introduced and `reader-context` collapsed: the
stable ref-backed API context (`getTranslateX`/`navigateToChapterByURL`/
`getSpineItemByAbsoluteUrl`) stops Link/SpreadFigure/Layout/`useNodePosition`
re-rendering on spread changes; `reader-context` slims to reactive
`{ spreadIndex, lastSpread }` (Vimeo/`useMediaPlayer` only). `spreadIndex`/
`lastSpread` stay `Reader`-local (atomic navigation writes; deviation recorded in
`STATE-MIGRATION-PLAN.md §3`). **Browser QA passed** (`SPREAD-CLUSTER-QA.md` —
load/spinner, page turns, chapter nav, resize); bugs found and fixed along the
way: resize/sidebar/nav (cold+warm) and a spread-figure re-center regression from
the ReaderApiContext split (SpreadFigure now subscribes to reactive `spreadIndex`;
fix `d3d5e3f3`). Pre-existing bugs split out as TASK-107/108 (both now fixed &
QA'd). **Done.** (TASK-105 colocation, originally sequenced after this, was
**superseded/dropped** 2026-06-21 — net-negative churn; its one useful item moved
to TASK-068.)

**Step 5 (reorg / best practices)** — TASK-068 (housekeeping) ✅ **done & merged
2026-06-21**, TASK-071 (docs), TASK-076 (SCSS→CSS Modules) ✅ done, plus general
organization cleanup.

### Maintainability backlog (raised in code review 2026-06-14)

From a post-Steps-1/2 read of the reader. New tasks scaffolded; the rest map to
existing open tasks (noted in the right column).

| Task | Kind | Summary | Maps to / notes |
| ---- | ---- | ------- | --------------- |
| **TASK-101** | bug | Premature page-nav skips to next chapter (load race: `handleEvents` unlocks before `lastSpreadIndex` is measured) | ✅ done |
| **TASK-102** | housekeeping | Remove Chrome-81 workarounds (deletes `useIframePosition` + placeholder machinery) | ✅ done & QA'd |
| **TASK-103** | housekeeping | Static-only helper classes → modules (`Asset`/`Cache`/`DOM`/`Request`/`Storage`/`Url`/`Viewport`/`XMLAdaptor`) | ✅ done (Viewport kept as default object — spied via jest.spyOn) |
| **TASK-104** | quality | Accessibility baseline (ARIA, focus mgmt, reduced-motion, live region) | new |
| ~~TASK-111~~ | assets | ~~Replace the Material Icons webfont with inline SVGs~~ | ✅ **done & merged 2026-06-21** — new per-file `Icons/` dir (7 components), `b-ber-tasks` web chrome inlined, `material-icons` dep removed; full suite green |
| ~~TASK-105~~ | structure | ~~Component colocation + types/CSS-module structure~~ | **superseded/dropped 2026-06-21** — net-negative churn for a 12-component package; the one useful item (`SpreadFigure` `Consumer`→`useContext`) moved to TASK-068 |
| **TASK-106** | state | Execute the state migration: drop Redux → `useSyncExternalStore` + stable API context; folds in `book.content` | ✅ done — Step 4 from **TASK-073** (`STATE-MIGRATION-PLAN.md`) |
| — | styles | Inline/conditional styles → CSS Modules | **TASK-076 ✅ done & merged** (merge `b03d6399`, dev QA passed): `@import`→`@use` cleanup, **Spinner CSS-Module POC** + Jest/TS wiring, dev viewport-label removed, monorepo styling audit. **Decision: keep chrome global** — the `.bber-*` chrome classes are a shared, partly user-facing vocabulary (consumer override API); chrome scoping + a documented theming surface deferred to **TASK-110**. Project/theme SCSS toolchain → **TASK-109**. |
| — | theming | Reader chrome theming API (scope chrome + CSS custom props) | **TASK-110** — Option 2 from the TASK-076 chrome review; design-gated, needs versioning + 3rd-party coordination, out of scope for now |
| — | docs | Per-subdir documentation | **TASK-071** |
| — | cleanup | Marker `debug` block + dangling `IMPROVEMENT_PLAN.md` comment refs | ✅ **done in TASK-068** (2026-06-21) |

### Sequencing

1. **TASK-094** ✅ (conventions doc — complete) + **TASK-068** ✅ (housekeeping —
   done & merged 2026-06-21): established the patterns and cleared dead code.
2. **Step 1** components ✅ **complete & merged**: TASK-095 (leaves) → TASK-096
   (Media) → TASK-097 (App). All merged into `feat/upgrades`.
3. **Step 2** HOCs→hooks ✅ **complete & merged**: TASK-098 (measurement) →
   TASK-099 (position) → TASK-100 (selfRef removal). All merged into
   `feat/upgrades`. **All `with-*` are hooks and the selfRef shim is gone.**
4. **TASK-073** ✅ research decision → **TASK-106** (Step 4) state migration.
5. **TASK-091** anytime (independent dep upgrade).

### Deferred until *after* the migration (per user)

Spread-rendering / sentinel-polling bug work: **TASK-086** (reset `view.loaded`),
**TASK-087** (event-driven settle, supersedes polling), **TASK-088** (blank
spread pages), **TASK-089** (deep-link to spreadIndex), **TASK-069** (per-Spread
ResizeObserver), **TASK-078** (leaf flicker), **TASK-079/080** (loading-state /
FOUT visual). **TASK-075** (expand dev project URLs) is housekeeping, anytime.

### Known issues / tech debt (migrated from the deleted reader-react PLAN.md)

These inform the migration but are not yet individually tasked. Re-audited
2026-06-21 against the post-TASK-106 tree — two of the original five are now
resolved (struck through):

- ~~`book.content` module-level mutation bypasses the React render pipeline~~
  ✅ **resolved by TASK-106** — `book.content` is gone; chapter content lives in
  the store as `{ spineItemURL, node }` (`store/contentActions.ts`). The
  `spineItemURL` key-remount is now a deliberate, store-driven behavior, not a
  render-pipeline bypass. (Note: `b-ber-reader-react/AGENTS.md` "Architecture
  Notes" still describes the old `book.content` global and `selfRef` shim — both
  removed; that doc needs a refresh, fold into [[TASK-071]].)
- No explicit loading-state model (idle / loading-manifest / loading-chapter /
  ready / error) — **still valid**; the store carries only `view.loaded:
  boolean`. Candidate for a follow-up; not yet tasked.
- ~~`withLastSpreadIndex`: `setContentDimensions(0)` on slug change may trigger a
  spurious dispatch~~ ✅ **resolved** — now a hook
  (`lib/with-last-spread-index.tsx`); the contentDimensions effect skips its
  dispatch when the value is `0` (the "L2 fix", documented in-file at the
  `useEffect([props.slug])`), so the reset only clears the stale reading.
- ~~`navigateToElementById` (`components/Reader/navigation.ts`): hardcoded
  selectors + thin `/2` rationale~~ ✅ **documented in TASK-068** (2026-06-21) —
  explained why the selectors are hardcoded (no component ref) and what the `/2`
  represents (column index → spread index for the 2-column layout); behavior
  unchanged.
- ~~`Layout.tsx`: `debounce` called in the render body allocates a new fn every
  render~~ ✅ **fixed in TASK-068** (2026-06-21) — wrapped in `useMemo` (deps
  `[]`) routed through a ref so the stable debounced fn still calls the latest
  closure; resize effect deps/cleanup unchanged.

---

## ⚠️ Cross-feature dependencies (the ones that matter)

These are the edges where one feature gates another — watch these when
sequencing work:

1. **TASK-050 (Coverage) → TASK-046 (Node).** The logger refactor can't safely
   remove `process.exit` until CLI handler tests assert the current behavior.
2. ✅ **React 19 spread cluster (TASK-081–085) → TASK-032 (TS).** Resolved —
   layout stabilized and QA'd (2026-06-13), TS conversion landed. The deferred
   bug cluster (086–089, 069, 078) now waits on the modernization migration.
3. **E2E pipeline (TASK-044, ✓) → TASK-055 (testing skill).** Now unblocked.
4. ✅ **TASK-032 (TS reader-react) → TASK-019 close.** Resolved — both closed
   2026-06-13; the TS epic is complete.
5. **Coverage epic (TASK-004) ↔ reader-react.** reader-react reached 85%
   (2026-06-13: src/components/ 36% -> 96%) — no longer a drag on the
   repo-wide 75% target. Remaining laggards are cli (54%) and b-ber-tasks (13%).

---

## 🆕 Recently completed (last sessions)

- **TASK-112 — `__dirname` asset resolution + cheerio interop** (2026-09-20,
  released in `4.0.2`): `4.0.0` could not build a default project. tsdown bundles
  `b-ber-tasks` to a single `dist/index.js`, so `__dirname` is `dist/`, but
  `copy.sh` still mirrored `src/` into `dist/cover/` and `dist/web/` — breaking the
  cover font for every build format and all four `web` browser scripts. Fallout
  from TASK-030. Also fixed a cheerio default-import break from the same bundling
  change. Verified a fresh `npm install` of the published CLI builds
  reader/web/epub.
- **TASK-114 — reader-react version from `package.json`** (2026-09-20, released in
  `4.0.2`): the version module sat at its 2023 seed `3.0.7` because `lerna publish`
  never commits what lifecycle scripts write, so only the publish path reported
  correctly. Now a one-line JSON import — no generated file, no build config.
  Published `4.0.2` confirms `var cv = "4.0.2"`.
- **TASK-068 — reader-react phase-1 housekeeping** (2026-06-21): dead code +
  dangling plan refs removed, resize-handler names un-inverted, `ErrorBoundary`
  added around `Frame`'s `Layout`/`BookContent`, Marker `debug` block + unused
  `custom-prop-types` deleted, `SpreadFigure` `Consumer`→`useContext`, `Spread`
  id via `useId`, `Layout` debounce stabilized, `navigateToElementById`
  documented. Full suite green.
- **TASK-111 — material-icons webfont → inline SVGs** (2026-06-21): new per-file
  `src/components/Icons/` dir (7 components), `b-ber-tasks` web chrome inlined,
  `material-icons` dependency removed from root + reader-react. Full suite green.
- **TASK-081–085 — spread/layout-stability cluster complete + QA'd** (2026-06-13).
  Reusable QA checklist retained for human review (`SPREAD-CLUSTER-QA.md`)
- **TASK-093 — reader-react PLAN.md consolidated into this file and deleted**
  (eliminates the stale, ID-colliding duplicate)
- **TASK-032 / TASK-019 — TS migration epic complete.** reader-react converted
  (strict TS, 458 tests + 9 snapshots green) and merged; whole monorepo is now
  TypeScript (legacy `b-ber-reader` excluded by design)
- TASK-035 — CircleCI pipeline modernized (2.1, Node 24, PR validation on all branches)
- TASK-044 — E2E CI integration verified green
- TASK-049 — Codecov coverage reporting wired (badge + upload)
- TASK-004 — restructured into a consolidated coverage epic (26 stubs folded in)
- TASK-057/058/059 — build-script simplification, polyfill audit, build-target bumps
- TASK-054 — build dependency ordering research
- **Task system flattened** — all package tasks moved to root; PLAN reorganized by feature

---

## ▶️ What's next

| Priority | Task | Action | Why now |
| -------- | ---- | ------ | ------- |
| 0 | TASK-112 | ✅ **Done** — released in 4.0.2; verified a fresh `npm install` of the published CLI builds reader/web/epub | — |
| 0 | TASK-115 | **Add the `NPM_TOKEN` secret and dry-run `release-prepare.yml`** | Workflows are merged but unusable until the secret exists; this is what stops releases needing protection disabled |
| 1 | TASK-116 | Upgrade lerna to 9+/10 and switch to OIDC trusted publishing | Token path has a hard external deadline (Jan 2027) and a 90-day rotation until then; better done before it bites |
| 0 | TASK-121 | Work TASK-122 → 123 → 124 in order; TASK-125 in parallel | Dependabot is currently noise; the order matters because each step changes what the next one should do |
| 1 | TASK-113 | Investigate the watch-mode asset gap | Same copy-step design weakness as TASK-112, from the other end; cheap discovery |
| 1 | TASK-114 | ✅ **Done** — version reads from `package.json`; generated module retired, `b-ber-reader` alias fixed | — |
| 1 | TASK-106 | ✅ **Done** — state migration shipped (Redux removed, built-in store + ReaderApiContext, browser QA passed). Dissolved `connect()` + TASK-032 type debt. | — |
| 2 | TASK-050 | CLI handler tests | Unblocks TASK-046 and lifts cli coverage toward 75% |
| 3 | TASK-004 | Push coverage laggards to 75% | Closes the coverage epic; cli + b-ber-tasks are the long poles |
| 4 | TASK-055 | Create the testing skill | Newly unblocked by the green E2E pipeline |
| 6 | TASK-052 | Prototype `npm pack` publish-smoke test | Guards against the canary-only bug class |

---

## 🌿 Project overview / branch strategy

**`main` is now the trunk, and it is protected.** `feat/upgrades` merged into
`main` and shipped as `4.0.0` (2026-07-16); there is no long-lived integration
branch any more. Work happens on **task branches named
`TASK-NNN-<short-descriptive-title>`**, cut from `main`, pushed to `origin` and
merged **via pull request** — never by a local merge into `main`. See
[AGENTS.md § Branch Strategy](./AGENTS.md#branch-strategy) for the workflow and
[§ Releases](./AGENTS.md#releases) for the two-step publish flow that works with
branch protection.

| Branch | Role | Status |
| ------ | ---- | ------ |
| `main` | trunk — stable, production-ready | active |
| `TASK-116-oidc-trusted-publishing` | TASK-116 (OIDC trusted publishing) | pending merge |
| `TASK-115-release-workflow` | TASK-115 (release automation) | merged ✓ (PR #592, `b4a43b6b`) |
| `TASK-112-114-closeout` | TASK-112/114 closeout + PR policy + release docs | merged ✓ (PR #590, `f2a399ea`) |
| `TASK-112-dirname-asset-paths` | TASK-112 (asset-path regression fix) | merged ✓ (`66b64301`, shipped `4.0.2`) |
| `TASK-114-version-from-package-json` | TASK-114 (version injection) | merged ✓ (`66b64301`, shipped `4.0.2`) |
| `feat/upgrades` | former integration branch | merged ✓ (`84ca5785`, shipped `4.0.0`) |
| `feat/vite-migration` | TASK-006/007/015 | merged ✓ |
| `feat/ts-stage-1` → `-3` | TASK-008–012, 024–031 | merged ✓ |
| `feat/e2e`, `feat/e2e-ci` | TASK-039–044 | folded into `feat/upgrades` ✓ |
| `feat/ts-stage-4` | TASK-032 (reader-react TS) | merged ✓ (`ceb3d636`) |
| `feat/react19-step1-leaves` | TASK-095 (leaf components) | merged ✓ |
| `feat/react19-step1-media` | TASK-096 (Media subtree) | merged ✓ |
| `feat/react19-step1-app` | TASK-097 (App) | merged ✓ |
| `feat/react19-step2-measurement-hocs` | TASK-098 (measurement HOCs→hooks) | merged ✓ |
| `feat/react19-step2-position-hocs` | TASK-099 (position HOCs→hooks + TASK-084 getPageWidth) | merged ✓ |
| `feat/react19-step2-selfref-removal` | TASK-100 (selfRef shim → useLoader/useNavigation/useResize) | merged ✓ |
| `feat/node-modernization-*` | TASK-013 per-package slices | not started |

**Before opening a task branch's PR → `main`:** `npm test` green from root; the
task PRD's subtasks checked and status set; this file current. Close the GitHub
issue and drop the PRD's `.open` suffix once the PR merges.
