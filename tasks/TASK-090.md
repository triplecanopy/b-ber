# TASK-090: Declare ESM package format and add an exports map

**Status:** complete
**Phase:** Packaging
**Priority:** medium
**Created:** 2026-06-10

## Description

The published package emits an ESM-only lib bundle (`dist/index.js`, built by
`vite.config.lib.js`), but `package.json` does not declare the module format and
has no `"exports"` map. Node therefore can't tell the bundle's module format
from metadata and warns at load time:

```
[MODULE_TYPELESS_PACKAGE_JSON] Module type of .../dist/index.js is not
specified and it doesn't parse as CommonJS. Reparsing as ES module ...
```

It currently works in webpack/CRA because that bundler sniffs the ESM syntax,
but Vite trusts package metadata over syntax-sniffing: its esbuild dep optimizer
reads the unlabelled `.js` as CommonJS and nests the component under `.default`,
forcing consumers to write `<Reader.default … />` instead of `<Reader … />`.
The package also exposes `dist/styles.css`, which consumers import directly
(`@canopycanopycanopy/b-ber-reader-react/dist/styles.css`); the `"exports"` map
must keep that subpath importable.

Context: the library transitioned UMD → ESM-only during the tooling upgrades
(commit `bb4f7a92`). See [[project-reader-react-require-shim]] for the related
require-shim fix that the ESM output made necessary.

## Subtasks

- [x] Emit the bundle as `dist/index.mjs` (`vite.config.lib.js` `fileName`) so
      the ESM format is unambiguous without setting `"type": "module"`
- [x] Add an `"exports"` map: `"."` → `./dist/index.mjs` (with `"types"` →
      `./index.d.ts` and an `"import"` condition), plus a `"./dist/styles.css"`
      subpath for the stylesheet
- [x] Point `"main"`/`"module"`/`"types"` at the new entry; confirm `"files"`
      still ships `dist` + `index.d.ts`
- [x] Add a named `Reader` export alongside the default (`src/index.jsx`,
      `index.d.ts`) so consumers can write `import { Reader } from '…'`
- [x] Verify the CSS import path used by consumers still resolves under the new
      `exports` map (exports maps are restrictive — unmapped subpaths stop
      resolving)
- [x] Confirm `bber serve` is unaffected (`b-ber-reader` consumes reader-react
      from `src`, not the published `dist` — no exports-map impact)
- [x] `npm test` (18 suites pass) + Biome clean; verified a Vite consumer
      builds with `<Reader … />` and the named import after the fix

## Notes

- **Deviation from the original plan:** used `dist/index.mjs` instead of
  `"type": "module"`. The package keeps CommonJS config files (`jest.config.js`,
  `jest-transform-upward.js`, `scripts/version.js`); setting `"type": "module"`
  would reparse those as ESM and break Jest. The `.mjs` extension carries the
  ESM signal per-file, so Node/Vite treat the bundle as ESM while the `.js`
  configs stay CJS.
- **Named export folded in (per follow-up request):** `Reader` is now exported
  as a named binding (`export { ConnectedApp as Reader }`) in addition to the
  default. Named imports sidestep default-interop ambiguity entirely; the
  default export is retained for back-compat with canary consumers already on
  `import Reader from '…'`.
- ESM-only is safe for the intended audience (bundler-based React apps). The only
  patterns it breaks — plain-Node `require()` and `<script>`-tag UMD globals —
  are not real use cases for a browser reader component. If a CJS entry is ever
  needed, the `exports` map is where a `"require"` condition would be added.
- Be deliberate with the `exports` map: once present, **only** mapped subpaths
  resolve. Enumerate every subpath consumers rely on (at minimum `.` and the
  stylesheet) before publishing.
- Verified against `/Users/msimmer/code/tc/b-ber-projects/b-ber-vite`: synced the
  build into its `node_modules`, switched `App.tsx` to `import { Reader }` +
  `<Reader … />`, and `vite build` succeeded (CSS subpath resolved too). A fresh
  canary publish + `npm install` is still required for that project to pick up
  the fix permanently.
