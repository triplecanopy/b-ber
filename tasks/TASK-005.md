# TASK-005: Research replacing ESLint + Prettier with Biome

**Status:** complete
**Feature:** Upgrade tooling
**Scope:** monorepo
**Priority:** low
**GitHub Issue:** #459 — https://github.com/triplecanopy/b-ber/issues/459

## Description

The monorepo currently uses ESLint for linting and Prettier for formatting.
Biome is a single Rust-based tool that replaces both with dramatically faster
execution, zero configuration drift between the two tools, and a unified CLI.
This task researches whether the migration is feasible and produces a plan,
with particular attention to how the webpack replacement (TASK-001) and the
JS→TS migration (TASK-002) affect the sequencing.

## Research Findings (2026-05-30)

### Current Configuration Inventory

**One root config, all packages extend it.** The only non-root config is
`packages/b-ber-reader-react/.eslintrc.js` — which just does
`extends: '../../.eslintrc.js'`. All other package-level `.eslintrc.js` files
do the same. There are no divergent configs.

**Root `.eslintrc.js` summary:**

- Parser: `babel-eslint`
- Extends: `airbnb`, `prettier`, `prettier/react`, `prettier/standard`
- Plugins: `babel`, `import`, `react`, `prettier`
- Notable custom rules (non-zero, non-standard):
  - `camelcase: [2, { allow: ['^UNSAFE_'] }]` — allows `UNSAFE_*` identifiers
  - `import/extensions: [2, 'never']` — forbids file extensions on imports
  - `jsx-a11y/label-has-for` — custom `required: { some: ['nesting', 'id'] }`
  - `max-statements-per-line: [2, { max: 2 }]`
  - `no-plusplus: [2, { allowForLoopAfterthoughts: true }]`
  - Many rules explicitly set to 0 (disabled), especially React rules

**Root `.prettierrc`:**

```json
{
  "tabWidth": 2,
  "useTabs": false,
  "singleQuote": true,
  "semi": false,
  "trailingComma": "es5",
  "printWidth": 80
}
```

**`.prettierignore`:** Lists compiled output directories (dist, demo, node_modules)
plus compiled package root JS files (b-ber-lib, b-ber-templates, etc.).

**No ESLint in webpack.** The only webpack config (`b-ber-reader/webpack.config.js`)
has no ESLint integration — ESLint runs as a standalone pre-commit hook only.

**`@typescript-eslint` already installed** in root devDependencies:
`@typescript-eslint/eslint-plugin@^4.8.1` and `@typescript-eslint/parser@^4.8.1`.
These are in devDependencies but not yet referenced in any config.

**No CI pipeline.** No `.github/workflows`, `.travis.yml`, or equivalent found.
ESLint and Prettier only run via the `lint-staged` pre-commit hook:

```
eslint --ignore-path .gitignore --ignore-path .prettierignore --fix
prettier --write
```

### Biome Coverage Assessment

| Current rule / plugin                                    | Biome equivalent     | Notes                                                  |
| -------------------------------------------------------- | -------------------- | ------------------------------------------------------ |
| Prettier formatting                                      | `biome format`       | All 6 Prettier options have Biome equivalents          |
| `no-*` rules (unused-vars, console, return-assign, etc.) | Yes                  | Well-covered                                           |
| `no-plusplus` with `allowForLoopAfterthoughts`           | Partial              | Biome has the rule but may not support the option      |
| `camelcase` with `allow` regex                           | Partial              | Biome camelCase rule exists; `allow` patterns differ   |
| `import/extensions: 'never'`                             | Not needed post-Vite | Vite (TASK-006) resolves this at the bundler level     |
| `import/order`, `import/no-extraneous-dependencies`      | Partial              | Biome has import sorting; no-extraneous not supported  |
| `jsx-a11y/label-has-for` with custom config              | Partial              | Biome has a11y rules but config syntax differs         |
| `max-statements-per-line`                                | No direct equivalent | Low-value rule; could be dropped                       |
| `eslint-plugin-babel`                                    | Not needed           | Biome has its own parser; babel-specific rules are N/A |
| `eslint-plugin-react`                                    | Yes                  | Biome has react-specific rules                         |
| `@typescript-eslint`                                     | Built in             | Biome's TS linting is native, no plugin needed         |

