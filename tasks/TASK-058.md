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

### Addendum (2026-06-07) — finding RETRACTED: `stream`/`buffer` are NOT dead

The dead-code conclusion was **wrong** and caused a production regression.
`sax` (pulled in via XML/OPF/NCX parsing) defines `SAXStream` as
`SAXStream.prototype = Object.create(Stream.prototype, …)` and calls
`Buffer.isBuffer` at runtime. Without the `stream`/`buffer` browser shims,
`Stream` is `undefined` and the bundle throws `Cannot read properties of
undefined (reading 'prototype')` on load — a blank reader. This shipped in
canary `3.0.8-next.97` and was caught only by loading `bber serve` in a real
browser.

Why the original verification missed it: "builds cleanly" and "`npm test`
passes" do not exercise the browser. Jest runs under jsdom, where Node's
`stream`/`buffer` are present, so `sax` works in tests; the failure only appears
in a real browser bundle. This is the same publish-only trap documented in
[[TASK-052]].

Resolution (2026-06-07): the three aliases are **restored** in both
`b-ber-reader/vite.config.js` (the live serve path, bundled from source) and
`b-ber-reader-react/vite.config.lib.js`. The −35K bundle-size saving recorded
above does not apply. Any future attempt to prune these must be verified by
loading `bber serve` in a browser, not by build/test success alone.
