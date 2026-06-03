# TASK-027: Convert b-ber-templates to TypeScript

**Status:** complete
**Scope:** b-ber-templates
**Priority:** medium
**GitHub Issue:** #502 — https://github.com/triplecanopy/b-ber/issues/502

## Description

Convert `b-ber-templates` from JavaScript to TypeScript. This package
generates EPUB container, manifest (OPF), NCX, and XHTML page-template files
using Handlebars templates and plain string interpolation. It has 27 source
files (1352 LOC total) organized by output format.

Unlike the grammar/parser packages, `b-ber-templates` does not depend on
`markdown-it`, so it can be converted independently at any point during
Stage 2.

**Source structure:**

```
src/
  figures/helpers.ts    (284 LOC — largest file)
  Ncx/                  NCX table-of-contents templates
  Opf/                  OPF manifest + metadata templates
  Ops/                  EPUB OPS container templates
  Project/              Project scaffold templates (metadata.yml, config.yml)
  Toc/                  EPUB navigation document templates
  Xhtml/                XHTML page wrapper templates
  Xml/                  XML output templates
  index.ts              Re-exports
```

## Subtasks

- [x] Audit `@types/*` needs: `fs-extra`, `lodash`, `mime-types`,
      `image-size`, `vinyl` (most should already be installed from TASK-012)
- [x] Rename all `.js` → `.ts` and add type annotations
- [x] Type the Handlebars template helpers in `figures/helpers.ts` — return
      types for HTML string builders are straightforward; focus on the helpers
      that interact with `State` (imported from `b-ber-lib`)
- [x] Add tsdown build + update `package.json` `main`/`types` fields
- [x] Run `npm test` in this package; run `npm test` from root for regressions
- [x] Update TASK-024 subtask checklist

## Notes

Branch: `feat/ts-stage-2`

All 27 `.js` source files renamed to `.ts`. All `b-ber-lib` subpath imports
(`/State`, `/YamlAdaptor`, `/ManifestItemProperties`, `/utils`, `/Html`)
converted to named imports from the main package. Dynamic `require()` calls in
`src/Project/index.ts` converted to static `import` statements. Template
literal files in `src/Project/` converted from `module.exports =` to
`export default`. `src/Opf/index.ts` uses named re-exports; `src/index.ts`
uses `import * as Opf` to collect them as a namespace.

Root `jest.config.js` updated with `b-ber-templates` and
`b-ber-templates/(.+)` moduleNameMapper entries so `b-ber-tasks` tests
(which still use subpath imports) continue to work.

84/84 test suites pass from root.

Parent: [[TASK-024]]
