# TASK-015: Migrate from ESLint + Prettier to Biome

**Status:** complete
**Feature:** Upgrade tooling
**Scope:** monorepo
**Priority:** low
**GitHub Issue:** #476 — https://github.com/triplecanopy/b-ber/issues/476

## Description

Replace the ESLint + Prettier dev toolchain with Biome, a single Rust-based
tool that handles both linting and formatting. Findings from TASK-005 establish
that this is safe and low-effort.

**Sequencing:** Do this on the `feat/vite-migration` branch alongside TASK-006
and TASK-007. The natural seam is when `babel-eslint` is dropped in favour of
Vite's native parsing — Biome's own parser replaces it cleanly at the same step.

## Branch

`feat/vite-migration`

## Subtasks

### Install and configure Biome

- [x] Install `@biomejs/biome` at root; add a `biome.json`.
- [x] Run `biome init`, `biome migrate prettier`, and `biome migrate eslint` to
      generate an initial `biome.json` from the current `.eslintrc.js`
      and `.prettierrc`. Biome 2.4.16 was installed.
- [x] Set `files.includes` in `biome.json` to globally exclude from both linting
      and formatting: all patterns from `.prettierignore` (generated files,
      dist dirs, highlight.js vendor dir), legacy web scripts
      (`packages/b-ber-tasks/src/web/**`), and `scripts/**`.
- [x] Add Jest globals (`expect`, `jest`, `it`, `test`, `describe`, etc.) to
      `javascript.globals`.
- [x] Downgrade rules that were never enforced (ESLint check was echoing "todo")
      to "warn": `noVar`, `noUnusedVariables`, `noParameterAssign`,
      `noEmptyBlockStatements` → off (valid mock stubs), `noCommaOperator` → warn,
      accessibility a11y rules that fire in legacy JSX → warn.
- [x] Run `biome check .` — exits 0 with 37 warnings, 0 errors.

### Remove Prettier

Biome handles JS/TS/JSON/CSS formatting. Prettier was also formatting SCSS,
YAML, and Markdown (via `prettier "**/*.{md,scss,yaml,yml}"`). Biome does not
support SCSS or YAML. Decision: drop automated CI formatting for those file
types — let editors handle them. `.editorconfig` stays as the editor hint
(GitHub uses it for its web editor; it is not redundant with biome.json).

- [x] Deleted `.prettierrc`
- [x] Deleted root `.prettierignore` — patterns migrated into `biome.json`
      `files.includes` exclusion array.
- [x] Deleted `packages/b-ber-reader-react/.prettierignore`
- [x] Deleted `packages/b-ber-reader-react/.eslintignore`
- [x] Removed `prettier`, `eslint-config-prettier`, `eslint-plugin-prettier`
      from root `package.json` devDependencies.
- [x] Removed ESLint devDependencies from `packages/b-ber-reader-react/package.json`.
- [x] Removed ESLint devDependencies from `packages/b-ber-validator/package.json`;
      updated `lint` script from `eslint ... --fix` to `biome check src/`.
- [x] Updated npm scripts in root `package.json`:
      - Removed `prettier`, `check:code`, `check:other`, `format:code`,
        `format:other`, `npm-run-all` dependency.
      - `check` → `biome check .`
      - `format` → `biome check --write .`

### Update lint-staged

- [x] Updated `lint-staged` in root `package.json`:
      - `*.{js,jsx,ts,tsx,json}` → `biome check --write --no-errors-on-unmatched`
      - `*.{md,scss,yaml,yml}` → `biome format --write --no-errors-on-unmatched`
      - `*.svg` → unchanged (svgo)
      - `git add` preserved in each entry (lint-staged v9 requires explicit re-stage)
- [x] Husky v1 pre-commit hook unchanged — configured via `"husky"` key in
      root `package.json`; `.git/hooks/pre-commit` delegates to lint-staged.

### Remove ESLint

- [x] Deleted all 35 per-package `.eslintrc.js` files.
- [x] Removed ESLint devDependencies from root `package.json`:
      `eslint`, `eslint-config-airbnb`, `eslint-config-airbnb-base`,
      `eslint-config-prettier`, `eslint-plugin-import`,
      `eslint-plugin-jsx-a11y`, `eslint-plugin-prettier`, `eslint-plugin-react`,
      `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`.
      Also removed `npm-run-all` (no longer used).
- [x] Deleted root `.eslintrc.js`.

### Source fixes

- [x] `packages/b-ber-logger/src/index.ts`: `isNaN` → `Number.isNaN`.
- [x] `packages/b-ber-reader-react/src/helpers/Url.js`: added
      `// biome-ignore lint/suspicious/noShadowRestrictedNames` for window
      destructuring of `decodeURI`, `encodeURI`, `encodeURIComponent`.
- [x] `packages/b-ber-reader-react/src/models/ViewerSettings.js`: added
      `// biome-ignore lint/suspicious/noShadowRestrictedNames` for local
      `valueOf` utility function.
- [x] `scripts/**` added to `files.includes` exclusion (top-level `return`
      statements in `scripts/run-ci.js` are valid CommonJS script idiom).

### Finish up

- [x] Updated root `AGENTS.md` Quality Gates section to reference `biome check`.
- [x] `biome check .` exits 0 (37 warnings, 0 errors).
- [x] Test suite: 44 suites pass, 40 fail due to pre-existing missing-module
      errors (`image-size`, `handlebars`, etc.) that exist on both the base
      branch and this branch — these are not regressions.
- [x] Committed: `chore(monorepo): replace ESLint+Prettier with Biome`

## Notes

- Biome 2.4.16 installed. `biome migrate prettier` and `biome migrate eslint`
  both ran successfully.
- ESLint had `check:code` set to `echo "todo"` — it had not been running. As a
  result ~240 pre-existing violations existed. The migration downgraded
  the noisiest rule categories to "warn" rather than fixing all of them, to
  keep the diff focused on toolchain plumbing.
- The `airbnb` ruleset has ~80+ rules. Biome covers ~85–90% of the active
  rules; the gaps are concentrated in `import/*` rules that become N/A after
  the Vite migration. See TASK-005 for the full coverage table.
- No ESLint is wired into any Vite config. This migration is purely a
  dev-toolchain change — no effect on bundle output.
- `.editorconfig` is intentionally kept: GitHub's web editor reads it, and it
  covers SCSS/YAML/Markdown indentation that Biome does not format. It is not
  redundant with `biome.json`.
- Husky v1 is configured via the `"husky"` key in root `package.json`. The
  `.git/hooks/pre-commit` file is a husky-generated script; no changes needed
  to the hook file itself — updating `lint-staged` config in `package.json` is
  sufficient.
- `lint-staged` is v9, which requires an explicit `git add` step after any
  tool that modifies files in place. `git add` preserved in each entry.
- `packages/b-ber-tasks/src/web/**` excluded from linting: these are legacy
  ES5 browser scripts (worker.js, search.js, navigation.js, event-handlers.js)
  that have never been linted and use patterns incompatible with Biome's rules.
- See TASK-005 for full research findings and sequencing rationale.
