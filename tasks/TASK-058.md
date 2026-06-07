# TASK-058: Audit Node.js polyfills in reader-react browser bundle

**Status:** complete
**Scope:** reader-react
**Priority:** medium
**GitHub Issue:** (add after creating the issue)

## Description

`packages/b-ber-reader-react/vite.config.lib.js` aliases three Node.js built-ins
for browser compatibility:

```js
stream: 'stream-browserify',
buffer: 'buffer/',
os: 'os-browserify/browser',
```

These exist because something in the dependency tree imports Node.js APIs that
don't exist in the browser. The reader has since migrated to React hooks and
modern APIs — it's possible none of the live code paths actually reach these
imports, making the polyfills dead weight. `stream-browserify` and `buffer/` are
heavy; removing even one would likely save more bundle size than any target bump.

## Subtasks

- [x] Grep the reader-react source (`src/`) for direct imports — none found
- [x] Grep direct dependencies for transitive imports:
      - `stream`: not imported by any direct dep
      - `buffer`: `xml-js/dist/xml-js.js` line 2421 — comment only, not a runtime require
      - `os`: `detect-browser/index.js` line 26 — inside `getNodeVersion()`, guarded
        by `typeof navigator === 'undefined'`; dead code in a browser context
- [x] Removed all three aliases from `vite.config.lib.js` one at a time — all
      three build cleanly with no errors
- [x] Removed all aliases; no comment needed (all dead code paths)
- [x] Bundle size: 530K → 495K (−35K, −6.6%)
- [x] `npm test` passes (18 suites, 60 tests)
- [x] `b-ber-reader`'s `vite.config.js` does not have these aliases — no change needed

## Acceptance Criteria

- Unused polyfill aliases removed from both Vite configs
- `npm test` passes in reader-react
- Bundle size measured and recorded in Notes below

## Notes

Bundle size delta:
- Before: `packages/b-ber-reader-react/dist/index.js`: 530K
- After:  `packages/b-ber-reader-react/dist/index.js`: 495K (−35K, −6.6%)

`stream-browserify`, `buffer/`, and `os-browserify/browser` are now removed
from `package.json` devDependencies in a follow-up cleanup if desired (they are
still installed as transitive deps of other packages, so removal from devDeps is
safe and reduces explicit dep count).

### Addendum (2026-06-07) — finding corroborated

On `feat/fix-cli-version-reader-interop`, `b-ber-reader` switched to bundling
`b-ber-reader-react` **from source** (the same `src/index.jsx` entry the lib
build uses) to fix a React-resolution bug — see [[TASK-052]] motivation. The
node-builtin aliases were initially mirrored into `b-ber-reader/vite.config.js`
out of caution, then removed after confirming the source bundle builds cleanly
without them (503 modules, no errors). This independently re-validates this
task's dead-code finding via a second bundler entry point. `b-ber-reader`'s
`vite.config.js` still carries no `stream`/`buffer`/`os` aliases, as recorded
above. Note: reader-react's **dev** config (`vite.config.js`) still lists the
three aliases — only `vite.config.lib.js` was cleaned here; the dev config is a
candidate for the same removal.
