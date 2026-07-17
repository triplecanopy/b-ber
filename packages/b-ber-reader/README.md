# `@canopycanopycanopy/b-ber-reader`

`b-ber-reader` is a thin webpack-based wrapper that bundles `@canopycanopycanopy/b-ber-reader-react` into a standalone browser application. It contains no reader logic of its own; `src/index.js` mounts the React reader component from `b-ber-reader-react` onto a `#root` element, seeding it with optional `window.__SERVER_DATA__` props. A companion Express server (`server.js`) scans an `epub/` directory, builds a book manifest, serves it at `/api/books.json`, and acts as a static host for the compiled `dist/` bundle — enabling local preview of multiple compiled b-ber projects. This package is considered the deployment shell for the reader; prefer `b-ber-reader-react` for any reader feature work.

## Architecture

| Component           | Description                                                            |
| ------------------- | ---------------------------------------------------------------------- |
| `src/index.js`      | Entry point — mounts `<Reader>` from `b-ber-reader-react`              |
| `src/template.ejs`  | HTML shell template used by HtmlWebpackPlugin                          |
| `webpack.config.js` | Production bundle config; outputs to `dist/`                           |
| `server.js`         | Express dev server; scans `epub/` and serves a book manifest           |
| `index.js`          | Package main — empty stub (reader logic lives in `b-ber-reader-react`) |

The webpack build resolves `react` and `react-dom` from the monorepo root to
avoid duplicate React instances when `b-ber-reader-react` is symlinked.

## Dev

```bash
npm run build   # webpack production build → dist/
npm run serve   # build then start the Express server (nodemon)
```

No tests are currently implemented (`npm test` echoes "TODO tests").
