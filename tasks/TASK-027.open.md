# TASK-027: Convert b-ber-templates to TypeScript

**Status:** not started
**Scope:** b-ber-templates
**Priority:** medium

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
  figures/helpers.js    (284 LOC — largest file)
  Ncx/                  NCX table-of-contents templates
  Opf/                  OPF manifest + metadata templates
  Ops/                  EPUB OPS container templates
  Project/              Project scaffold templates (metadata.yml, config.yml)
  Toc/                  EPUB navigation document templates
  Xhtml/                XHTML page wrapper templates
  Xml/                  XML output templates
  index.js              Re-exports
```

## Subtasks

- [ ] Audit `@types/*` needs: `fs-extra`, `lodash`, `mime-types`,
      `image-size`, `vinyl` (most should already be installed from TASK-012)
- [ ] Rename all `.js` → `.ts` and add type annotations
- [ ] Type the Handlebars template helpers in `figures/helpers.js` — return
      types for HTML string builders are straightforward; focus on the helpers
      that interact with `State` (imported from `b-ber-lib`)
- [ ] Add tsdown build + update `package.json` `main`/`types` fields
- [ ] Run `npm test` in this package; run `npm test` from root for regressions
- [ ] Update TASK-024 subtask checklist

## Notes

Branch: `feat/ts-stage-2`

`b-ber-templates` depends on `b-ber-lib` and `b-ber-logger` (both now typed
from Stage 1), so `State`, `Config`, and `SpineItem` types are available
immediately.

The `tar` package was removed from this package as part of TASK-019 cleanup.
No need to handle it here.

Watch for the `metadata.yml.js` and `config.yml.js` files in `src/Project/` —
these generate YAML file content as JS template strings. They will type-check
cleanly but the string output shapes are opaque (no runtime schema validation).

Parent: [[TASK-024]]
