# AGENTS.md — b-ber-grammar-attributes

## What This Is

Shared attribute parsing and serialization utilities for the b-ber grammar pipeline. Handles the custom inline attribute syntax used in all b-ber directives (`key:value key2:"value with spaces"`), validates attribute names against the allowed set per directive type, merges EPUB structural taxonomy defaults (epub:type, class names derived from frontmatter/bodymatter/backmatter classification), and serializes attribute objects to HTML attribute strings or URL query strings. Every other grammar package depends on this one.

## Key Files

| File                      | Purpose                                                                                                                       |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `src/index.ts`            | All exports: `parseAttrs`, `attributesObject`, `attributesString`, `attributesQueryString`, `attributes`, `htmlId`, `toAlias` |
| `__tests__/index.test.js` | Jest tests covering all exported functions                                                                                    |

## Dev Commands

```
npm test
```

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- All transforms are synchronous; no async code
- Attribute parsing uses a hand-written character-level scanner (no regex for the core loop) to handle quoted values with embedded spaces
- The biological taxonomy comment in `src/index.ts` explains the class/order/family/genus hierarchy used for EPUB structural classification — keep it
