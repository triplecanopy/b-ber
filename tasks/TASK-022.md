# TASK-022: Automate circular dependency checks

**Status:** complete
**Feature:** Upgrade tooling
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

- [x] Benchmark `npm run check:circular` runtime on this codebase
- [x] Decide between Option A and Option B (or C/D) and document the choice
      in Notes
- [x] Wire up the chosen approach
- [x] Verify the hook catches a synthetic circular import before removing it
- [x] If Option B: confirm lint-staged workaround for package-level commands

## Notes

### Extension fix (2026-06-19)

The original script scanned `--extensions js,jsx packages/` — useless since
the codebase is now TypeScript. Fixed to:

```
madge --circular --extensions ts,tsx,jsx packages/*/src
```

**Why `packages/*/src` not `packages/`?** Scanning `packages/` includes
`dist/`, `coverage/`, `node_modules/`, and `__tests__/` which produce noise
(stale compiled output, test fixtures). Targeting `packages/*/src` limits
madge to the actual source tree. `jsx` is kept because `b-ber-reader` still
ships `.jsx` files.

**Verification:** Running the corrected command against this repo processes
**362 files** in ~880ms (24 warnings for unresolvable non-TS paths like SCSS
`@use` rules and bare specifiers from b-ber-templates).

### Cycles found (existing, not new)

The corrected script revealed **10 circular dependencies**, all in
`b-ber-reader-react/src/components/Media/Controls/`. Every cycle is an
`import type`-only back-reference from a child component to the parent
`MediaControls.tsx` prop type (`MediaControlsChildProps`). TypeScript erases
`import type` at compile time — these are not runtime circular dependencies.
The tenth "cycle" is a standalone `_print.scss` file madge cannot properly
follow.

Root cause: the shared prop type `MediaControlsChildProps` lives in
`MediaControls.tsx` and is re-exported as a type from there. Moving it to a
dedicated `types.ts` file would eliminate all reported cycles. This is a
follow-up cleanup, not a blocker for the CI gate.

### Decision: Option C (CI only) — **now an enforcing gate**

The check is wired into `.circleci/config.yml` as a step in the `build` job,
placed after lint/unit tests and before the Codecov upload.

**Update (2026-06-19, parent follow-up):** the gate is now **hard** (no
`|| true`). The 9 `import type` cycles were removed by extracting the shared
prop types (`MediaControlsProps` / `MediaControlsChildProps`) out of
`MediaControls.tsx` into a leaf module
`packages/b-ber-reader-react/src/components/Media/Controls/types.ts`; all child
controls now import the type from `./types`, so there is no back-edge to the
parent. The 10th madge entry was a lone `_print.scss` artifact (a `.tsx`
imports SCSS) — handled with `--exclude '\.(s?css)$'` rather than letting a
stylesheet count as a code cycle. `npm run check:circular` now processes 352
files and reports **No circular dependency found** (exit 0); reader-react's 62
suites / 9 snapshots still pass (the type move is behavior-preserving).

Final script: `madge --circular --extensions ts,tsx,jsx --exclude '\.(s?css)$' packages/*/src`.

Pre-commit hook (Options A/B) was not added: the hook infrastructure (husky
v1) is already stretched and the CI layer is the right place for a
monorepo-wide graph check. `npm test` (Option D) was also skipped — it runs
biome + jest, and adding a graph check there would make every local test run
scan all 362 files without any clear benefit over the CI gate.

Related: TASK-016 (initial circular audit), TASK-021 (bootstrap flag audit).
