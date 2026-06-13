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
| 🔧 Upgrade tooling | 15 | 0 | 10 | Core toolchain shipped; remaining is dep/release/docs polish |
| 🔤 Migrate JS→TS | 18 | 0 | 0 | ✅ **Epic complete** — reader-react (TASK-032) merged; every package except legacy `b-ber-reader` is TypeScript |
| ✅ Unit test coverage | 2 | 1 | 2 | Epic in progress; most packages at target, a few laggards |
| 🧪 E2E testing | 5 | 1 | 2 | Pipeline green in CI; skill + iframe fix remain |
| ⚙️ Node.js modernization | 1 | 0 | 2 | Barely started; epic + logger refactor pending |
| ⚛️ React 19 (reader-react) | 17 | 1 | 20 | Migration tasks scoped (TASK-094–100); conventions doc in review. **class→functional → HOC→hooks → state migration** |

_"Active" = in progress. "Backlog" = not started (excludes superseded)._

---

## 🔧 Upgrade tooling

**Shipped:** Vite (TASK-006/007), Biome (TASK-015), Jest 29 (TASK-034), Lerna v8
+ drop bootstrap (TASK-036), CircleCI modernization (TASK-035), Codecov
(TASK-049), build-script simplification (TASK-054/057/058), circular-import audit
(TASK-016), GitHub issue setup (TASK-014).

| Task | Pri | Outstanding work |
| ---- | --- | ---------------- |
| TASK-092 | med | Fix Codecov "Validate CLI" GPG failure turning the `build` job red |
| TASK-052 | med | Test the published artifact without the real registry (prefer `npm pack` over Verdaccio) |
| TASK-053 | med | Replace `lerna-update-wizard` with syncpack + ncu |
| TASK-037 | med | Replace/reconfigure dependency management (Dependabot is paused + broken) |
| TASK-038 | med | Audit and clean up `package.json` scripts |
| TASK-045 | med | Refactor changelog generation + release workflow |
| TASK-047 | med | Research watch-mode scripts for dev |
| TASK-017 | med | Expand architecture diagrams |
| TASK-021 | low | Audit `--no-package-lock` in lerna bootstrap |
| TASK-022 | low | Automate circular dependency checks in CI |

> TASK-023 (Lerna research) is **superseded** by TASK-036; TASK-020 (Vite+Biome
> umbrella, complete) and TASK-018 (issue back-links, obsolete) were closed
> 2026-06-11.

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

### Remaining surface (verified 2026-06-13)

- **9 class components:** `App`, `SidebarSettings`, `Footnote`, `Marker`,
  `Media`, `Vimeo`, `Iframe`, `MediaControls`, `MediaButtonVolume`.
- **4 class HOCs:** `with-dimensions`, `with-node-position`, `with-iframe-position`,
  `with-navigation-actions` (`with-last-spread-index` is already functional).
- **`UNSAFE_*` lifecycles** in ~6 of the above + the `selfRef` shim in
  `Reader/index` (`navigation.js`/`loader.js`/`resize.js` still use `this.*`).
- **State:** plain Redux + `redux-thunk` + `connect()` **and** two React Contexts
  (`reader-context`, `spread-context`) **and** hooks — the mix to consolidate.

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
| TASK-095 | 1 | Leaf components: `Footnote`, `Marker`, `SidebarSettings` | Sonnet |
| TASK-096 | 1 | Media subtree: `Media`, `Vimeo`, `Iframe`, `MediaControls`, `MediaButtonVolume` | Sonnet (Media/Vimeo tricky) |
| TASK-097 | 1 | `App` (async `UNSAFE_` + `connect`) | Opus |
| TASK-098 | 2 | Measurement HOCs→hooks: `with-dimensions`, `with-navigation-actions` | Sonnet |
| TASK-099 | 2 | Position HOCs→hooks: `with-node-position`, `with-iframe-position` (**absorbs deferred TASK-084 `getPageWidth`**) | Opus |
| TASK-100 | 2 | Remove `selfRef` shim: `navigation`/`loader`/`resize` → hooks | Opus |

**Step 3 (evaluate deps) — TASK-073 (research, now unblocked).** Decision lean:
**away from Redux toward built-in React state** (reduce 3rd-party deps; RTK is
the fallback, not the default). Also TASK-091 (react-player v3, independent).

**Step 4 (migrate state per findings)** — execution task opened from TASK-073's
recommendation; best done after Steps 1–2 (functional components make it small).

**Step 5 (reorg / best practices)** — TASK-068 (housekeeping), TASK-071 (docs),
TASK-076 (SCSS→CSS Modules), plus general organization cleanup.

### Sequencing

1. **TASK-094** (conventions — user review pending) + **TASK-068** (housekeeping):
   establish the patterns and clear dead code before refactoring.
2. **Step 1** components: TASK-095 (leaves) → TASK-096 (Media) → TASK-097 (App).
3. **Step 2** HOCs→hooks: TASK-098 (measurement) → TASK-099 (position) →
   TASK-100 (selfRef removal, highest-risk — do last).
4. **TASK-073** research decision → **Step 4** state migration.
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
| 1 | TASK-094 | User reviews the migration conventions doc | Gates the whole Step 1+2 wave; every task follows it |
| 2 | TASK-095 → 100 | Run the class→functional / HOC→hooks waves (per the Model field) | Tasks scoped & ready; conventions + tests guard behavior |
| 3 | TASK-073 | Run the state-management research (built-in over Redux) | Now unblocked by TS; output gates Step 4 |
| 4 | TASK-050 | CLI handler tests | Unblocks TASK-046 and lifts cli coverage toward 75% |
| 5 | TASK-004 | Push coverage laggards to 75% | Closes the coverage epic; cli + b-ber-tasks are the long poles |
| 6 | TASK-055 | Create the testing skill | Newly unblocked by the green E2E pipeline |
| 7 | TASK-052 | Prototype `npm pack` publish-smoke test | Guards against the canary-only bug class |

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
| `feat/node-modernization-*` | TASK-013 per-package slices | not started |

**Before merging `feat/upgrades` → `main`:** `npm test` green from root; no
high-priority `.open` tasks left untouched; this file current; feature branches
merged or noted as in-progress.
