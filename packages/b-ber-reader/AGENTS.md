# AGENTS.md — b-ber-reader

## What This Is

`b-ber-reader` is a Vite-based deployment shell for the React EPUB reader. It
contains no reader logic; its only job is to bundle `@canopycanopycanopy/b-ber-reader-react`
into a self-contained browser application and provide a small Express server for
local preview. `src/index.jsx` mounts the `<Reader>` component, passing in any
`window.__SERVER_DATA__` props injected at serve time. The Express server
(`server.js`) scans an `epub/` directory, auto-generates a JSON manifest of
available books, and serves the compiled `dist/` bundle as a static site.

`b-ber-reader-react` is bundled **from source**, not from its pre-built dist:
`vite.config.js` aliases the package to its `src/index.jsx` entry so Vite
compiles the whole reader (and its CJS dependencies) in a single pass alongside
this shell. This is required for correct React resolution — see Code Standards.

## Key Files

| File             | Purpose                                                              |
| ---------------- | -------------------------------------------------------------------- |
| `src/index.jsx`  | Vite entry — mounts `<Reader>` from `b-ber-reader-react`             |
| `index.html`     | Vite HTML entry point (replaces webpack HtmlPlugin template)         |
| `vite.config.js` | Production Vite config; outputs hashed bundles to `dist/`            |
| `server.js`      | Express server — scans `epub/`, serves manifest at `/api/books.json` |
| `index.js`       | Package `main` — empty stub (no programmatic API)                    |

## Dev Commands

```bash
npm run build   # Vite production build → dist/
npm run serve   # build then start the Express server via nodemon
```

No tests are currently implemented.

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- `b-ber-reader` is a deployment shell. Do not add reader features here;
  implement them in `b-ber-reader-react` instead.
- `vite.config.js` aliases `@canopycanopycanopy/b-ber-reader-react` to its
  `../b-ber-reader-react/src/index.jsx` source entry. **Do not** point it back
  at the package's pre-built dist. The dist is a rolldown lib bundle that
  externalizes React; its CJS sub-deps (react-player, react-fast-compare)
  compile `require('react')` into a baked-in rolldown require shim that throws
  in the browser ("environment that doesn't expose the require function") when
  re-bundled here. Building from source resolves React once for the whole tree.
  Because the styles then come from the source `index.scss`, do not re-add a
  `b-ber-reader-react/dist/styles.css` import to `src/index.jsx`.
- `vite.config.js` also aliases `react` and `react-dom` to the monorepo root to
  prevent duplicate React instances when `b-ber-reader-react` is resolved via
  the workspace symlink — preserve this if updating the Vite config.
- `vite.config.js` aliases the node-builtin shims `stream` → `stream-browserify`,
  `buffer` → `buffer/`, and `os` → `os-browserify/browser`. **These are
  required, not optional:** `sax` (used to parse the OPF/NCX) has a `SAXStream`
  that extends Node's `Stream` and calls `Buffer.isBuffer`, so without the shims
  the browser bundle throws `Cannot read properties of undefined (reading
  'prototype')` on load. Build success and jsdom-based tests do **not** catch
  this (jsdom provides Node's `stream`/`buffer`; the browser does not) — verify
  any change to these aliases by actually loading `bber serve` in a browser.
- The Express server in `server.js` is for local development only and should
  not be hardened for production use.
