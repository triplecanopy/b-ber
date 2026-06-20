# b-ber monorepo — Project Plan

_Last updated: 2026-06-13 (TS migration epic closed — TASK-032 reader-react merged, TASK-019 complete)._

This file is the **current state**. Conventions, standards, and the task-file
format live in [AGENTS.md](./AGENTS.md). All tasks live in `tasks/` at the repo
root (one flat `TASK-NNN` sequence). Regenerate coverage numbers any time with
`npm run test:coverage`.

---

## 🎯 Goal

Modernize the b-ber monorepo to a stable, maintainable baseline, then merge
`feat/upgrades` → `main`. All work is organized under **six features (epics)**.
Every task belongs to exactly one; every new task must too.

| Feature | What "done" means |
| ------- | ----------------- |
| 🔧 **Upgrade tooling** | Vite, Biome, Lerna v8, Jest 29, modern CI/coverage, sane dep + release workflow |
| 🔤 **Migrate JS→TS** | Every package authored in TypeScript |
| ✅ **Unit test coverage** | ≥ 75% statement coverage repo-wide |
| 🧪 **E2E testing** | CLI + reader browser tests running in CI against a real fixture build |
| ⚙️ **Node.js modernization** | Current Node standards (no deprecated APIs, modern engines, no `process.exit` in libs) |
| ⚛️ **React 19 (reader-react)** | Reader on modern React: functional components, observers (no polling), correct spreads, ESM, TS |

---

## 📊 Feature progress at a glance

| Feature | Done | Active | Backlog | State |
| ------- | ---- | ------ | ------- | ----- |
| 🔧 Upgrade tooling | 23 | 0 | 2 | Core toolchain shipped; scripts cleaned + watch scripts applied (TASK-038). Remaining: TASK-045 (release/changelog), TASK-109 (SCSS toolchain) |
| 🔤 Migrate JS→TS | 18 | 0 | 0 | ✅ **Epic complete** — reader-react (TASK-032) merged; every package except legacy `b-ber-reader` is TypeScript |
| ✅ Unit test coverage | 2 | 1 | 2 | Epic in progress; most packages at target, a few laggards |
| 🧪 E2E testing | 5 | 1 | 2 | Pipeline green in CI; skill + iframe fix remain |
| ⚙️ Node.js modernization | 1 | 0 | 2 | Barely started; epic + logger refactor pending |
| ⚛️ React 19 (reader-react) | 31 | 0 | 13 | **Steps 1 + 2 complete and merged into `feat/upgrades`** (TASK-095–100): no class components/HOCs, no selfRef shim. **Step 3 (TASK-073) done** — recommendation: drop Redux → `useSyncExternalStore` + stable API context (`STATE-MIGRATION-PLAN.md`). **Step 4 (TASK-106) ✅ done & merged** — Redux removed, built-in store + ReaderApiContext shipped, browser QA passed. **TASK-101 (page-nav race) done.** **TASK-107/108 ✅ done & QA'd.** **Housekeeping TASK-102 (Chrome-81 removal) + TASK-103 (helper classes → modules) ✅ done, QA'd & merged.** Next: TASK-105 (colocation, now unblocked). |

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
| **TASK-094** | 0 | Conventions doc (foundation) | Opus |
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
warm → hot → `book.content` → drop `connect()`/deps). Sequence TASK-105
(colocation) after it. **What landed:** scaffold
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
QA'd). **Done.**

**Step 5 (reorg / best practices)** — TASK-068 (housekeeping), TASK-071 (docs),
TASK-076 (SCSS→CSS Modules), plus general organization cleanup.

### Maintainability backlog (raised in code review 2026-06-14)

From a post-Steps-1/2 read of the reader. New tasks scaffolded; the rest map to
existing open tasks (noted in the right column).

