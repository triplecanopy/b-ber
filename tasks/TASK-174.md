# TASK-174: Add the directive rule and syntax tree, starting with section

**Epic:** Build pipeline & directive redesign
**GitHub Issue:** #837 — https://github.com/triplecanopy/b-ber/issues/837
**Scope:** b-ber-markdown-renderer, b-ber-grammar-section

## Description

Plan step 1 of [TASK-161](./TASK-161.md).

One side-effect-free markdown-it rule recognises every directive line and
emits real open/close token pairs. The tokens are lifted into a tree.
Problems go to `env.diagnostics` with spans, and nothing throws mid-parse.

Start with `section` alone, behind the existing renderer, so the golden output
is unchanged. This step also builds the diagnostics machinery the spec
requires: spans, notes, anchoring to the construct, the reporter format.

## Subtasks

- [ ] The directive rule, per the spec's "Lines and fences" and "Grammar"
- [ ] The tree, and `section` rendered from it
- [ ] Diagnostics with spans and notes; the spec's tests 1–6 for the codes `section` can raise
- [ ] Flip TASK-153's duplicate-id defect test (the false `Duplicate [id]` after a paragraph)
- [ ] A script that runs the parse over the GitLab projects (`gitlab-projects/_survey/`), per the spec's test 9
- [ ] Golden output unchanged

## Notes

- Design: [TASK-161](./TASK-161.md), "The pieces" and "Directive syntax".
- Doesn't depend on [TASK-160](./TASK-160.md).
