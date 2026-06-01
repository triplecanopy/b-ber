# TASK-026: Convert b-ber-parser-\* packages to TypeScript

**Status:** not started
**Scope:** monorepo
**Priority:** medium

## Description

Convert all 5 `b-ber-parser-*` packages from JavaScript to TypeScript. Parser
packages are markdown-it plugins that handle specific content types; each is
1–2 source files. They are independent of grammar packages and can be converted
in parallel with TASK-025.

**Packages (5):**

- `b-ber-parser-dialogue` (1 file)
- `b-ber-parser-figure` (1 file)
- `b-ber-parser-footnotes` (2 files: index.ts was already converted to ESM
  in TASK-019; verify it is still `.js` or already `.ts` before starting)
- `b-ber-parser-gallery` (1 file)
- `b-ber-parser-section` (1 file)

## Subtasks

- [ ] Confirm current state of `b-ber-parser-footnotes/src` (was converted to
      ESM in TASK-019 pre-migration cleanup — check whether it is `.js` or `.ts`)
- [ ] Add `@types/markdown-it` as dev dep to each parser package
- [ ] Convert all 5 packages: rename `.js` → `.ts`, add type annotations
- [ ] Add tsdown build + update `package.json` `main`/`types` fields for each
- [ ] Run `npm test` from root; verify grammar and markdown-renderer tests pass
- [ ] Update TASK-024 subtask checklist

## Notes

Branch: `feat/ts-stage-2`

Per-package tsconfig pattern:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "./dist", "rootDir": "./src" },
  "include": ["src/**/*.ts"]
}
```

Parser packages are imported by grammar packages (`b-ber-grammar-section`
imports `b-ber-parser-section`, `b-ber-grammar-audio-video` imports
`b-ber-parser-figure`, etc.). If grammars are converted first (TASK-025),
the parser types will need to be in place for grammar packages to see them.
If running in parallel, coordinate which is done first.

`b-ber-parser-footnotes` was converted from CommonJS to ESM in TASK-019.
Verify the actual file extension before renaming.

Parent: [[TASK-024]]
