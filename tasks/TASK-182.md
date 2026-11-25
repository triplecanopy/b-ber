# TASK-182: Derive every target's public URL from one url key

**Epic:** Build pipeline & directive redesign
**GitHub Issue:** #846 — https://github.com/triplecanopy/b-ber/issues/846
**Scope:** b-ber-tasks, b-ber-lib

## Description

From [TASK-162](./TASK-162.md): four URL keys become one.

`base_url`, `reader_url`, `remote_url` and `base_path` are hard to tell apart,
and two of them disagree in a way that breaks the reader (audit bug 5).
Under TASK-169's layout, `dist/` is published as a whole and each target lives
at `dist/<target>/`. So a target's URL defaults to `<url>/<target>/`, and
`<target>.url` overrides it, for example for a reader hosted elsewhere.
`serve` keeps overriding the URLs with its own, as today.

This fixes:
- **Bug 5:** the reader builds `books.json` from `remote_url` but its book URL
  from `reader_url`. It fetches `books.json` from the wrong place unless the
  two are equal, and falls back to `__SERVER_DATA__`.
- **Bug 6:** the dist directory's name leaks into public URLs. The webpub
  manifest's self link is `<remote_url>/<distDir>/manifest.json`.

## Subtasks

- [ ] `url` and per-target URL derivation in the resolved config
- [ ] web, reader and the webpub manifests read the derived URLs
- [ ] The reader's check that its URL is absolute `http` in production stays
- [ ] Golden snapshot regenerated

## Notes

- Depends on TASK-180 and TASK-169 (the layout the URLs assume). 5.0.
- Whether reader-react should keep both `books.json` and `__SERVER_DATA__` is
  a separate reader question ([TASK-162](./TASK-162.md) decision 11).
