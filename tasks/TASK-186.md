# TASK-186: Decide whether the reader keeps books.json alongside its server data

**Epic:** Reader quality (reader-react)
**GitHub Issue:** #851 — https://github.com/triplecanopy/b-ber/issues/851
**Scope:** reader-react, b-ber-tasks
**Model:** Opus: a design decision that spans the build and the reader's
loading path, and depends on how hosts embed the reader.

## Description

A reader build gives reader-react its settings twice:

- **`api/books.json`**, written by `b-ber-tasks/src/reader/index.ts:182`: one
  entry with `title`, `url`, `cover`, `id`, `downloads`, `ui_options` and
  `layout`. Its URLs are built from `remote_url` (`:169-173`).
- **`window.__SERVER_DATA__`**, injected into the reader's `index.html`
  (`:243-260`): `bookURL` (from `reader_url`), `projectURL`, `downloads`,
  `uiOptions`, `layout`, and `loadRemoteLibrary: false`.

reader-react uses both (`components/App.tsx:40-131`). It takes the settings it
was given, derives `projectURL` from `bookURL` when it is missing, fetches
`<projectURL>/api/books.json` (`helpers/Request.ts:31`), finds the book whose
`id` matches the last segment of `bookURL`, and applies that entry's
`layout`, `downloads` and `ui_options`. If the fetch fails it warns and
carries on.

**For a b-ber build, `books.json` is redundant.** The two files carry the same
settings, and the fetch goes to the wrong place unless `remote_url` equals
`reader_url`: kitchen-sink's request goes to
`http://localhost:4000/api/books.json` and misses ([TASK-162](./TASK-162.md),
audit bug 5). The reader then runs on `__SERVER_DATA__` alone.

**Where it comes from.** The 2018 `b-ber-reader` (a GitLab project, last
committed 2018-03-29) served `/api/books.json` from its own server for a
multi-book library. reader-react kept the request but turned the library off
(`loadRemoteLibrary: false`). Its own comment says the code needs "to either
remove or re-enable the library functionality".

**The deciding question:** does any live host embed reader-react with only a
`bookURL`, and rely on `books.json` for the book's layout, downloads and
controls? reader-react's public props (`index.d.ts`) allow that. The b-ber
build doesn't need it.

## Options

1. **Keep both**, and make them agree. TASK-182's single `url` already fixes
   where `books.json` is written, so the fetch would find it.
2. **Drop `books.json`.** The build stops writing it and reader-react stops
   fetching it; settings come from props or `__SERVER_DATA__` only. That's a
   breaking change to reader-react's embedding contract, if anything relies on
   it.
3. **Fetch only when needed:** when the host gives a `bookURL` and no
   settings. The build stops writing it unless a project asks for it.

Re-enabling the multi-book library is out of scope.

## Subtasks

- [ ] List every host that embeds reader-react (the Triple Canopy site and any
      others) and how each passes settings
- [ ] Decide between the options, and record why
- [ ] Implement on both sides, or file the work

## Notes

- Read `packages/b-ber-reader-react/MIGRATION-CONVENTIONS.md` before
  changing reader code.
- Related: TASK-182 (one `url`, which fixes the mismatch either way), and
  [TASK-162](./TASK-162.md) decision 11, which moved this question here.
