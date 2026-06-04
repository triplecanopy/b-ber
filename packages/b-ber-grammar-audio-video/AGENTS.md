# AGENTS.md — b-ber-grammar-audio-video

## What This Is

Transforms the `audio`, `audio-inline`, `video`, and `video-inline` b-ber Markdown directives into HTML. Validates that a `source` attribute is provided, resolves local files from `_media` or handles remote URLs (falling back to an iframe wrapper for Vimeo/YouTube). Emits different HTML depending on the current build target: EPUB/Mobi gets a small figure thumbnail linking to a generated figure page; `reader`/`web` builds get an inline `<audio>` or `<video>` element with `<source>` children, poster image, and playsinline attributes. Delegates figure-page generation to `b-ber-parser-figure`.

## Key Files

| File                      | Purpose                                                                                                                                                         |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/index.ts`            | Entry point — `prepare()` function, `render()` dispatcher, exported directive object                                                                            |
| `src/helpers.ts`          | HTML-building utilities: `createMedia`, `createIFrame`, `createMediaInline`, `createLocalMediaSources`, `createRemoteMediaSource`, `getWebOnlyAttributesString` |
| `__tests__/index.test.js` | Jest tests                                                                                                                                                      |

## Dev Commands

```
npm test
```

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- All transforms are synchronous
- Build-target branching (`state.build`) is done at render time; do not cache build type
- `controls` attribute defaults to `controls="controls"` for EPUB validity; only `reader`/`web` builds allow custom values

## Task System

Tasks for this package are tracked in tasks/ using the same PRD format as the root AGENTS.md. No tasks are currently open. To add a task, create tasks/TASK-NNN.open.md following the format in the root AGENTS.md.