**Summary:** Formatting (Prettier → Biome) is a near-perfect 1:1 swap. Linting
coverage is ~85–90% of the effective active rules. The gaps are concentrated in
`import/*` rules and fine-grained `airbnb` customizations that are already
disabled or would be N/A after the Vite migration.

### Sequencing Options

**Option A: Migrate now (before TASK-001 and TASK-002)**

- Pro: Unblocks faster pre-commit hooks immediately.
- Con: The airbnb config migration needs to be done twice in effect — once now
  and again (conceptually) when TS rules replace babel rules in TASK-002.

**Option B: Migrate with the bundler switch (TASK-001/006)**

- Pro: Natural seam — new bundler config never gets ESLint wired in; old
  `babel-eslint` parser is dropped at the same time as the Babel build.
- Con: Slightly more scope in the Vite migration task.

**Option C: Migrate after TASK-002 Stage 1 (after shapes + logger + lib are TS)**

- Pro: Biome's TS-aware rules run on typed code from day one; the
  `@typescript-eslint` packages (already installed) get removed cleanly.
- Con: Delay of 3–6 months if TS migration is slow.

### Recommendation: **Option B** (with the Vite migration, TASK-006/007)

Rationale:

1. No ESLint is wired into any webpack config, so there is no existing
   entanglement that forces coupling with the bundler migration.
2. The `babel-eslint` parser can be dropped at exactly the same point Babel
   is dropped from the build pipeline (TASK-006/007). Keeping them together
   avoids an intermediate state where `babel-eslint` is gone but the ESLint
   config still expects a Babel-aware parser.
3. The timing is natural: TASK-006/007 are tracked, not yet started, and adding
   "replace ESLint+Prettier with Biome" to the Vite migration branch is low
   overhead since the branch is already touching the dev toolchain.
4. Even if Option C is chosen for timing reasons (TS migration takes priority),
   Option B remains valid: do the Biome migration on the `feat/vite-migration`
   branch and merge it after the Vite work is stable but before the TS work lands.

### Estimated Migration Effort

1. Install `@biomejs/biome` at the root; remove ESLint + Prettier devDependencies.
2. Run `npx @biomejs/biome migrate eslint` and `biome migrate prettier` to
   generate an initial `biome.json` from existing configs.
3. Run `biome check .` and review unfixed violations:
   - The `camelcase` `allow` pattern will need a Biome equivalent or rule disable.
   - The `import/extensions: 'never'` rule can be dropped (handled at bundler level).
   - The `max-statements-per-line` rule should be dropped (no equivalent; low value).
4. Update `.husky/pre-commit` / `lint-staged` to use `biome check --apply` instead
   of ESLint + Prettier.
5. Remove per-package `.eslintrc.js` files (all identical extends) and
   `.editorconfig` files (superseded by `biome.json`).
6. Update the root `AGENTS.md` Quality Gates section.

**Estimated total effort:** 1–2 days including violation cleanup on existing code.
The violation count will be low because most active rules have Biome equivalents
and the code already conforms to the Prettier/ESLint style.

## Subtasks

- [x] Audit current ESLint and Prettier configuration
- [x] Evaluate Biome's coverage of the current rule set
- [x] Assess compatibility with the current build tooling (no webpack/ESLint)
- [x] Decide sequencing relative to TASK-001 and TASK-002
- [x] Check CI pipeline (none found)
- [x] Estimate migration effort
- [x] Write a recommendation
- [x] Open an implementation task scoped to `feat/vite-migration` branch (TASK-015)

## Notes

- ESLint is **not** integrated into any webpack config. Migration is entirely
  a dev-toolchain change with no effect on bundle output.
- All package-level `.eslintrc.js` files are single-line extends. Deleting
  them all is safe once a root `biome.json` exists.
- The `@typescript-eslint` packages already installed are a wasted dependency
  today; they get removed cleanly in a Biome migration.
- No CI pipeline to update — only the `lint-staged` pre-commit hook.
- `biome migrate` automates the majority of the translation; manual review
  focuses on the ~5 rules without direct Biome equivalents.
