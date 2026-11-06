# TASK-139: Upgrade image-size 0.8 → 2 (CVE-2025-71330)

**Epic:** Dependency health
**GitHub Issue:** #705 — https://github.com/triplecanopy/b-ber/issues/705
**Scope:** lib, tasks, templates, grammar-image

## Description

Renovate PR #679 is a `[security]` update of `image-size` from `^0.8.3` to
`^2.0.0`, two majors.

**CVE-2025-71330 / GHSA-w3rx-r6r6-pgpr** (CVSS 4.0: 8.7 high): image-size
through 2.0.2 loops forever on an ICNS buffer whose entry length is 0, which
blocks the Node event loop. The first fixed release is 2.0.3, so there is no fix
on the 0.x or 1.x lines. b-ber's exposure is narrow: image-size only ever reads
images from a project's own `_images/`, so a book's author would have to supply
the crafted file. The fix is cheap, though, and the package is three majors
stale.

This is the "kind 3" path in
[`docs/dependency-update-policy.md`](../docs/dependency-update-policy.md), worked
through by hand because TASK-132's impact report does not exist yet.

### Where it is used

All three call sites are synchronous and pass a file path:

| Call site | What it measures | Coverage before this task |
| --------- | ---------------- | ------------------------- |
| `b-ber-grammar-image/src/index.ts` | `figure` / `figure-inline` images in Markdown, for orientation classes | Jest, **mocked** |
| `b-ber-tasks/src/cover/index.ts` | the cover image, written into `cover.xhtml`'s SVG `viewBox` and `<image>` | none (e2e only) |
| `b-ber-templates/src/figures/helpers.ts` | the poster of an unsupported media fallback (vimeo, mobi iframe) | Jest, **mocked** |

### Breaking changes that matter here

- **v2 dropped the synchronous "pass a path" API.** `sizeOf(path)` no longer
  exists. The choices are `imageSize(Uint8Array)` or the async
  `imageSizeFromFile(path)`.
- The default export became a named `imageSize` export.
- Errors no longer carry the file path.

The rest (ESM/CJS dual build, `Uint8Array` instead of `Buffer`, new formats, no
dependencies) is transparent to us.

### Native replacement: rejected

Node has no built-in way to read image dimensions. A replacement means
hand-written header parsers for JPEG (segment walking, SOF variants), PNG, GIF,
WebP (three sub-formats) and SVG (width/height, units, viewBox). That is exactly
the code this CVE was in, and owning it means owning its bugs. `pureimage`,
already a `b-ber-tasks` dependency, decodes whole images and handles only JPEG
and PNG. image-size 2 has **zero dependencies** (0.8 pulled in `queue`), so
keeping it costs nothing in the tree.

## Changes

- **One helper, one dependency.** `getImageDimensions(filePath)` in
  `b-ber-lib/src/utils` is now the only import of image-size. It reads the whole
  file with `fs.readFileSync` and passes the bytes to `imageSize`. All three call
  sites use it. `image-size` moved from the three consumer packages to
  `b-ber-lib`'s dependencies.
- **Whole-file read, not `imageSizeFromFile`.** Both 0.8's sync API and v2's
  `imageSizeFromFile` read only the first 512KB, so a JPEG whose EXIF, XMP or
  ICC data pushes the frame header past that point fails with "Corrupt JPG,
  exceeded buffer limits". Reading the whole file fixes that, and it keeps the
  call sites synchronous, which the markdown-it render path needs.
- **Errors name the file:** `Could not read image dimensions [<path>]: <cause>`.
- `b-ber-tasks/src/declarations.d.ts`: declares `getImageDimensions` on the
  hand-written `b-ber-lib/utils` module.
- **Root `jest.setup.js`.** It gives jsdom Node's `TextEncoder`/`TextDecoder`
  (see Findings).

## Subtasks

- [x] Inventory call sites and the tests that mock the dependency
- [x] Evaluate a native replacement (rejected, above)
- [x] Baseline: measure a 24-image corpus with 0.8.3; build kitchen-sink `epub`
      and `web` with a listed cover and with a generated cover
- [x] Bump to `^2.0.4` behind `getImageDimensions` in `b-ber-lib`
- [x] Tests on real images, without mocking image-size (see Verification)
- [x] Compare the corpus and kitchen-sink output against the baseline
- [x] `npm test`, typecheck diff against `main`, Playwright `cli` project
- [x] Remove the stray `packages/b-ber-lib/package-lock.json`
- [x] Remove the dead `*.svg` lint-staged rule and `svgo.yml`
- [ ] Merge; confirm Renovate closes #679 as superseded

