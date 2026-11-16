# TASK-156: Upgrade Biome to 2.6 without widening what it checks

**Epic:** Upgrade tooling
**GitHub Issue:** #788 — https://github.com/triplecanopy/b-ber/issues/788
**Scope:** monorepo

## Description

Renovate's Biome PR (#751, 2.4.16 → 2.6.7) fails `build-and-test` with 212
errors and 440 warnings. Little of that is about the code Biome checked
before. Biome 2.6 formats and lints four file types that 2.4 skipped, and
adds one rule that fires on this repo:

| What | Files | Effect |
| ---- | ----- | ------ |
| Markdown | 343 | 109 reformatted, mostly by aligning table columns (every PRD in `tasks/`) |
| SCSS | 30 | 26 reformatted; 53 `noUnknownFunction` errors for Sass functions (`ms()`); a parse error in `b-ber-theme-serif/layout/_list.scss:173` |
| YAML | 12 | 7 reformatted, the workflows among them |
| SVG | 2 | `noSvgWithoutTitle` errors on test fixtures |
| `correctness/noComponentHookFactories` | 10 sites | all in tests, which define small components inside a test |

The config also needs `biome migrate`: the schema version, and
`"recommended": true` becomes `"preset": "recommended"`.

The upgrade keeps Biome's coverage what it was. Adopting the new file types is
left for its own task, if it is wanted: the Markdown table realignment alone
would put noise into every PRD diff.

## Subtasks

- [x] Install `@biomejs/biome@2.6.7` (exact, as for every dev dependency)
- [x] `biome migrate`
- [x] Exclude `*.md`, `*.scss`, `*.yml`, `*.yaml` and `*.svg` in
      `files.includes`; check that Biome then processes the same 672 files as
      2.4.16
- [x] Turn `noComponentHookFactories` off under `**/__tests__/**`
- [x] Apply 2.6's formatting to the three JavaScript files it changes
- [x] `npm test` and `npm run typecheck` pass
- [x] Record the exclusion in the root AGENTS.md

## Findings

- With the exclusions, 2.6.7 processes exactly the 672 files 2.4.16 did
  (compared file by file with `--verbose`), and reports the same diagnostics
  per rule: 0 errors, 237 warnings.
- Excluding by extension is what keeps the set exact. The per-language
  switches do not line up: SCSS is under `css` and SVG under `html`, and 2.4
  already checked one `.css` and two `.html` files.
- 2.6's only change to JavaScript formatting here is the layout of
  `it.each([...])(name, fn)` calls whose arguments do not fit on one line
  (`build.handler.test.js`, `index.test.js` in b-ber-cli, `sass.test.js`).
- The lint-staged entry for `*.{md,scss,yaml,yml}` runs
  `biome format --no-errors-on-unmatched`. It did nothing under 2.4, and does
  nothing now that the files are excluded. It is left as it is.

## Notes

- Supersedes Renovate's #751, which Renovate closes once `main` has 2.6.7.
