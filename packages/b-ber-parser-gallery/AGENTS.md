# AGENTS.md — b-ber-parser-gallery

## What This Is

A markdown-it block-container plugin that parses b-ber `gallery` directives. It tokenises colon-fenced (`:::`) blocks and post-processes each inline child token that matches the `:: … ::` attribute pattern. Attributes are parsed with `b-ber-grammar-attributes`; depending on the `type` attribute (`image`, `video`, or `audio`) the token's children are replaced with the appropriate element tree. MIME types for video/audio sources are resolved with `mime-types`. Optional captions are added as `<div class="figcaption">` children.

## Key Files

| File                      | Purpose                                                                                                                       |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `src/index.ts`            | Plugin entry point; block rule, child-token post-processing, `createImageElement`, `createMediaElement`, `addCaption` helpers |
| `__tests__/index.test.js` | Test file (placeholder only — contains `test.todo`)                                                                           |

## Dev Commands

```
npm test   # runs jest (suite has only todo placeholders — no assertions yet)
```

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- Attribute parsing is delegated to `b-ber-grammar-attributes`; do not duplicate attribute parsing logic here
- Media source resolution reads from `b-ber-lib/State` — the state object must be populated before the plugin runs
- `validateOpen` and `render` callbacks are injected by the calling directive handler
