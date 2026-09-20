# TASK-114: Inject reader-react's version from package.json instead of generating a source module

**Status:** complete
**Feature:** Upgrade tooling
**Scope:** b-ber-reader-react
**Priority:** medium
**GitHub Issue:** #589 — https://github.com/triplecanopy/b-ber/issues/589

## Description

`b-ber-reader-react` renders its own version into a `<meta name="generator">`
tag (`src/index.tsx:19`), reading it from `src/lib/version.ts`. That module was
wrong, and the mechanism meant to keep it up to date had never worked across more
than one release.

### The defect, as found

- `src/lib/version.ts` — **tracked**, said `3.0.7`
- `src/lib/version.js` — **untracked**, regenerated on every publish by
  `scripts/version.js` (wired to npm's `version` lifecycle), held the real version
- `src/index.tsx:3` imports `./lib/version` extensionless, and both Vite and Jest
  resolve `.js` before `.ts`, so the untracked file **shadowed** the tracked one

The publish path was accidentally correct — `lerna publish` runs the `version`
lifecycle before `prepublishOnly` builds, so the generated file exists by the
time the bundle is built. Verified: the published 4.0.0 tarball contains
`var cv = "4.0.0"`. **Every other build path was wrong.** Moving the untracked
file aside and rebuilding produced `var cv = "3.0.7"` — what a fresh clone, CI, a
`git clean -fdx`, or any consumer building from source got.

It was also why the working tree went dirty after every release.

### Why it was set up this way (investigated 2026-09-20)

Worth recording, because the original design was reasonable and the failure is
narrower than it looks.

`2b5058ca` (2023-09-07) added the feature: the `<meta>` tag, `scripts/version.js`,
and a seeded `src/lib/version.js` containing `3.0.7` — which was the package's
actual version that day. At the time the build was **webpack**
(`"webpack:src": "./scripts/webpack.sh"`), years before the Vite migration.

The constraint driving the design: reader-react is a **browser** bundle, so it
cannot read `package.json` at runtime the way Node-side packages do — `b-ber-lib`,
for instance, does `fs.readJSONSync(require.resolve('./package.json'))` in
`State`. The version therefore has to be baked in at build time. A generated
source module was the option that needed no bundler configuration at all and
behaved identically under webpack and Jest. That is a sound call for 2023.

What was missed is that **`lerna publish` does not commit files that lifecycle
scripts modify** — it stages `package.json`, `lerna.json` and changelogs, not
arbitrary working-tree changes. So the generated module was only ever a local
dirty artifact. The tracked copy has been `3.0.7` since the day it was seeded and
has never been updated by a release.

Two things hid this for three years:

1. **The feature was only ever shipped once.** `2b5058ca` landed on a development
   lineage that is **not** an ancestor of `v3.1.0` — confirmed with
   `git merge-base --is-ancestor`. The 3.0.8 → 3.1.0 releases (through May 2025)
   were cut from a line that never had the version tag; their published bundles
   contain no `generator` meta at all (checked the 3.0.8, 3.0.9, 3.0.10 and 3.1.0
   tarballs). That lineage became `feat/upgrades` → `main` → **4.0.0, the first
   and only release to ship this feature** — and it shipped correct. So the
   "tracked file goes stale across releases" weakness was never observable.
2. **The test cannot catch it.** `__tests__/lib/version.test.js` asserts only
   `/^\d+\.\d+\.\d+$/`. `3.0.7` satisfies that as happily as `4.0.0`. Verified:
   the test passes both with and without the stray file present.

The TS conversion (`aaea6c26`, 2026-06-13) renamed `version.js → version.ts`
without updating `scripts/version.js`. That did **not** create the staleness — it
only changed how it presents in `git status`, from ` M` (modified tracked file) to
`??` (untracked). Which is what finally made it visible.

### Chosen fix

Read the version straight from `package.json` in a one-line `src/lib/version.ts`:

```ts
import { version } from '../../package.json'
export default version
```

`resolveJsonModule` is already enabled in reader-react's tsconfig, so this needs
**no build configuration at all** — every bundler that compiles this source
inlines the named import at build time, and there is exactly one source of truth.
Nothing is generated, so nothing can go stale or be left uncommitted.

A Vite `define` was considered first and dropped. It would have worked, but it
needs the value registered in **five** places that compile this source —
`vite.config.lib.js` (the published lib), `vite.config.js` (dev server),
`vite.config.e2e.js` (e2e), `b-ber-reader/vite.config.js` (re-bundles reader-react
from source via alias), and Jest, which does not run Vite at all. Missing any one
yields `undefined` in that build, so it trades a generated file that drifts for
five registration points that drift.

The one objection to the JSON import was that it might pull more of
`package.json` than the single field into a public browser bundle. **Measured, and
it does not.** The built `dist/index.mjs` differs from the published 4.0.0
artifact by exactly **one byte** — the region comment `src/lib/version.js` became
`src/lib/version.ts`. The emitted code is `var cv = "4.0.0"` either way, and the
bundle contains none of `maxwellsimmer`, `b-ber@canopycanopycanopy.com`,
`vite.config.lib.js`, `GPL-3.0`, `devDependencies`, `triplecanopy/b-ber.git` or
`rimraf`. Rolldown narrows the JSON import to the accessed field.

## Subtasks

- [x] Replace `src/lib/version.ts` with a named import of `package.json`'s
      `version` (no build config needed — `resolveJsonModule` is already on)
- [x] Confirm `tsc --noEmit` accepts the JSON import from outside `include`
- [x] **Verify the bundle inlines a bare string literal**, not an inlined
      `package.json` object — the one real risk of this approach
- [x] Delete `scripts/version.js` and the `"version"` script from
      `packages/b-ber-reader-react/package.json`
- [x] Delete the stray untracked `src/lib/version.js`
- [x] **Strengthen the test** to assert equality with `package.json`'s `version`
      rather than a semver shape, and confirm it actually fails when a stale
      shadow module is reintroduced
- [x] Fix `b-ber-reader/vite.config.js`'s alias: `src/index.jsx` → `src/index.tsx`
- [x] Verify each build path independently embeds the right version: lib build,
      dev-server config, e2e build, `b-ber-reader` build, Jest
- [x] Confirm `b-ber-reader` still bundles reader-react from **source** after the
      alias fix (no `dist` require-shim in its output)
- [x] Update the now-stale `scripts/version.js` reference in
      `vite.config.lib.js`'s `"type": "module"` comment
- [x] Quality gates: `typecheck`, `biome check`, root `jest`
- [x] Released in **4.0.2**; merged to `main`; issue closed

## Verification

| Path | Config | Version embedded |
| ---- | ------ | ---------------- |
| Published library | `vite.config.lib.js` | `var cv = "4.0.0"` |
| Dev server | `vite.config.js` | `` J_=`4.0.0` `` |
| E2E build | `vite.config.e2e.js` | `` J_=`4.0.0` `` |
| `b-ber-reader` (from source) | `b-ber-reader/vite.config.js` | `` V_=`4.0.0` `` |
| Tests | `jest.config.js` | 2 passed |

The lib bundle is byte-identical to the published 4.0.0 artifact apart from one
character in a region comment. The strengthened test was confirmed to fail
(`Expected: "4.0.0" / Received: "3.0.7"`) when a stale shadow `version.js` is
reintroduced, so it guards the exact regression that hid for three years.

Gates: `tsc --noEmit` clean; `biome check .` 0 errors; root `jest` 130/130 suites,
1022 passed, 128 snapshots.

Because nothing is generated any more, the clean-checkout case is correct by
construction: the only inputs are the tracked `src/lib/version.ts` and
`package.json`. The builds above were run with no stray `version.js` present,
which *is* the clean-checkout condition.

## Notes

- **Confirmed in the wild:** the published `b-ber-reader-react@4.0.2` bundle
  contains `var cv = "4.0.2"`, with none of the author, license or dependency
  strings from `package.json`. This is the first release whose version is right
  *by construction* rather than because the lifecycle script happened to run in
  the publisher's tree first.

- **Stale alias fixed as part of this task** (user's call):
  `b-ber-reader/vite.config.js` aliased reader-react to
  `../b-ber-reader-react/src/index.jsx`, a path that **no longer exists** — the
  file is `index.tsx`. The build worked anyway because Vite applies its
  TypeScript-compatibility resolution (`.jsx` → `.tsx`) — it resolved by fallback
  rather than by intent. Now points at `.tsx`; re-verified that `b-ber-reader`
  still bundles from source and not from `dist` (no `__bberReact` require shim in
  its output).

- Same class of defect as TASK-112: a build-shape assumption that quietly stopped
  holding. There, Babel's per-file output → tsdown's flat bundle broke
  `__dirname`; here, a TS rename broke a hardcoded filename in a sibling script.
  Neither was caught by tests or typechecking because neither surface is covered
  by either.

- Raised while diagnosing TASK-112 — the dirty working tree left behind by the
  4.0.0 release was the visible symptom.
