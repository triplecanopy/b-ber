# TASK-022: Automate circular dependency checks

**Status:** not started
**Scope:** monorepo
**Priority:** low
**GitHub Issue:** #482 — https://github.com/triplecanopy/b-ber/issues/482

## Description

Circular imports were audited and resolved in TASK-016, but there is no
mechanism to prevent new ones from being introduced. The `check:circular`
script (`madge --circular --extensions js,jsx packages/`) exists but is not
wired into any automated gate.

This task is to decide where that check belongs and wire it up.

## Options to evaluate

### Option A — pre-commit hook

Run `npm run check:circular` in the pre-commit hook (via husky + lint-staged
or a standalone husky hook). Runs on every commit regardless of what changed,
which is fast enough given madge's runtime (~1–2 s on this codebase).

**Pro:** catches the problem at the earliest possible moment, before it lands.
**Con:** runs even on docs-only commits; husky v1 (current) uses a different
hook format than v4+, so wiring it up requires care.

### Option B — conditional hook, triggered by package.json or src/ changes

Use a husky pre-commit hook that only runs `check:circular` when JS source
files or `package.json` files are staged. Could be done with a shell guard in
the hook script (`git diff --cached --name-only | grep -q '\.js\|package.json'`)
or by adding an entry to lint-staged.

**Pro:** avoids the false-positive cost on docs/config-only commits.
**Con:** slightly more complex to maintain; lint-staged runs per-file, so a
package-level command (`madge … packages/`) needs a workaround (e.g., a
lint-staged `*` glob with a script that ignores the file list and runs madge).

### Option C — CI only, not a local hook

Add `npm run check:circular` as a step in the CI pipeline. Does not slow down
local commits at all; catches regressions before merge.

**Pro:** zero local overhead; the right layer for monorepo-wide checks.
**Con:** feedback is slower (minutes vs. seconds); requires CI to be set up and
green (see TASK-014 for issue tracking).

### Option D — add to `npm test`

Append `&& npm run check:circular` to the `test` script so it runs with every
`npm test` call. Simplest mechanical change.

**Pro:** no hook infrastructure needed; runs in the existing test gate.
**Con:** `npm test` is already in the pre-commit hook via `check:code`, so this
would run on every commit anyway — same cost as Option A, less transparent.

## Recommended starting point

Option B (conditional lint-staged hook) is the most precise, but Option A
(unconditional pre-commit hook) is simpler to implement and fast enough to
not be annoying. Decide based on how noisy the hook turns out to be in
practice. Option C (CI) should be added regardless as a second layer once
CI is stable.

## Subtasks

- [ ] Benchmark `npm run check:circular` runtime on this codebase
- [ ] Decide between Option A and Option B (or C/D) and document the choice
      in Notes
- [ ] Wire up the chosen approach
- [ ] Verify the hook catches a synthetic circular import before removing it
- [ ] If Option B: confirm lint-staged workaround for package-level commands

## Notes

The circular import check uses `madge --circular --extensions js,jsx packages/`. It does not scan TypeScript files yet. Once the TS migration
begins (TASK-008+), the extensions list will need to expand to include `.ts`
and `.tsx`.

Related: TASK-016 (initial circular audit), TASK-021 (bootstrap flag audit).
