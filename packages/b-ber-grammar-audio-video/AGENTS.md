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
- Branch on the target's features (`state.target.features`) at render time, never on its name; do not cache them
- `controls` attribute defaults to `controls="controls"` for EPUB validity; only targets with `liveEmbeds` (reader, web) allow custom values
