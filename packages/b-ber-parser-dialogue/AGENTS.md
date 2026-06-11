# AGENTS.md — b-ber-parser-dialogue

## What This Is

A markdown-it block-container plugin that parses b-ber `dialogue` directives. It tokenises colon-fenced (`:::`) blocks into `<div>` open/close pairs, then post-processes inline tokens inside the container to find `:: speaker ::` patterns, wrapping the speaker name in `<span class="interlocutor">` and marking the parent paragraph `class="interlocutor-parent"`.

## Key Files

| File                      | Purpose                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| `src/index.ts`            | Plugin entry point; registers the block rule and renderer, handles interlocutor extraction |
| `__tests__/index.test.js` | Test file (placeholder only — contains `test.todo`)                                        |

## Dev Commands

```
npm test   # runs jest (suite has only todo placeholders — no assertions yet)
```

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- The plugin follows the markdown-it-container 2.0.0 API pattern (adapted, not a direct dependency)
- `validateOpen` and `render` callbacks are injected by the calling directive handler; the plugin itself does not define them
- No class components; plugin is a plain function export
