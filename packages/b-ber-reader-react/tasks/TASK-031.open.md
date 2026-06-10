# TASK-031: Declare ESM package type and add an exports map

**Status:** not started
**Phase:** Packaging
**Priority:** medium
**Created:** 2026-06-10

## Description

The published package emits an ESM-only lib bundle (`dist/index.js`, built by
`vite.config.lib.js`), but `package.json` does not declare `"type": "module"`
and has no `"exports"` map. Node therefore can't tell the bundle's module format
from metadata and warns at load time:

```
[MODULE_TYPELESS_PACKAGE_JSON] Module type of .../dist/index.js is not
specified and it doesn't parse as CommonJS. Reparsing as ES module ...
```

It currently works because consuming bundlers detect ESM syntax, but relying on
syntax-sniffing is fragile and the intent (ESM-only) is not explicit to Node or
tooling. The package also exposes `dist/styles.css`, which consumers import
directly (`@canopycanopycanopy/b-ber-reader-react/dist/styles.css`); an
`"exports"` map should keep that subpath importable.

Context: the library transitioned UMD → ESM-only during the tooling upgrades
(commit `bb4f7a92`). See [[project-reader-react-require-shim]] for the related
require-shim fix that the ESM output made necessary.

## Subtasks

- [ ] Add `"type": "module"` to `package.json`
- [ ] Add an `"exports"` map: `"."` → `./dist/index.js` (with `"types"` →
      `./index.d.ts`), and a `"./dist/styles.css"` subpath for the stylesheet
- [ ] Keep `"main"` for legacy resolvers; confirm `"files"` still ships `dist` +
      `index.d.ts`
- [ ] Verify the CSS import path used in consumer docs/examples still resolves
      under the new `exports` map (exports maps are restrictive — unmapped
      subpaths stop resolving)
- [ ] Confirm `bber serve` is unaffected (`b-ber-reader` consumes reader-react
      from `src`, not the published `dist` — no exports-map impact)
- [ ] `npm test`; verify the Node `MODULE_TYPELESS_PACKAGE_JSON` warning is gone
      when importing `dist/index.js`; commit; update `PLAN.md`; remove `.open`

## Notes

- ESM-only is safe for the intended audience (bundler-based React apps). The only
  patterns it breaks — plain-Node `require()` and `<script>`-tag UMD globals —
  are not real use cases for a browser reader component. If a CJS entry is ever
  needed, the `exports` map is where a `"require"` condition would be added.
- Be deliberate with the `exports` map: once present, **only** mapped subpaths
  resolve. Enumerate every subpath consumers rely on (at minimum `.` and the
  stylesheet) before publishing.
