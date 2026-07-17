# TASK-038: Audit and clean up package.json scripts across the monorepo

**Status:** complete (2026-06-20)
**Feature:** Upgrade tooling
**Scope:** monorepo
**Priority:** medium

> **Note (2026-06-20):** Most of this PRD's "Current problems" predate the
> migrations it was waiting on — TS Stage 3 (TASK-029–031), Vite (TASK-006), and
> Lerna v8 (TASK-036) have all **landed**, so the Babel `prepare:dist→prepare→build`
> chains, the webpack scripts, `check:code`, and `reader:shim` are already gone.
> The work was re-scoped against the **current** `package.json` files; see Outcome.
**GitHub Issue:** #509 — https://github.com/triplecanopy/b-ber/issues/509

## Description

Every `package.json` in the monorepo carries scripts accumulated over years of
tooling churn. The result is inconsistent naming, opaque call chains, obsolete
wrappers, and placeholder scripts that actively fail. This task audits all
scripts and defines a clean, uniform target state.

Some cleanup is unblocked now. Other changes are downstream of in-progress
migrations (TS Stage 3 / TASK-029–031, Vite / TASK-006, Lerna upgrade /
TASK-036) and should be made as part of — or immediately after — those tasks
land. This PRD captures both so the target state is clear ahead of time.

---

## Current problems by package

### Root `package.json`

| Script                          | Problem                                                                                                                        |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `build`                         | Fragile inline `sed` + backtick shell expansion to build `b-ber-reader-react` first, then everything else. Opaque and brittle. |
| `bootstrap` / `bootstrap:clean` | Use `lerna bootstrap --hoist`, removed in Lerna v7. Blocked on TASK-036.                                                       |
| `check:code`                    | `echo "todo"` placeholder. ESLint is not wired up.                                                                             |
| `reader:shim`                   | Manual `cd packages/b-ber-reader && npm i` workaround — artifact of how reader's deps were managed.                            |
| `postpublish`                   | `node scripts/run-ci.js` — likely an obsolete CI trigger from a previous workflow.                                             |
| `publish:lts-2`                 | Inline branch guard (`[[ $(git rev-parse …) != lts-2 ]]`) — fragile shell in a JSON value.                                     |
| `check:circular`                | Uses `madge` — verify it is in `devDependencies`; if not, the script silently does nothing.                                    |
| `outdated`                      | Uses `lerna exec --no-bail`, deprecated syntax in recent Lerna.                                                                |

### Babel-era packages (b-ber-cli, b-ber-tasks, b-ber-resources)

These three packages still use Babel and share an unnecessary three-step chain:

```
prepare:dist  →  prepare  →  build
```

`build` just calls `prepare`, which calls `clean` then `prepare:dist`. The
intermediate steps exist only because the repo used `npm prepare` as the build
hook during Lerna bootstrap. Once these packages are converted to TypeScript
(TASK-029 b-ber-tasks, TASK-031 b-ber-cli), they will drop to a single
`build: tsdown` like all other TS packages. `b-ber-resources` will need its own
assessment since it outputs files into `./` rather than `dist/`.

The `b-ber-tasks` `prepare:dist` is also particularly long — it excludes five
web/serve JS files via `--ignore` flags that are not compiled by Babel. After
TS migration these files need to be handled explicitly (bundled, excluded, or
deleted if unused).

### b-ber-reader-react

| Script                                | Problem                                                                                   |
| ------------------------------------- | ----------------------------------------------------------------------------------------- |
| `webpack:src` / `webpack:dist`        | Delegate to `./scripts/webpack.sh`. Will be removed when Vite migration (TASK-006) lands. |
| `prepublish` + `preversion`           | Both run `npm test`. Redundant; `prepublishOnly` alone is sufficient.                     |
| `webpack` / `webpack-bundle-analyzer` | Expose binary shortcuts — unusual pattern, check if anything relies on them.              |
| `bundle`                              | `npm run build && npm pack` — verify this is still used.                                  |
| `analyze`                             | Delegates to `./scripts/analyze.sh` for bundle analysis — will go away with Vite.         |

