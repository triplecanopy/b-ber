# TASK-188: Remove process.exit and callback APIs from library code

**Epic:** Node.js modernization
**GitHub Issue:** #861 — https://github.com/triplecanopy/b-ber/issues/861
**Scope:** b-ber-lib

## Description

The other item left before the Node.js modernization epic meets its "Done
means" ("no `process.exit` in library code", "async/await over callbacks").
TASK-046 made the logger record and emit instead of exiting, and only
b-ber-cli turns a failure into an exit status now. Four places in library
code still don't fit, measured on `main` at `d43d62d3`:

| Where | What | Owner |
| ----- | ---- | ----- |
| `b-ber-lib/src/utils/index.ts:99` | `fail` calls `process.exit(0)`. It is marked `@deprecated`, and b-ber-cli uses its own `fail` from `src/lib/exit.ts`; nothing imports the lib one | **this task** |
| `b-ber-lib/src/EbookConvert.ts:31` | `checkForCalibre` wraps `command-exists`'s callback in a `new Promise` | **this task** |
| `b-ber-tasks/src/deploy/index.ts:69`, `:191` | `deploy` exits 0 when the aws CLI is missing, and resolves when an upload fails | #798, under Build pipeline & directive redesign (the deployer design) |
| `b-ber-tasks/src/sass/index.ts:179` | the legacy Dart Sass `render()` callback API, with a `throw` inside the callback (#773) | TASK-109 (#634), under Upgrade tooling |

The last two stay where they are, because the work that removes them is
designed there. The epic closes only when all four are gone; its body lists
the two cross-epic ones so that check is not missed.

## Subtasks

- [ ] Delete b-ber-lib's deprecated `fail`, and its test
- [ ] Replace `command-exists` in `EbookConvert` with a promise check that
      `ebook-convert` runs (e.g. `execFile('ebook-convert', ['--version'])`),
      keeping the same error message; drop `command-exists` from b-ber-lib's
      `dependencies` and its `declarations.d.ts` stub
- [ ] Grep `packages/*/src` (outside b-ber-cli and reader-react) for
      `process.exit` and for Node-style `(err, …) =>` callbacks; record the
      result here, and confirm only the two cross-epic sites remain
- [ ] `npm test`, `typecheck`

## Notes

- `EbookConvert` also builds its command line unquoted (#802). That's a
  separate bug, under Build pipeline & directive redesign; fix it here only if
  the same lines change anyway, and say so in the PR.
- A survey for deprecated Node APIs (`url.parse`, `new Buffer`, `fs.exists`,
  `util.is*`, `util.inherits`, `.substr`, `punycode`) found none in
  `packages/*/src` outside reader-react on 2026-11-28.
