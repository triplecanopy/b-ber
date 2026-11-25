# TASK-177: Keep per-document directive state in markdown-it env instead of State

**Epic:** Build pipeline & directive redesign
**GitHub Issue:** #840 — https://github.com/triplecanopy/b-ber/issues/840
**Scope:** grammar packages, parser packages, b-ber-markdown-renderer

## Description

Plan step 4 of [TASK-161](./TASK-161.md).

The grammar stops importing `State`. Per-document state (figures, footnotes,
diagnostics) lives in markdown-it's `env`, and per-target behaviour comes from
`ctx.target.features` (TASK-164). That is also what lets TASK-168 parse once.

Module-level state that carries from one `render()` call to the next is not
allowed. TASK-160's spike found the footnote `Counter`, which TASK-166 moves
onto the context.

## Subtasks

- [ ] No grammar or parser package imports `State`
- [ ] Per-document state in `env`
- [ ] No module-level mutable state that outlives a `render()` call

## Notes

- Depends on TASK-163, TASK-164 and TASK-175.