All webpack-specific scripts (`webpack:src`, `webpack:dist`, `webpack`,
`webpack-bundle-analyzer`, `analyze`) go away when TASK-006 lands.

### b-ber-reader (legacy)

| Script                      | Problem                                                                                                                                 |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `test`                      | `echo "TODO tests"` — placeholder that exits 0. Either add tests or remove the script (Lerna will skip packages with no `test` script). |
| `prepublish` / `preversion` | Both `npm test`; redundant (same pattern as reader-react).                                                                              |
| `serve`                     | `npm run build && nodemon server.js` — verify `nodemon` is in `devDependencies`.                                                        |

### b-ber-theme-serif / b-ber-theme-sans

| Script  | Problem                                                                                                                                                                         |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test`  | `echo "Error: no test specified" && exit 1` — actively fails when Lerna runs the test step. Should be removed or replaced with an explicit `exit 0` if skipping is intentional. |
| `clean` | `echo OK` — no-op. Remove it.                                                                                                                                                   |

Both theme packages build SCSS; `b-ber-theme-sans` has no build script at all.
Assess whether these packages need a `build` step or whether they're consumed
as raw SCSS source by packages that compile them.

---

## Target state

All packages that produce compiled output should converge on:

```json
{
  "scripts": {
    "build": "tsdown",
    "typecheck": "tsc --noEmit",
    "test": "jest"
  }
}
```

Packages without tests should omit `test` (or use `exit 0` if Lerna requires
the key to be present — verify). Packages with no compilable output (themes,
resources-as-source) need explicit decisions about what `build` means for them.

Root `package.json` target:

- `build`: `lerna run build` (no special ordering needed once the Babel packages
  are migrated — tsdown handles ESM/CJS output without the reader-first sequencing)
- `test`: `lerna run test` (ESLint check separate if wired up, or `check` remains)
- Remove `reader:shim`, `postpublish`, `publish:lts-2` (or move branch guard into a script file)
- Resolve `check:code` — either wire up ESLint or remove the check from `test`

---

## Subtasks

- [ ] Audit root `package.json` — document each script's purpose and current status
- [ ] Identify and remove/replace dead scripts in root (postpublish, reader:shim, publish:lts-2 inline guard)
- [ ] Fix theme packages: remove failing `test` scripts and no-op `clean`; confirm b-ber-theme-sans build situation
- [ ] Clean up b-ber-reader (legacy) scripts: resolve TODO test placeholder, remove redundant lifecycle hooks
- [ ] Confirm b-ber-reader-react redundant lifecycle hooks (prepublish+preversion); defer webpack script removal to TASK-006
- [ ] As part of TASK-029 (b-ber-tasks TS): remove `prepare:dist`/`prepare` chain, replace with `build: tsdown`
- [ ] As part of TASK-031 (b-ber-cli TS): same chain removal
- [ ] Assess b-ber-resources after Babel migration — decide whether it compiles to `dist/` or stays as source
- [ ] After TASK-036 (Lerna upgrade): update root `bootstrap`/`bootstrap:clean`, `outdated`, `build` ordering if needed
- [ ] After TASK-006 (Vite): remove all webpack-specific scripts from b-ber-reader-react
- [ ] Verify `madge` is in root devDependencies; wire up or remove `check:circular`

## Notes

The Babel-era chain (`prepare:dist` → `prepare` → `build`) exists because Lerna
v4 called `npm prepare` during `lerna bootstrap`. This lifecycle hook is no
longer meaningful after bootstrap is removed (TASK-036). The chain can be
collapsed as each package is migrated.

The root `build` script's reader-first ordering was needed because
`b-ber-reader-react`'s webpack build must complete before a shim step modifies
`b-ber-reader`'s `node_modules`. After the Vite migration (TASK-006) that shim
goes away, and `lerna run build` can be a simple parallel invocation.

Some of these scripts will be touched anyway as part of their respective
migration tasks. This task exists to ensure the cleanup is deliberate and
complete rather than left as residue after each migration.

Relates to: TASK-006 (Vite), TASK-029–031 (TS Stage 3), TASK-036 (Lerna upgrade)

---

## Outcome (2026-06-20) — audited against current state

**Applied (TASK-047 watch scripts):** added a `watch` script to every
build-producing package — `tsdown --watch` for the 28 tsdown packages,
`vite build --watch --config vite.config.lib.js` (reader-react),
`vite build --watch` (reader), `tsc --noEmit --watch` (validator). The root
`watch` (`lerna run watch --stream`) now actually does something. Smoke-tested
`tsdown --watch` (builds + watches).

**Removed dead/failing scripts:**
- `b-ber-theme-serif` / `b-ber-theme-sans`: dropped the actively-**failing**
  `test` (`echo "Error: no test specified" && exit 1`) and the no-op
  `clean: echo OK`.
- `b-ber-reader` (legacy): dropped the `test: echo "TODO tests"` placeholder.

**Fixed broken root scripts:**
- `browserlist:update` → `browserslist:update` (key typo) and the deprecated
  `npx browserslist@latest --update-db` → `npx update-browserslist-db@latest`.

**Fixed a latent test-gate regression (surfaced by running root `npm test`):** the
root `jest.config.js` lacked the `*.module.{css,scss}` `moduleNameMapper` that
TASK-076 added only to reader-react's config, so the root run failed on the
Spinner CSS-module import. Added the mappers → root `npm test` green again (130
suites, 1022 tests).

**Verified already-clean (PRD stale):** root `build` (`lerna run build`),
`bootstrap`/`bootstrap:clean` (`lerna clean` still exists in v8), `check:circular`
(fixed in TASK-022), `madge` present, the Babel chains and webpack scripts (gone
via TS/Vite). `outdated` left as-is (works).

**Deliberately deferred (other tasks own them):**
- `postpublish` (`scripts/run-ci.js` — remote CI trigger), `publish:*`, and
  `changelog` → **TASK-045** (release/changelog workflow). Not touched here to
  avoid overlap.
- Theme `build:sass`/`watch:sass` normalization → **TASK-109** (the theme SCSS
  compile path / `~` importer). The theme `application.scss` files use `~` imports
  that don't resolve under a plain `sass` invocation, so promoting those scripts
  is unsafe until TASK-109 lands. Theme cleanup here was limited to removing the
  dead `test`/`clean` only.

### Subtask disposition

- [x] Audit root `package.json` — done (most prior problems already resolved).
- [x] Remove/replace dead root scripts — `browserlist:update` fixed; `check:code`
      / `reader:shim` already gone; `publish:lts-2`/`postpublish` deferred to TASK-045.
- [x] Fix theme packages: removed failing `test` + no-op `clean`. (build/watch → TASK-109.)
- [x] Clean up b-ber-reader: removed TODO `test` placeholder; redundant lifecycle hooks already gone.
- [x] b-ber-reader-react redundant lifecycle hooks — already gone (Vite migration); added `watch`.
- [x] ~~TASK-029 b-ber-tasks chain removal~~ — already `build: tsdown && npm run copy`.
- [x] ~~TASK-031 b-ber-cli chain removal~~ — already `build: tsdown`.
- [x] b-ber-resources — already `build: tsdown`; added `watch`.
- [x] After TASK-036 — `bootstrap`/`bootstrap:clean`/`outdated`/`build` verified fine.
- [x] After TASK-006 — webpack scripts already removed.
- [x] `madge` in devDeps + `check:circular` — confirmed + already wired (TASK-022).
- [x] **(new) Applied TASK-047 watch scripts** across all build-producing packages.
