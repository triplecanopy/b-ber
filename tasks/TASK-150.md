# TASK-150: Clear the remaining Biome warnings outside reader-react

**Epic:** Upgrade tooling
**GitHub Issue:** #760 — https://github.com/triplecanopy/b-ber/issues/760
**Scope:** monorepo

## Description

TASK-133 turned on Biome's recommended rules and restored every error-level
rule outside `b-ber-reader-react`. It left 48 warning-level diagnostics in the
other packages. Each needs a look at the site, because the automatic fix can
change behaviour.

| Rule | Sites | Why not bulk-fix |
| ---- | ----- | ---------------- |
| `complexity/useOptionalChain` | 19 | `a && a.b` returns `a` when `a` is `''`, `0` or `false`; `a?.b` returns `undefined`. Safe only where `a` is an object or nullish. |
| `style/noNonNullAssertion` | 15 | Each `!` is a claim that a value is present. Prove it with a narrowing, or keep it with a `biome-ignore` that says why. |
| `correctness/noUnusedVariables` | 5 | Some are destructured to omit a key from a rest spread, which is a use. |
| `suspicious/useIterableCallbackReturn` | 4 | `forEach` callbacks that return a value, or `map` callbacks that do not. |
| `suspicious/noConfusingVoidType` | 3 | `void` in a union; usually `undefined` was meant. |
| `correctness/noConstructorReturn` | 2 | `Config` and the reader task return a value from a constructor on purpose; changing that changes what `new` gives callers. |

Measure with `npx biome lint --max-diagnostics=none --reporter=github . | grep -v b-ber-reader-react`.

## Subtasks

- [ ] One commit per rule, each site reviewed; run the full suite and e2e
- [ ] Re-check whether the explicit rules `biome migrate eslint` generated in
      TASK-015 are still needed now that `recommended` is on, and drop the ones
      that only restate a recommended default (carried over from TASK-133)

## Notes

- Split from TASK-133 on 2026-11-14. Related: TASK-151 (the same work in
  reader-react).
- The pre-commit hook runs `biome check --write` on staged files, which applies
  every safe fix in them. A commit meant to hold one rule's fixes needs the gates
  run by hand and `--no-verify`, as TASK-133 did.
