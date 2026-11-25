# TASK-168: Parse the Markdown once and render every target from the shared tree

**Epic:** Build pipeline & directive redesign
**GitHub Issue:** #831 — https://github.com/triplecanopy/b-ber/issues/831
**Scope:** b-ber-tasks

## Description

Plan step 5 of [TASK-160](./TASK-160.md).

Today every target re-parses every document. Once [TASK-161](./TASK-161.md)'s parser builds a
tree, parsing moves into prepare and runs once. Each target renders from the
shared, read-only trees. Target-dependent transforms, such as `media`
resolution, run per target on a copy of the affected nodes.

On a small book sass, not parsing, is the larger repeated cost (TASK-160's
Findings), so measure before and after on a long book.

## Subtasks

- [ ] The render task takes the shared trees from prepare
- [ ] `media` resolved per target at render time
- [ ] A timing comparison on a long book, recorded in Findings
- [ ] Golden output unchanged

## Notes

- Depends on TASK-166, and on TASK-174/TASK-175 for the tree.
