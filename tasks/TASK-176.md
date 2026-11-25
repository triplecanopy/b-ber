# TASK-176: Build the XHTML output as a tree

**Epic:** Build pipeline & directive redesign
**GitHub Issue:** #839 — https://github.com/triplecanopy/b-ber/issues/839
**Scope:** grammar packages, b-ber-templates

## Description

Plan step 3 of [TASK-161](./TASK-161.md).

Each target renders from the tree into an element tree, with a small builder
and serializer, so the XHTML is well-formed by construction. No more
`<section>` from one render call and `</section>` from another.

## Subtasks

- [ ] The element builder and serializer
- [ ] Directive renderers build elements, not strings
- [ ] Golden output unchanged, apart from differences TASK-175 already listed

## Notes

- Design: [TASK-161](./TASK-161.md), "The pieces".
- Depends on TASK-175.
