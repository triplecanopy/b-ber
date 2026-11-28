# AGENTS.md — b-ber-grammar-media

## What This Is

Resolves a `media` or `media-inline` directive for one target. `resolve({ type, id, build, media })` looks the id up in `media.yml` (`state.media`) under the target's name and returns the line of the directive it names (e.g. `vimeo`, `audio-inline`, `figure`) after its fence, its caption, and the whole replacement source. It throws, as the build always has, for an id or a target that `media.yml` lacks.

b-ber-markdown-renderer's directive rule parses the `media` line as written and calls `resolve` when it renders, so a document parses the same for every target. Until TASK-175 this package was a pre-pass that spliced the replacement into the Markdown before the parse, once per target; `resolve` returns exactly what that pass wrote.

## Key Files

| File                      | Purpose                                                                       |
| ------------------------- | ----------------------------------------------------------------------------- |
| `src/index.ts`            | `resolve`; exports `{ resolve }`                                              |
| `src/helpers.ts`          | `createDirectiveString()`, `createAttributesString()`, error-throwing helpers |
| `__tests__/index.test.js` | Jest tests                                                                    |

## Dev Commands

```
npm test
```

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- No HTML is emitted, and nothing rewrites the Markdown source: `resolve` only says what a `media` line becomes
- The id is everything between the first `:` and the next, as the pre-pass read it, so `media:m classes:x` asks for `m classes` and fails as it always has
