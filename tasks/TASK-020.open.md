# TASK-020: Vite + Biome migration — bundler and toolchain replacement

**Status:** not started
**Scope:** monorepo
**Priority:** medium

## Description

Replace webpack with Vite in both reader packages and replace ESLint + Prettier
with Biome across the entire monorepo. All three sub-tasks share a branch and a
natural sequencing: Vite goes in first (changes the parser), Biome follows (drops
`babel-eslint` which is no longer needed once Vite's own parser is in place).

This is the canonical tracking document for this work stream. TASK-006,
TASK-007, and TASK-015 are the units of execution.

## Sub-tasks

- [ ] **TASK-006** — Migrate `b-ber-reader-react` from webpack to Vite.
      Also picks up the CSS Modules migration (reader-react TASK-017) in the
      same pass.
- [ ] **TASK-007** — Migrate `b-ber-reader` to Vite and clean up the root
      `babel.config.js`. **Blocked on TASK-006.**
- [ ] **TASK-015** — Replace ESLint + Prettier with Biome across the monorepo.
      Remove `prettier` devDependency; update all npm scripts, lint-staged hook,
      and per-package `.eslintrc.js` files. **Sequenced after TASK-006** — the
      natural seam is when `babel-eslint` is dropped in favour of Vite's parser.
- [ ] Merge `feat/vite-migration` → `feat/upgrades`

## Branch

`feat/vite-migration` — all three sub-tasks work on this branch. Keep each
commit focused; do not batch unrelated changes.

## Sequencing

```
TASK-006  reader-react webpack → Vite
    │
    ▼
TASK-007  reader webpack → Vite + babel.config.js cleanup
    │
    ▼
TASK-015  ESLint + Prettier → Biome
          (babel-eslint dropped here; Biome's own parser replaces it)
```

## Completion criteria

- `npm test` passes from repo root
- `biome check .` exits 0
- No webpack or `babel-eslint` references remain in any package
- `prettier` devDependency removed; `.prettierrc` and `.prettierignore` deleted

## Related tasks

| Task     | Role                                                                             |
| -------- | -------------------------------------------------------------------------------- |
| TASK-001 | Webpack replacement research — established Vite as the choice (complete, closed) |
| TASK-005 | Biome migration research — established Option B approach (complete, closed)      |
| TASK-006 | reader-react webpack → Vite                                                      |
| TASK-007 | reader webpack → Vite                                                            |
| TASK-015 | ESLint + Prettier → Biome                                                        |
| TASK-019 | TS migration — Stage 4 (reader-react TS) is blocked until this lands             |
