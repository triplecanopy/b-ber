# TASK-151: Bring reader-react under Biome's recommended rules

**Epic:** Reader quality (reader-react)
**GitHub Issue:** #761 — https://github.com/triplecanopy/b-ber/issues/761
**Scope:** reader-react
**Model:** Sonnet for the mechanical rules; Opus for `useExhaustiveDependencies`,
where each site is a judgement about when an effect should run.

## Description

TASK-133 turned on Biome's recommended rules. Every package but
`b-ber-reader-react` now meets them at their default levels. reader-react has
an `overrides` entry in `biome.json` that holds six rules at warn, and 200
diagnostics in all (2026-11-14):

| Rule | Sites | Note |
| ---- | ----- | ---- |
| `suspicious/noExplicitAny` | 100 | DOM and html-to-react node walking, css-tree (#747), legacy props |
| `correctness/useExhaustiveDependencies` | 31 | **Do not bulk-fix.** Adding a dependency changes when an effect runs. See MIGRATION-CONVENTIONS.md §3d. |
| `a11y/noSvgWithoutTitle` | 15 | Icon components. Decide with TASK-104 (#633) whether each is decorative (`aria-hidden`) or needs a title. |
| `style/noNonNullAssertion` | 13 | |
| `complexity/useOptionalChain` | 10 | Same caution as TASK-150 |
| `suspicious/noImplicitAnyLet` | 9 | |
| `suspicious/noAssignInExpressions` | 6 | |
| others | 16 | `useIterableCallbackReturn` 3, `noVoidTypeReturn` 2, `noUnusedVariables` 2, `noConfusingVoidType` 2, and one each of five more |

Done means the reader-react `overrides` entry is gone from `biome.json`.

## Subtasks

- [ ] Read MIGRATION-CONVENTIONS.md first; it governs every change here
- [ ] Mechanical rules first, one commit each, removing each from the override
- [ ] `noSvgWithoutTitle` with TASK-104
- [ ] `noExplicitAny` (100 → 0, or justified at the site)
- [ ] `useExhaustiveDependencies`, site by site, with the reader e2e suite
- [ ] Delete the override

## Notes

- Split from TASK-133 on 2026-11-14. TASK-148 left reader-react's `any`s to
  this epic. Related: TASK-104 (a11y), TASK-150 (the other packages).
