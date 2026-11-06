# TASK-141: Upgrade postcss 7 → 8 and autoprefixer 9 → 10 (CVE-2023-44270 and four others)

**Epic:** Dependency health
**GitHub Issue:** _to be created_
**Scope:** tasks, reader-react, monorepo

## Description

Renovate PR #700 is a `[security]` update of `postcss` from `^7.0.14` to
`^8.0.0`, one major, in three manifests: the root, `b-ber-reader-react` and
`b-ber-tasks`. The lockfile had **postcss 7.0.39**. Vite and
`detective-postcss` also carried their own **8.5.15**. Five advisories apply:

| Advisory                             | Issue                                            | Fixed in |
| ------------------------------------ | ------------------------------------------------ | -------- |
| CVE-2023-44270 / GHSA-7fh5-64p2-3v2j | `\r` parsing lets CSS hide content in a comment  | 8.4.31   |
| CVE-2026-41305 / GHSA-qx2v-qp2m-jg93 | `</style>` not escaped when stringifying         | 8.5.10   |
| CVE-2026-45623 / GHSA-6g55-p6wh-862q | `sourceMappingURL` comment reads arbitrary files | 8.5.12   |
| CVE-2026-73646 / GHSA-r28c-9q8g-f849 | path traversal in previous source map loading    | 8.5.18   |
| CVE-2026-69153 / GHSA-fxqj-rqcc-2cmp | incomplete fix of the above when `from` is unset | 8.5.23   |

There is no fix on the 7.x line.

**Renovate's PR on its own would not have fixed the real call site.**
`autoprefixer@9` depends on `postcss ^7` itself, so bumping only `postcss`
leaves postcss 7 running inside autoprefixer. npm audit flags autoprefixer 9
for exactly that. The fix is the pair: postcss 8 with autoprefixer 10, the
postcss 8 version of the plugin.

### Where it is used

| Place                             | Use                                                                                                                                                                                                               |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `b-ber-tasks/src/sass/index.ts`   | **The only call.** Every build compiles the theme SCSS with Sass, then runs `postcss(autoprefixer(config.autoprefixer_options)).process(css, { from: undefined })` and writes the result as the book's stylesheet |
| `b-ber-reader-react/package.json` | declared, never imported. Vite uses its own PostCSS, and the package has no PostCSS config (TASK-127 held this back pending a before/after diff of the built stylesheet)                                          |
| root `package.json`               | declared, never imported, no config                                                                                                                                                                               |

So postcss does touch the theme pipeline, but only the vendor-prefix pass
after Sass. The themes themselves do not change.

### Breaking changes that reach us

None. postcss 8.0 removed old Node versions and `postcss.vendor`, deprecated
`postcss.plugin()` (autoprefixer 10 no longer uses it), and moved plugins to
`peerDependencies`. autoprefixer 10.0 moved to postcss 8 and a peer
dependency. The call b-ber makes is unchanged API. Passing `from` explicitly,
even as `undefined`, avoids postcss 8's missing-`from` warning. What could
change is prefix output: autoprefixer has many prefixing fixes between 9.8.8
and 10.6.2. caniuse-lite (1.0.30001820) and browserslist (4.29.5) do not move,
so the browser data is the same.

## Changes

- `b-ber-tasks`: `postcss ^8.5.32`, `autoprefixer ^10.6.2`.
- Root and `b-ber-reader-react`: `postcss` and `autoprefixer` removed (inert;
  see Verification).
- `package-lock.json`: one postcss (8.5.32), which Vite and
  `detective-postcss` now share instead of their own 8.5.15. The lockfile also:
  - drops postcss 7's and autoprefixer 9's dependencies (`num2fraction`,
    `normalize-range`);
  - adds `fraction.js` for autoprefixer 10;
  - deduplicates `picocolors`;
  - moves `source-map-js` from 1.2.1 to 1.2.2, which postcss 8.5.31+ requires.

## Subtasks

- [x] Find every use; confirm whether reader-react uses postcss
- [x] Read the advisories, the postcss 8.0 and autoprefixer 10.0 changes, and
      autoprefixer's 10.x changelog
