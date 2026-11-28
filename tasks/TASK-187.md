# TASK-187: Replace fs-extra with node:fs

**Epic:** Node.js modernization
**GitHub Issue:** #860 — https://github.com/triplecanopy/b-ber/issues/860
**Scope:** monorepo

## Description

One of the two items left before the Node.js modernization epic meets its
"Done means". Its scope always included "dropping `fs-extra` where native
`fs/promises` suffices", and no task had been filed for it when the epic's last
task closed (2026-11-28).

Measured on `main` at `d43d62d3`:

- **33 source files** import `fs-extra`: 20 in b-ber-tasks, 7 in b-ber-lib, and
  one each in b-ber-cli, b-ber-resources and four grammar packages
  (audio-video, image, logo, vimeo).
- **45 test files** import it.
- **11 manifests** declare it: the root and b-ber-cli, -grammar-audio-video,
  -grammar-iframe, -grammar-image, -grammar-logo, -grammar-vimeo, -lib,
  -resources, -templates and -tasks. grammar-iframe and templates declare it
  without importing it, which is TASK-127's kind of finding.

Most calls are already the `node:fs` API that fs-extra re-exports
(`existsSync`, `readFile`, `writeFile`, `readdir`, `mkdtemp`, `rm`). The
fs-extra-only calls in `src/` are few:

| fs-extra | node:fs | Care needed |
| -------- | ------- | ----------- |
| `copy` (7) | `cp(src, dest, { recursive: true })` | `cp` needs `recursive` for directories; check `filter` and overwrite behaviour at each site |
| `mkdirp` (4), `ensureDir` (3), `ensureDirSync` (2) | `mkdir(p, { recursive: true })` | none |
| `remove` (3) | `rm(p, { recursive: true, force: true })` | none |
| `pathExists` (2) | `access(p).then(() => true, () => false)`, or `existsSync` | #736 is an un-awaited `pathExists`; fix the call, not just the import |
| `move` (2) | `rename` | `rename` fails with `EXDEV` across devices; fs-extra falls back to copy + remove. Decide per site whether that can happen |
| `writeJson` (3), `readJSONSync` (3), `readJsonSync` (1) | `JSON.stringify`/`JSON.parse` with `writeFile`/`readFileSync` | keep the same indentation, so no output changes |

The engine floor (`^22.23.4`) has a stable `fs.cp`, so nothing here needs a
polyfill.

## Subtasks

- [ ] Packages outside b-ber-tasks: lib, cli, resources, the four grammar packages
- [ ] b-ber-tasks, after TASK-165 has migrated each task (see Notes)
- [ ] Tests: replace `fs-extra` in the 45 test files, or keep it as a root dev
      dependency for test fixtures only, and say which
- [ ] Remove `fs-extra` from every published package's `dependencies`
- [ ] `npm test`, `typecheck`, the golden-output e2e test unchanged

## Notes

- **Order against TASK-165.** TASK-165 rewrites every b-ber-tasks task as a
  typed function of the build context. Doing b-ber-tasks' fs-extra calls
  before it means the same lines change twice. Do the other packages first,
  and b-ber-tasks either inside TASK-165's commits for each task or straight
  after it.
- The golden-output test is the guard: an fs-extra → node:fs swap should
  change no output, and a `writeJson` replacement that changes indentation
  would show up there.
- The user prefers platform built-ins to third-party libraries (one fewer
  runtime dependency for every published package that declares it).
