# TASK-142: Fix the sans theme's web build, and build every theme in e2e

**Epic:** E2E testing
**GitHub Issue:** #711 — https://github.com/triplecanopy/b-ber/issues/711
**Scope:** theme-sans, testing

## Description

With `b-ber-theme-sans` selected, `bber build web` fails in Sass:

```
Error: Undefined variable.
   ╷
74 │       color: $success;
   │              ^^^^^^^^
   ╵
  …/b-ber-theme-serif/layout/_web.scss 74:14  @import
  …/b-ber-theme-serif/layout/index.scss 10:9  @import
```

The other six build targets work with sans, and serif builds all seven.

**Cause.** The sans theme imports serif's layout
(`@import '~@canopycanopycanopy/b-ber-theme-serif/layout'`) and supplies its own
`_settings.scss`. On 2023-03-03:

- commit `5cf0c7a9` removed `$success: #5050c5 !default;` from sans's
  `_settings.scss`;
- the same day, `a11110d9` ("adds missing variable") added
  `$success: #009500 !default;` to **serif's** settings only.

Serif's `layout/_web.scss` uses `$success`, and only serif defines it, so sans
has failed the web build since then.

**Why nothing caught it.** The e2e suite builds the kitchen-sink fixture with
its configured theme, which is serif. No test builds sans at all. TASK-141
found the failure while capturing CSS for every theme × build × environment.

This task is filed under E2E testing because the coverage gap is what let the
bug live for 3½ years. The one-line fix is the smaller part.

## Subtasks

- [ ] Restore `$success: #5050c5 !default;` in
      `packages/b-ber-theme-sans/_settings.scss`. That is the value removed in
      `5cf0c7a9`; confirm it is still the intended sans colour.
- [ ] Check that no other variable serif's layout uses is undefined in sans.
      Compile sans for every build target, not only `web`.
- [ ] e2e: build the kitchen-sink with each built-in theme (`theme set`, then
      build) for each target the suite can run without external tools, and
      assert a stylesheet is written. Today that is everything except `mobi`
      and `pdf`, which need calibre and a PDF engine.
- [ ] Confirm the fix reaches existing projects. `theme set` copies the
      theme's `_settings.scss` into `_project/_stylesheets/b-ber-theme-sans/`,
      and the sass task prepends that copy. A copy made after 2023-03 has no
      `$success`. The theme's own `@import 'settings'` should still load the
      package's file, which would define it with `!default`. Verify that with a
      project whose copy predates the fix, rather than assuming it.

## Notes

- Found in TASK-141 (postcss upgrade). That task's capture script
  (`theme × build × env` through the real CLI) is a model for the e2e case.
- Reproduce: copy `packages/b-ber-testing/fixtures/kitchen-sink`, run
  `bber theme set b-ber-theme-sans`, then `bber build web`.
