# AGENTS.md — b-ber-parser-section

## What This Is

A markdown-it block-container plugin that parses generic b-ber structural directives (chapter, part, frontmatter, bodymatter, backmatter, etc.) into HTML `<section>` elements. It tokenises colon-fenced (`:::`) blocks and emits `container_<name>_open` / `container_<name>_close` tokens. It does no child-token post-processing; the `render` callback supplied by the directive handler is solely responsible for the output HTML and EPUB structural attributes.

## Key Files

| File                      | Purpose                                                             |
| ------------------------- | ------------------------------------------------------------------- |
| `src/index.ts`            | Plugin entry point; block rule, token emission with `<section>` tag |
| `__tests__/index.test.js` | Test file (placeholder only — contains `test.todo`)                 |

## Dev Commands

```
npm test   # runs jest (suite has only todo placeholders — no assertions yet)
```

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- This is the simplest parser plugin; it must not accumulate logic that belongs in the calling directive handler
- `validateOpen` and `render` callbacks are injected by the calling directive handler
- Token tag is `section` (not `div`); keep this consistent with EPUB structural semantics
