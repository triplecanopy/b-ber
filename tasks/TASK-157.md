# TASK-157: Build a new project without warnings

**Epic:** EPUB spec compliance
**GitHub Issue:** #790 — https://github.com/triplecanopy/b-ber/issues/790
**Scope:** monorepo

## Description

A project fresh from `bber new` warns on its first build, about things the
user did not write. Since TASK-154, warnings are what a default build prints,
so these are the first output a new user sees:

```
$ bber new my-book && cd my-book && bber build epub
warn  Could not find metadata value for cover
warn  sass Deprecated mixin `break`. Use the `break-at` mixin
warn  render [epub:subchapter] is [deprecated]. substituting with [chapter]
✓ Built epub in 2.3s · 3 warnings
```

Measured on `main` on 2026-11-16, building epub, web, reader and sample in
turn. Each comes from b-ber itself:

| Warning | Comes from | When |
| ------- | ---------- | ---- |
| `Could not find metadata value for cover` | the cover task's `getBookMetadata('cover')` (`b-ber-tasks/src/cover/index.ts`), which warns from `b-ber-lib/src/utils/index.ts` when a term is absent | first build only: a new project has no cover, which is the case the task handles by generating one and adding it to `metadata.yml` |
| `sass Deprecated mixin 'break'` | the bundled themes: `b-ber-theme-serif/layout/_container.scss:27` and `b-ber-theme-sans/_overrides.scss:187` call `break('mobile')`, which b-ber-theme-mixins deprecates in favour of `break-at` | every build, every format |
| `render [epub:subchapter] is [deprecated]` | the starter colophon, `b-ber-templates/src/Project/project-name-colophon.md.ts` (`::: subchapter:credits`) | every build, every format |

It sits under EPUB spec compliance because the starter content uses a
structural-semantics term the EPUB vocabulary deprecates. The other two are the
same kind of problem: b-ber's own defaults tripping b-ber's own warnings.

## Subtasks

- [ ] Cover: look the term up without warning in the cover task, where its
      absence is expected. The warning stays for lookups where a missing term
      is a problem
- [ ] Themes: `break('mobile')` → `break-at('mobile')` in serif and sans.
      `break` only warns and delegates to `break-at`, so the CSS must not
      change; confirm with the golden-output test
- [ ] Colophon: replace `subchapter`. `credits`, the obvious name, is a
      **draft** term and warns too (`DRAFT_DIRECTIVES` in
      b-ber-shapes-directives); `section` is a current bodymatter directive.
      Pick one that reads right in the colophon and does not warn
- [ ] Test: a project from the `bber new` template builds epub, web, reader
      and sample with no warnings (b-ber-testing CLI tests)
- [ ] Leave the kitchen-sink fixture alone: it uses deprecated and draft
      directives on purpose, to exercise every one

## Notes

- Found while recording TASK-154's output samples.
