# TASK-133: Adopt Biome's recommended rules

**Epic:** Upgrade tooling
**GitHub Issue:** #686 — https://github.com/triplecanopy/b-ber/issues/686
**Scope:** monorepo

## Description

`biome.json` sets `"linter": { "rules": { "recommended": false } }`. **Nobody chose
this.** It is what `biome migrate eslint` produced in TASK-015 (commit `9368fa84`,
2026-06-03). The migration rebuilds the ESLint config (airbnb, which is a
JavaScript ruleset) as an explicit Biome rule list and switches Biome's own
recommended set off, so the result enforces what ESLint did. And ESLint had not
really been enforcing anything: its `check:code` script was `echo "todo"`. So the
repo is linted against a translated JavaScript-only ruleset, with none of Biome's
TypeScript or React rules. `noExplicitAny` is the one TASK-119 tripped over.

No task planned to revisit this. TASK-015's notes call the downgrades a way "to
keep the diff focused on toolchain plumbing".

### What turning the recommended set on reports (measured 2026-11-01, `main` @ `ee8af41c`)

**813 diagnostics across 261 files: 104 errors, 620 warnings, 89 info.** With
104 errors, `npm test` would fail, so this cannot be a one-line flip.

| Rule | Count | Level | Notes |
| ---- | ----- | ----- | ----- |
| `suspicious/noExplicitAny` | 378 | warn | Enabled on its own by TASK-119 (option A). Overlaps with that task. |
| `correctness/noUnusedImports` | 83 | warn | Safe auto-fix |
| `style/useNodejsImportProtocol` | 80 | info | Safe auto-fix (`fs` → `node:fs`) |
| `suspicious/noImplicitAnyLet` | 45 | **error** | Overlaps TASK-119/134: untyped `let` |
| `style/useImportType` | 36 | warn | Safe auto-fix |
| `correctness/useExhaustiveDependencies` | 31 | **error** | React effect dependencies. **Do not bulk-fix**: adding a dependency changes when an effect runs. See MIGRATION-CONVENTIONS.md §3d. |
| `complexity/useOptionalChain` | 29 | warn | |
| `complexity/noStaticOnlyClass` | 28 | warn | Design-level; may be intended |
| `style/noNonNullAssertion` | 26 | warn | |
| `a11y/noSvgWithoutTitle` | 15 | **error** | Reader UI icons |
| `suspicious/noAssignInExpressions` | 11 | **error** | |
| others | ~51 | mixed | |

## Approach

Staged, as with TASK-119:

1. **Turn it on without breaking anything.** Set `recommended: true` and add an
   explicit `"warn"` override for every rule that reports at error level today.
   `npm test` stays green, and all of it becomes visible.
2. **Apply the safe auto-fixes as one mechanical commit.** `noUnusedImports`,
   `useNodejsImportProtocol`, `useImportType`: `biome check --write`, then review
   the diff and run the full test suite and e2e. Keep it separate from everything
   else so it is easy to review or revert.
3. **Rule by rule.** Fix each remaining rule, then delete its `"warn"` override so
   it goes back to error. Each rule is its own commit.
4. **Route the judgement calls** rather than bulk-fixing them:
   - `useExhaustiveDependencies` goes to the React 19 (reader-react) tasks.
   - `noExplicitAny` and `noImplicitAnyLet` go to TASK-119/TASK-134.
   - `noStaticOnlyClass` needs a decision first (disable it, or refactor).

## Subtasks

- [x] Step 1: `recommended: true` with error-level rules overridden to `"warn"`
- [x] Step 2: safe auto-fixes in one commit; tests + e2e green
- [x] Step 3: per-rule fixes, each restoring the rule to its default level
      (outside reader-react; the warning-level rest → TASK-150)
- [x] Decide `noStaticOnlyClass` (disable vs refactor) and record why
- [x] Hand `useExhaustiveDependencies` to the Reader quality epic with the 31
      sites (TASK-151; the React 19 epic is closed)
- [ ] → TASK-150: Re-check whether the explicit rules `biome migrate eslint`
      generated are still needed once `recommended` is on; drop the redundant
      ones

## Notes

- **Sequence after TASK-119's pass 1.** TASK-119 turns on `noExplicitAny` by
  itself and adds marked `any`s; doing this first would mean resolving the same
  `any`s under two tasks.
- TASK-015 left `packages/b-ber-tasks/src/web/**` (legacy ES5 browser scripts)
  and `scripts/**` out of linting. Keep those exclusions, but note them here
  rather than letting them be forgotten.
- Related: TASK-015 (the migration), TASK-005 (ESLint → Biome rule coverage),
  TASK-119 (typecheck), TASK-134 (refactor-ready types).

## Result (2026-11-14)

`recommended` is on. Every error-level rule is at its default level outside
`b-ber-reader-react`, and `noExplicitAny` is an error there too, which holds
TASK-148's 0. `npm test`, `npm run typecheck` and e2e are green.

| | Before (2026-11-01) | After |
| - | ------------------- | ----- |
| Diagnostics with `recommended` on | 813 (104 errors) | **246 (0 errors)** |
| Outside reader-react | | 48 warnings → TASK-150 |
| In reader-react | | 200, behind an `overrides` entry → TASK-151 |

What it took:

- **JSX runtime.** Removing unused imports dropped `import React` from 64
  reader-react files. `@vitejs/plugin-react` already builds with the automatic
  runtime, but `tsc` (`"jsx": "react"`) and both swc jest transforms used the
  classic one. All three now use the automatic runtime, matching the build.
- **Step 2 is imports only.** `biome check --write .` would also have applied
  every other safe fix, including `noThisInStatic` rewriting `this` to the class
  name in a reader-react static method, which changes behaviour for a subclass.
  So step 2 ran `biome lint --write --only=` the three rules, then formatting
  and import order with the linter off.
- **Error-level rules.** 36 untyped `let`s typed, five assignments moved out of
  expressions (the epigraph `exec` loop now advances at the end of its body),
  and one deliberate `then` override in a CLI test kept with a
  `biome-ignore` saying why.
- **`noStaticOnlyClass` is off.** The 19 classes it flagged are namespaces of
  static methods (`Xhtml.body()`, `Url`, `YamlAdaptor`, …), several of them
  published API. Converting them would change every caller and the packages'
  import shapes for no change in behaviour.
- **Commits that hold one rule use `--no-verify`.** The pre-commit hook runs
  `biome check --write` on staged files, applying every safe fix in them. The
  gates were run by hand for each.
