# TASK-112: Fix `__dirname`-relative asset resolution broken by the tsdown flat bundle

**Status:** complete
**Feature:** Upgrade tooling
**Scope:** b-ber-tasks
**Priority:** high
**GitHub Issue:** #587 — https://github.com/triplecanopy/b-ber/issues/587

## Description

`b-ber` 4.0.0 cannot build a default project. A consumer running the
Docker-based `b-ber-watch` watcher reported:

```
Error: Could not load font: ENOENT: no such file or directory, open
'/usr/local/lib/node_modules/@canopycanopycanopy/b-ber-cli/node_modules/@canopycanopycanopy/b-ber-tasks/dist/freeuniversal-bold-webfont.ttf'
    at .../pureimage/src/text.js:42:32
```

**The font was not removed.** It ships in the published 4.0.0 tarball at
`dist/cover/freeuniversal-bold-webfont.ttf`. What changed is where the code
looks for it. `src/cover/index.ts` reads the font as
`path.join(__dirname, 'freeuniversal-bold-webfont.ttf')`, and `__dirname` moved
when the build changed shape:

| Build | Output | `__dirname` | Asset copied to | Result |
| ----- | ------ | ----------- | --------------- | ------ |
| ≤ 3.1.0 (`babel -d dist/ src/`) | `dist/cover/index.js` | `dist/cover` | `dist/cover/` | ✅ resolves |
| 4.0.0 (tsdown bundle) | `dist/index.js` | `dist` | `dist/cover/` | ❌ ENOENT |

Babel's per-file output mirrored the `src/` tree, so `__dirname` was the
module's own directory. tsdown bundles all of `src/` into a single
`dist/index.js`, so `__dirname` is always `dist/` — but `copy.sh` kept
mirroring `src/` subdirectories into `dist/web/` and `dist/cover/`, where the
bundle can no longer reach them.

This is accidental fallout from TASK-030 (the b-ber-tasks TS conversion), not an
intentional move. TASK-030's own notes record the near-miss: `copy.sh` gained
`mkdir -p dist/web dist/cover` because "tsdown's flat output doesn't create
these subdirs" — the subdirectories were created rather than recognised as
unreachable.

### Blast radius

Five `__dirname` asset reads broke, all in `b-ber-tasks`:

| Asset | Read at | Affected command |
| ----- | ------- | ---------------- |
| `freeuniversal-bold-webfont.ttf` | `src/cover/index.ts:143` | **every** build format — `cover` is in the base build sequence — but only for projects with no `cover` term in `metadata.yml`, which take the generated-cover fallback |
| `navigation.js` | `src/web/index.ts:234` | `bber build web` |
| `search.js` | `src/web/index.ts:241` | `bber build web` |
| `event-handlers.js` | `src/web/index.ts:248` | `bber build web` |
| `worker.js` | `src/web/index.ts:348` | `bber build web` |

Not consumer-specific: a stock `bber new` project on this checkout reproduces
the error verbatim. `b-ber-resources` also uses `__dirname` but already accounts
for the flat `dist/` (`path.resolve(__dirname, '..')` → package root) and is
unaffected.

### Second defect found while verifying

With the font path fixed, `bber build web` then failed with
`Cannot read properties of undefined (reading 'load')`. cheerio 1.2.0 ships CJS
that sets `__esModule: true` but exports no `default`, so the bundler's interop
helper leaves it untouched and `cheerio.default` is `undefined` — breaking
`import cheerio from 'cheerio'` in `src/web/index.ts`. Same root cause family
(bundling changed module interop), different mechanism.

An audit of all 53 modules the bundle `require`s found cheerio to be the **only**
one in that state. `bber build reader` does not use cheerio, so the font fix
alone unblocks the reporting consumer.

## Subtasks

