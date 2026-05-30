# AGENTS.md — b-ber-reader

## What This Is

`b-ber-reader` is a webpack-based deployment shell for the React EPUB reader. It
contains no reader logic; its only job is to bundle `@canopycanopycanopy/b-ber-reader-react`
into a self-contained browser application and provide a small Express server for
local preview. `src/index.js` mounts the `<Reader>` component, passing in any
`window.__SERVER_DATA__` props injected at serve time. The Express server
(`server.js`) scans an `epub/` directory, auto-generates a JSON manifest of
available books, and serves the compiled `dist/` bundle as a static site.

## Key Files

| File                | Purpose                                                              |
| ------------------- | -------------------------------------------------------------------- |
| `src/index.js`      | Webpack entry — mounts `<Reader>` from `b-ber-reader-react`          |
| `src/template.ejs`  | HTML shell template used by HtmlWebpackPlugin                        |
| `webpack.config.js` | Production webpack config; outputs hashed bundles to `dist/`         |
| `server.js`         | Express server — scans `epub/`, serves manifest at `/api/books.json` |
| `index.js`          | Package `main` — empty stub (no programmatic API)                    |

## Dev Commands

```bash
npm run build   # webpack production build → dist/
npm run serve   # build then start the Express server via nodemon
```

No tests are currently implemented.

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- `b-ber-reader` is a legacy deployment shell. Do not add reader features here;
  implement them in `b-ber-reader-react` instead.
- The webpack config aliases `react` and `react-dom` to the monorepo root to
  prevent duplicate React instances when `b-ber-reader-react` is symlinked via
  `file:` — preserve this alias if updating the webpack config.
- The Express server in `server.js` is for local development only and should
  not be hardened for production use.

## Task System

Tasks for this package are tracked in tasks/ using the same PRD format as the
root AGENTS.md. No tasks are currently open. To add a task, create
tasks/TASK-NNN.open.md following the format in the root AGENTS.md.
