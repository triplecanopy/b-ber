# AGENTS.md — b-ber-grammar-media

## What This Is

A pre-parse text substitution step for `media` and `media-inline` directives. Scans the raw Markdown string line-by-line using character codes (no regex for the main loop), identifies `media`/`media-inline` directives by their fence and type, looks up the matching entry in `state.media` (from `media.yml`), and replaces the entire directive line with the concrete directive string for the current build (e.g. `vimeo`, `audio-inline`, `figure`). Uses a `delta` accumulator to keep line positions correct as replacements change string length. The substituted Markdown is then processed by the normal MarkdownIt pipeline.

## Key Files

| File                      | Purpose                                                                       |
| ------------------------- | ----------------------------------------------------------------------------- |
| `src/index.ts`            | `render(markdownString)` — the substitution pass; exports `{ render }`        |
| `src/helpers.ts`          | `createDirectiveString()`, `createAttributesString()`, error-throwing helpers |
| `__tests__/index.test.js` | Jest tests                                                                    |

## Dev Commands

```
npm test
```

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- The line scanner uses character codes and index arithmetic, not split/join — maintain this for correctness with the delta tracking
- No HTML is emitted; this package only mutates the Markdown source string