- [x] Reproduce against a stock `bber new` project (not just the consumer's)
- [x] Confirm the font is present in the published 4.0.0 tarball (rule out an
      accidental deletion or a missing `files` entry)
- [x] Trace the regression to the Babel→tsdown output-shape change
- [x] Enumerate every `__dirname`-relative asset read in the monorepo; confirm
      `b-ber-resources` is unaffected
- [x] Fix `copy.sh` to place assets directly beside the bundle entry
- [x] Add a fail-fast guard so a missing asset breaks **our** build, not a
      consumer's
- [x] Fix the cheerio default-import interop in `src/web/index.ts`
- [x] Audit every module the bundle requires for the same interop hazard
- [x] Verify end-to-end: `build web`, `build reader`, `build epub` on a fresh
      project; cover JPEG valid; search index populated
- [x] Quality gates: `typecheck`, `biome check`, root `jest`
- [x] Commit on `TASK-112-dirname-asset-paths`; update `PLAN.md`; open the
      GitHub issue
- [x] Released in **4.0.2**; merged to `main`; issue closed

## Resolution

Two changes, both in `b-ber-tasks`:

**1. `copy.sh` — put assets where the bundle looks for them.**

Assets now land at `dist/<basename>` instead of mirroring `src/` into
`dist/web/` and `dist/cover/`. This keeps `path.join(__dirname, name)` correct
in *both* layouts: in `src/`, the assets sit beside their importing module
(`src/cover/index.ts` next to `src/cover/*.ttf`); in `dist/`, they sit beside
the bundle. Nothing else in the monorepo referenced `dist/web` or `dist/cover`
(verified by grep), so flattening is safe.

Also added `set -euo pipefail`, quoted the path expansions, and appended a guard
that fails the build if any expected asset is missing or empty. The original
`${file/src/dist}` substitution was what silently produced the wrong
destination; `basename` makes the intent explicit.

**2. `src/web/index.ts` — named cheerio import.**

`import cheerio from 'cheerio'` → `import { load as loadHtml } from 'cheerio'`,
which also matches the monorepo's named-exports preference.

### Verification

Fresh `bber new` project, all three formats that exercise the changed paths:

| Command | Before | After |
| ------- | ------ | ----- |
| `bber build web` | ENOENT (font) → then `.load` of undefined | ✅ Build succeeded |
| `bber build reader` | ENOENT (font) | ✅ Build succeeded |
| `bber build epub` | ENOENT (font) | ✅ Build succeeded |

Beyond exit status: the generated cover is a valid 1600×2400 JPEG, and
`search-index.json` comes out populated with real titles and body text — so the
cheerio path actually works rather than merely not throwing.

Gates: `npm run typecheck` clean; `biome check .` 0 errors (17 pre-existing
warnings, none in touched files); root `npx jest` 130/130 suites, 1021 passed.

## Notes

- **Origin:** TASK-030 (b-ber-tasks → TypeScript). Not a code-review miss so
  much as a test-coverage blind spot: the failure is invisible to unit tests and
  typechecking because it only appears when a real build runs the task, and the
  throw happens inside a pureimage/opentype callback that no `.catch`
  intercepts. See TASK-113 for the related watch-mode gap in the same
  copy-step design.

- **Released in 4.0.2** (2026-09-20), not `4.0.1`: the first publish attempt was
  rejected pushing lerna's version commit at protected `main`, so it never reached
  npm and the retry moved to the next patch. An orphan `v4.0.1` tag is pushed with
  no corresponding registry release. Verified against the published artifacts:
  `b-ber-tasks@4.0.2`'s tarball carries the font and all four browser scripts at
  `dist/` root, and a fresh `npm install @canopycanopycanopy/b-ber-cli@4.0.2`
  builds `reader`, `web` and `epub` successfully — the reporting consumer is
  unblocked. The release-process problem is written up in AGENTS.md § Releases.

- **The consumer's follow-up error is not ours.** After hand-placing a font
  they hit `Unsupported OpenType version`, which means the file they supplied
  was not a font container. The repo's copy parses fine; the exact message shape
  (a trailing tag of non-printable bytes) was reproduced locally with
  zero-filled content, and HTML (e.g. a download of GitHub's blob *page*) or
  woff2 produce the same class of error. Copying
  `dist/freeuniversal-bold-webfont.ttf` would have worked.

- Running `jest` from inside `packages/b-ber-tasks` shows one failing suite,
  `inject.test.js`, on an unrelated `fs-extra` mock (`readJSONSync is not a
  function`). Confirmed pre-existing by stashing these changes and re-running —
  identical result. It does not appear in the root `jest` run, which resolves
  mocks differently. Out of scope here; worth its own task if it keeps biting.

- A jest regression test for asset placement was considered and rejected: it
  would have to assert against build output, which the test suite does not
  otherwise depend on. The `copy.sh` guard covers the same failure at the point
  where it is actually introduced, and runs on every `npm run build` and
  `prepublishOnly`.
