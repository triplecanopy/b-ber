# TASK-005: Research replacing ESLint + Prettier with Biome

**Status:** not started
**Scope:** monorepo
**Priority:** low

## Description

The monorepo currently uses ESLint for linting and Prettier for formatting.
Biome is a single Rust-based tool that replaces both with dramatically faster
execution, zero configuration drift between the two tools, and a unified CLI.
This task researches whether the migration is feasible and produces a plan,
with particular attention to how the webpack replacement (TASK-001) and the
JS→TS migration (TASK-002) affect the sequencing.

## Subtasks

- [ ] Audit current ESLint and Prettier configuration:
  - Enumerate all `.eslintrc.*`, `.eslintignore`, `.prettierrc.*`, and
    `.prettierignore` files across the monorepo.
  - Note any custom rules, plugins (`eslint-plugin-react`, etc.), or
    overrides that are non-standard.
  - Note any editor integrations (VS Code settings, `.editorconfig`) that
    depend on Prettier directly.
- [ ] Evaluate Biome's coverage of the current rule set:
  - Run `biome migrate eslint` and `biome migrate prettier` against the
    existing config to see what translates automatically.
  - Document rules that have no Biome equivalent and assess their importance.
  - Check Biome's TypeScript support — relevant for TASK-002.
- [ ] Assess compatibility with the current and future build tooling:
  - Does the existing webpack config invoke ESLint as a plugin
    (`eslint-webpack-plugin`)? If yes, removing ESLint requires updating
    webpack config or removing the plugin.
  - If TASK-001 is completed first (new bundler), the new bundler almost
    certainly does not have an ESLint plugin integrated — making this a
    cleaner cut point to switch to Biome.
  - Biome has a Vite plugin (`@biomejs/vite-plugin`) and works with Rsbuild
    via standalone CLI; document which approach fits each candidate bundler.
- [ ] Decide sequencing relative to TASK-001 and TASK-002:
  - Option A: Migrate to Biome before the bundler switch.
    Isolates the linting change; but if ESLint is wired into webpack config,
    requires an extra webpack config edit that will be thrown away in TASK-001.
  - Option B: Migrate to Biome as part of the bundler switch (TASK-001).
    Natural seam — the new bundler config starts fresh, so ESLint is never
    wired in.
  - Option C: Migrate to Biome after both TASK-001 and TASK-002 are complete.
    Lowest risk: by then the codebase is TypeScript and the bundler is new;
    Biome's TS-aware rules provide full value.
  - Write a recommendation with reasoning.
- [ ] Check CI pipeline for ESLint/Prettier steps that would need updating.
- [ ] Estimate migration effort: number of lint violations that would need
      fixing post-migration, and whether `biome check --apply` handles them.
- [ ] Write a recommendation and, if proceeding, a step-by-step migration plan.
- [ ] Open an implementation task if the recommendation is to proceed.

## Notes

- This is a research task only. Do not install Biome or remove ESLint/Prettier.
- Biome v2 (released 2025) stabilized its plugin API and improved rule parity
  with ESLint significantly. Check the current rule coverage table before
  concluding that a custom ESLint rule has no equivalent.
- The most likely sequencing recommendation is Option B or C: wait for the
  bundler migration (TASK-001) so there is no webpack/ESLint plugin entanglement
  to clean up separately.
- If the JS→TS migration (TASK-002) begins before this task is resolved, ensure
  any new `.ts` / `.tsx` files conform to the existing ESLint + Prettier config
  so the eventual Biome migration starts from a consistent baseline.
- Biome does not require Node.js — it ships as a native binary. This can
  simplify CI setup but may require updating CI Docker images or install scripts.