- [x] Baseline: capture the real build's postcss input and output for every
      theme, build and env on postcss 7
- [x] Side-by-side comparison of 7 + 9 and 8 + 10 on the same input and the
      same browser data, across `autoprefixer_options` variants
- [x] Bump `b-ber-tasks`; remove the inert root and reader-react declarations
- [x] Real-build comparison against the baseline; reader `dist/` before and
      after
- [x] `npm test`, typecheck, Playwright `cli`, `npm audit`
- [ ] Merge; confirm Renovate closes #700 as superseded

## Verification

**Real build inputs and outputs.** A `--require` preload wrapped postcss's
`Processor#process` inside the real CLI and recorded the CSS the sass task
passes in and the CSS it gets back. The kitchen-sink was built for
`b-ber-theme-serif` and `b-ber-theme-sans`, each build (`epub`, `mobi`, `pdf`,
`web`, `sample`, `reader`, `xml`) and `development` and `production`, first on
postcss 7 + autoprefixer 9 and then on 8 + 10. **All 52 captured files (26
inputs, 26 outputs) are byte-identical**, and exit codes and warning and error
counts match. (`sans` + `web` fails in Sass on both; see Findings.)

**Side by side**, same input, same caniuse data. The 26 real stylesheets went
through both pipelines, and the epub ones also with six `autoprefixer_options`
a book can set:

- the Config defaults;
- old browsers;
- `grid: 'autoplace'`;
- `flexbox: false`;
- the legacy `browsers` key;
- `remove: false`.

The harness first reproduced the real postcss 7 output exactly. **All 46
combinations are identical.** A synthetic stylesheet built to hit features
the themes do not use does differ. Each difference is a changelog-listed
autoprefixer fix, or the advisory fix itself:

- `print-color-adjust` gains `-webkit-`;
- the `stretch`/`fill-available` fallbacks are reordered so Firefox uses the
  `-webkit-` form (10.5.2);
- the old-Firefox `-moz-text-decoration` prefix is dropped;
- `</style>` inside a string becomes `\3c /style>`.

So only an author whose own `_overrides.scss` uses those features would see a
change.

**Reader.** Two builds of `main` produce an identical `dist/`. After removing
the declarations, `dist/styles.css` is identical. `dist/index.mjs` differs in
one hunk, and that hunk is `source-map-js` 1.2.2's `SourceMapGenerator`, bundled
through `css-tree`. The change replaces a loop that appends `;` once per line
with `';'.repeat(n)`: a performance fix with the same output, on a source-map
path the reader's `XMLAdaptor` does not use. postcss 8.5.31+ requires it.
Avoiding it would mean pinning postcss below that.

**Kitchen-sink scenarios** (the TASK-140 script: `new`, `theme set`,
`generate`, `epub` and `web` builds, generated cover): 241/241 files identical.

**Gates:**

- `npm test`: 131/131 suites.
- Typecheck: `b-ber-tasks` is clean. The six packages that fail, fail on
  `main` with the same implicit-`any` errors.
- Playwright `cli`: 16/16.
- `npm audit`: postcss and autoprefixer are clear, and the total goes from 78
  to 74.

## Findings

- **`b-ber-theme-sans` cannot build `web`.** Sass fails with "Undefined
  variable `$success`". The sans theme imports serif's `layout/_web.scss`,
  which uses `$success`, but sans's `_settings.scss` never defines it. This
  predates this task and happens before postcss runs. Worth its own task.
- **`b-ber-tasks/src/declarations.d.ts` still declares `autoprefixer` by
  hand,** which shadows the types autoprefixer 10 ships. It typechecks as it
  is, so it is left alone. It is tidy-up, not security.
- **The `autoprefixer_options` default is read when the module loads**
  (`state.config.autoprefixer_options || {...}` at the top of
  `sass/index.ts`), not per build. This predates this task and was not
  changed.
- **The `@types/lodash` lockfile drift** (TASK-139) is again left out of the
  diff.

## Notes

- Renovate PR: #700. Related: TASK-127 (held the reader-react removal for this
  check), TASK-139 and TASK-140 (the same kind-3 path), TASK-132 (impact
  report).
- Scope is the security fix only.