## Verification

**Corpus** (24 files): every valid image measures identically on 0.8.3 and
2.0.4. That covers JPEG (baseline, progressive, EXIF-rotated, 1200×800), PNG
(plain, interlaced), GIF, WebP, BMP, TIFF, SVG (width/height, viewBox only, `cm`
units, `%` with viewBox) and all the kitchen-sink images including the
1600×2400 cover. Three cases differ: the >512KB-header JPEG (fails on 0.8.3,
measures now), plus an empty file and a non-image, which throw on both versions
with different messages.

**Kitchen-sink**, `epub` and `web`, listed and generated cover: identical to the
baseline once per-build randomness is normalized (cover file hash, metadata IDs,
footnote IDs, timestamps). The only remaining differences were manifest and
search-index **order**, and two builds of the same code differ the same way (see
Findings). Cover `viewBox="0 0 1600 2400"` and the figure orientation classes
are unchanged. Build logs match too: the EPUBCheck errors are the fixture's
existing iframe ones.

**Tests:**

- `b-ber-lib`: `getImageDimensions` against real JPEG, PNG, GIF, WebP and SVG
  fixtures (3×2, under 300 bytes each). One test builds a JPEG with a frame
  header past 512KB at run time; it was confirmed to fail on
  `imageSizeFromFile`. Error cases must name the file.
- `b-ber-templates` epub/mobi: the image-size mock is replaced with real 100×150
  and 10×10 posters. All 119 snapshots pass unchanged. Swapping the two fixtures
  makes a snapshot fail (`--portrait` → `--square`), so they now depend on the
  real dimensions.
- `b-ber-grammar-image`: the suite mocks all of `b-ber-lib`, so the mock moved
  to `getImageDimensions`. A new test checks that its result reaches
  `createFigure`.
- `b-ber-tasks/cover` still has no unit test (its `b-ber-lib/utils` stub is
  empty). The kitchen-sink comparison above covers both cover paths.

**Gates:** `npm test` 131/131 suites. Typecheck: no new errors. Templates and
grammar-image each lose one, because 0.8's default export typed as "not
callable" (why cover had `(sizeOf as any)`). Playwright `cli`: 15 passed, 1
skipped (the conditional skip for an installed external tool). A real build with
a corrupt figure image stops with `Could not read image dimensions
_project/_images/broken.png: unsupported file type: undefined`.

## Findings

- **The root Jest run uses jsdom for every package.** image-size 2 calls
  `new TextDecoder()` when it loads, and jsdom (Jest 29) has no `TextDecoder`,
  so 23 suites that import `b-ber-lib` failed in the root run while passing in
  their own node-environment runs. Production is unaffected: Node and browsers
  both have it. The fix restores Node's implementation in a root setup file. A
  cleaner fix is a Jest `projects` split (node for the build packages, jsdom for
  reader-react), which is a larger change than this task.
- **Builds are not reproducible.** Two builds of identical source produce a
  different OPF manifest order and search-index order (async file walks). Not
  caused by this task. Worth one under EPUB spec compliance if byte-stable
  output matters.
- **Renovate #696 left the lockfile out of step with `package.json`.** It
  raised the `@types/lodash` specifier in `package-lock.json` to `^4.17.27`
  while `packages/b-ber-lib/package.json` still says `^4.17.24`, so every
  `npm install` resyncs it. That resync is left out of this PR. The same
  commit also updated a nested `packages/b-ber-lib/package-lock.json`, a stray
  lockfile in a workspace. **Removed in this PR.** Root `.gitignore` already
  ignores `packages/**/package-lock.json`, but this one was committed before
  the rule and stayed tracked, so release bumps and Renovate kept updating it.
- **The `*.svg` pre-commit hook could never pass.** TASK-127 removed the
  `svgo` devDependency because nothing imported it, but left the lint-staged
  rule that runs the `svgo` CLI and its `svgo.yml`. The repo tracked no SVGs,
  so nothing tripped it until this task's SVG fixtures. `npx` then fetches
  svgo 4, which cannot read a YAML config, so the hook fails. Had it run, it
  would also have rewritten the fixtures it was meant to leave alone. The rule
  and `svgo.yml` are removed in this PR.
- **Mocked dependencies.** Before this task, Jest passed whatever image-size
  returned, exactly as TASK-132 predicted. Now two of the three call sites have
  unmocked coverage.

## Notes

- Renovate PR: #679. Related: TASK-129 (Renovate), TASK-132 (dependency impact
  report; this task is a manual run of its checklist), TASK-130 (e2e).
