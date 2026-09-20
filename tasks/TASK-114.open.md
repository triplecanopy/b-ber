# TASK-114: Inject reader-react's version from package.json instead of generating a source module

**Status:** not started
**Feature:** Upgrade tooling
**Scope:** b-ber-reader-react
**Priority:** medium
**GitHub Issue:** #589 — https://github.com/triplecanopy/b-ber/issues/589

## Description

`b-ber-reader-react` renders its own version into a `<meta name="generator">`
tag (`src/index.tsx:19`), reading it from `src/lib/version.ts`. That module is
currently wrong, and the mechanism that keeps it up to date has never worked
across more than one release.

### Current state

- `src/lib/version.ts` — **tracked**, says `3.0.7`
- `src/lib/version.js` — **untracked**, regenerated on every publish by
  `scripts/version.js` (wired to npm's `version` lifecycle), says the real version
- `src/index.tsx:3` imports `./lib/version` extensionless, and both Vite and Jest
  resolve `.js` before `.ts`, so the untracked file **shadows** the tracked one

The publish path is accidentally correct — `lerna publish` runs the `version`
lifecycle before `prepublishOnly` builds, so the generated file exists by the
time the bundle is built. Verified: the published 4.0.0 tarball contains
`var cv = "4.0.0"`. **Every other build path is wrong.** Moving the untracked
file aside and rebuilding produces `var cv = "3.0.7"` — that is what a fresh
clone, CI, a `git clean -fdx`, or any consumer building from source gets.

It is also why the working tree is dirty after every release.

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

Drop the generated source file entirely and inject the version at build time from
`package.json` via Vite `define`. This removes the thing that drifts rather than
relocating it: there is no generated file to forget to commit, no lifecycle script
to keep in sync with a filename, and no `.js`/`.ts` shadowing.

**Every config that compiles this source needs the define** — this is the real
cost of the approach, and missing one yields `undefined` in that build:

| Config | What it builds |
| ------ | -------------- |
| `b-ber-reader-react/vite.config.lib.js` | the **published** library |
| `b-ber-reader-react/vite.config.js` | dev server (`dev/index.jsx` → `../src`) |
| `b-ber-reader-react/vite.config.e2e.js` | e2e build (`dev/index.e2e.jsx` → `../src`) |
| `b-ber-reader/vite.config.js` | re-bundles reader-react **from source** via alias |
| `b-ber-reader-react/jest.config.js` | tests — Jest does not run Vite, so it needs the value supplied separately (`globals`, or `jest.setup.js`) |

To keep that list from becoming its own drift risk, define the replacement once
in a shared helper (e.g. a tiny module exporting the `define` object, read from
`package.json`) and import it into each config rather than repeating the literal.

Considered and rejected: `import { version } from '../../package.json'` in a
one-line `version.ts`. `resolveJsonModule` is already enabled in reader-react's
tsconfig, so this works today with **zero** config changes and one source of
truth — but it risks bundling more of `package.json` than the one field into a
public browser bundle if tree-shaking does not narrow the JSON import. `define`
guarantees a bare string literal. Noted here because it is the cheaper option if
the five registration points prove annoying in practice.

## Subtasks

- [ ] Add the version `define` to all four Vite configs, sourced from
      `package.json` through one shared helper (not four copies of the literal)
- [ ] Supply the same value to Jest (`globals` or `jest.setup.js`)
- [ ] Declare the injected identifier for TypeScript (ambient `declare const` in
      a `.d.ts`)
- [ ] Replace `src/lib/version.ts`'s contents with a read of the injected value,
      or delete the module and reference the injected identifier directly in
      `src/index.tsx`
- [ ] Delete `scripts/version.js` and the `"version"` script from
      `packages/b-ber-reader-react/package.json`
- [ ] Delete the stray untracked `src/lib/version.js` — **last**, since removing
      it before the fix silently drops local builds to `3.0.7`
- [ ] **Strengthen the test** to assert the rendered version equals
      `package.json`'s `version`, not merely that it is semver-shaped. The
      current assertion is why this went unnoticed
- [ ] Verify each build path independently embeds the right version: lib build,
      dev server, e2e build, `b-ber-reader` build, Jest
- [ ] Verify from a clean checkout (`git stash -u` or a scratch clone) that a
      build with no prior `npm version` run embeds the correct version — this is
      the specific regression being fixed
- [ ] Confirm the published bundle contains a bare string literal, not an
      inlined `package.json` object

## Notes

- **Do not delete the untracked `src/lib/version.js` before the fix lands.**
  Local and `b-ber-reader` builds currently depend on it; removing it downgrades
  them to `3.0.7`.

- Not urgent for the pending `4.0.1`: `lerna publish` will regenerate the stray
  file as `4.0.1` and the release will report correctly, exactly as 4.0.0 did.
  This task removes the fragility, it does not unblock the release.

- **Stale alias worth cleaning up while in here** (out of scope unless trivial):
  `b-ber-reader/vite.config.js` aliases reader-react to
  `../b-ber-reader-react/src/index.jsx`, a path that **no longer exists** — the
  file is `index.tsx`. The build works anyway because Vite applies its
  TypeScript-compatibility resolution (`.jsx` → `.tsx`), and I verified the
  bundle really is built from source, not from `dist` (no `__bberReact` require
  shim present, `b-ber-react-reader: ${version}` inlined). It resolves by
  fallback rather than by intent, so it should be corrected to `.tsx`.

- Same class of defect as TASK-112: a build-shape assumption that quietly stopped
  holding. There, Babel's per-file output → tsdown's flat bundle broke
  `__dirname`; here, a TS rename broke a hardcoded filename in a sibling script.
  Neither was caught by tests or typechecking because neither surface is covered
  by either.

- Raised while diagnosing TASK-112 — the dirty working tree left behind by the
  4.0.0 release was the visible symptom.
