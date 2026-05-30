# TASK-015: Migrate from ESLint + Prettier to Biome

**Status:** not started
**Scope:** monorepo
**Priority:** low

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

- [ ] Install `@biomejs/biome` at root; add a `biome.json`.
- [ ] Run `npx @biomejs/biome migrate eslint` and `biome migrate prettier`
      to generate an initial `biome.json` from the current `.eslintrc.js`
      and `.prettierrc`.
- [ ] Run `biome check .` and fix or suppress violations not auto-fixed:
  - `camelcase` allow-pattern: apply `// biome-ignore` or equivalent for
    `UNSAFE_*` identifiers (rare in the codebase).
  - `import/extensions: 'never'`: drop the rule — Vite handles this at
    the bundler level.
  - `max-statements-per-line`: drop — no direct Biome equivalent, low value.
- [ ] Update `lint-staged` in root `package.json`:
  - Replace `eslint --ignore-path ... --fix` with `biome check --apply`
  - Replace `prettier --write` with `biome format --write`
- [ ] Delete all per-package `.eslintrc.js` files (all are single-line extends,
      safe to remove once root `biome.json` exists).
- [ ] Remove ESLint + Prettier devDependencies from root `package.json`:
      `babel-eslint`, `eslint`, `eslint-config-airbnb`, `eslint-config-airbnb-base`,
      `eslint-config-prettier`, `eslint-plugin-babel`, `eslint-plugin-import`,
      `eslint-plugin-jsx-a11y`, `eslint-plugin-prettier`, `eslint-plugin-react`,
      `prettier`
      Also remove: `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`
      (Biome handles TS natively, no plugins needed).
- [ ] Remove per-package `.eslintignore` and `.prettierignore` files;
      migrate ignore patterns into `biome.json`'s `files.ignore` array.
- [ ] Update root `AGENTS.md` Quality Gates section to reference `biome check`.
- [ ] Confirm `npm test` passes and `biome check .` exits 0 from repo root.
- [ ] Commit: `chore(monorepo): replace ESLint+Prettier with Biome`

## Notes

- The `airbnb` ruleset has ~80+ rules. Biome covers ~85–90% of the active
  rules; the gaps are concentrated in `import/*` rules that become N/A after
  the Vite migration. See TASK-005 for the full coverage table.
- No ESLint is wired into any webpack config. This migration is purely a
  dev-toolchain change — no effect on bundle output.
- `.editorconfig` files across the monorepo can be deleted after migration;
  Biome's formatter is the canonical source of formatting rules.
- Biome ships as a native binary and does not require Node.js — but it should
  still be installed as a devDependency (`@biomejs/biome`) for consistent
  versioning across team members.
- See TASK-005 for full research findings and sequencing rationale.