| Task | Kind | Summary | Maps to / notes |
| ---- | ---- | ------- | --------------- |
| **TASK-101** | bug | Premature page-nav skips to next chapter (load race: `handleEvents` unlocks before `lastSpreadIndex` is measured) | ✅ done |
| **TASK-102** | housekeeping | Remove Chrome-81 workarounds (deletes `useIframePosition` + placeholder machinery) | ✅ done & QA'd |
| **TASK-103** | housekeeping | Static-only helper classes → modules (`Asset`/`Cache`/`DOM`/`Request`/`Storage`/`Url`/`Viewport`/`XMLAdaptor`) | ✅ done (Viewport kept as default object — spied via jest.spyOn) |
| **TASK-104** | quality | Accessibility baseline (ARIA, focus mgmt, reduced-motion, live region) | new |
| **TASK-105** | structure | Component colocation + types/CSS-module structure | unblocked — state migration (TASK-106) + helper→module (TASK-103) both landed; colocated-tests deferred pending tooling audit |
| **TASK-106** | state | Execute the state migration: drop Redux → `useSyncExternalStore` + stable API context; folds in `book.content` | ✅ done — Step 4 from **TASK-073** (`STATE-MIGRATION-PLAN.md`) |
| — | styles | Inline/conditional styles → CSS Modules | **TASK-076 ✅ done & merged** (merge `b03d6399`, dev QA passed): `@import`→`@use` cleanup, **Spinner CSS-Module POC** + Jest/TS wiring, dev viewport-label removed, monorepo styling audit. **Decision: keep chrome global** — the `.bber-*` chrome classes are a shared, partly user-facing vocabulary (consumer override API); chrome scoping + a documented theming surface deferred to **TASK-110**. Project/theme SCSS toolchain → **TASK-109**. |
| — | theming | Reader chrome theming API (scope chrome + CSS custom props) | **TASK-110** — Option 2 from the TASK-076 chrome review; design-gated, needs versioning + 3rd-party coordination, out of scope for now |
| — | docs | Per-subdir documentation | **TASK-071** |
| — | cleanup | Marker `debug` block + dangling `IMPROVEMENT_PLAN.md` comment refs | added to **TASK-068** |

### Sequencing

1. **TASK-094** (conventions — user review pending) + **TASK-068** (housekeeping):
   establish the patterns and clear dead code before refactoring.
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

These inform the migration but are not yet individually tasked:

- `book.content` module-level mutation bypasses the React render pipeline
  (forces re-render via the `spineItemURL` key) — fold into the Step 3/4 state
  work; it is the last major render-pipeline bypass.
- No explicit loading-state model (idle / loading-manifest / loading-chapter /
  ready / error) — candidate for the state migration.
- `withLastSpreadIndex`: `setContentDimensions(0)` on slug change may trigger a
  spurious dispatch (verify when HOC→hook).
- `navigateToElementById`: hardcoded DOM selectors + an unexplained `/2`
  division (needs documentation or a behavior probe).
- `Layout.jsx`: `debounce` called in the render body creates a new function each
  render (fix during the class→functional/hooks pass).

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
| 1 | TASK-106 | ✅ **Done** — state migration shipped (Redux removed, built-in store + ReaderApiContext, browser QA passed). Dissolved `connect()` + TASK-032 type debt. | — |
| 2 | TASK-050 | CLI handler tests | Unblocks TASK-046 and lifts cli coverage toward 75% |
| 3 | TASK-004 | Push coverage laggards to 75% | Closes the coverage epic; cli + b-ber-tasks are the long poles |
| 4 | TASK-055 | Create the testing skill | Newly unblocked by the green E2E pipeline |
| 6 | TASK-052 | Prototype `npm pack` publish-smoke test | Guards against the canary-only bug class |

---

## 🌿 Project overview / branch strategy

`feat/upgrades` is the long-lived **integration branch**: planning, docs, and
merged feature branches land here; it merges to `main` when a coherent set of
work is complete and `npm test` passes from the repo root. **Implementation
work happens on feature branches** (e.g. `feat/ts-stage-4`, per-package
`feat/node-modernization-*`); never commit implementation directly to `main`.

| Branch | Role | Status |
| ------ | ---- | ------ |
| `main` | stable, production-ready | — |
| `feat/upgrades` | integration branch | active |
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

**Before merging `feat/upgrades` → `main`:** `npm test` green from root; no
high-priority `.open` tasks left untouched; this file current; feature branches
merged or noted as in-progress.
