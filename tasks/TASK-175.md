# TASK-175: Port the remaining directives to the directive rule

**Epic:** Build pipeline & directive redesign
**GitHub Issue:** #838 — https://github.com/triplecanopy/b-ber/issues/838
**Scope:** grammar packages, parser packages

## Description

Plan step 2 of [TASK-161](./TASK-161.md).

Port each directive family to the rule and the tree, one per commit: the
figure family, pullquote, dialogue, gallery and spread, footnotes, front
matter, and `media` as a node resolved per target. Then delete `state.cursor`.

Each intended output difference in the spec lands in its own commit, with the
golden snapshot regenerated so the PR shows it:

- consecutive inline directives stop swallowing each other (the kitchen-sink
  gallery's figures 02 and 03 appear);
- `pullquote` keeps its `citation` and stops being a `chapter`;
- `epub:type` keeps its family when `classes` is given;
- attribute values are escaped;
- a lone word no longer swallows the next attribute;
- speaker lines and gallery items after their block's `exit` are plain text;
- crossed exits and unclosed pullquotes produce balanced output;
- an unmatched `exit` is ignored, which fixes `international-art-english-e-book`'s
  crash and changes `the-world-is-unknown`, whose source typo should be
  fixed.

## Subtasks

- [ ] Figure family
- [ ] pullquote and blockquote
- [ ] dialogue
- [ ] gallery and spread
- [ ] footnotes
- [ ] front matter
- [ ] `media` as a node
- [ ] Delete `state.cursor`
- [ ] One commit per intended output difference, with the snapshot
- [ ] The GitLab survey script: no project that builds today gains an error

## Notes

- Design: [TASK-161](./TASK-161.md), "Directive syntax" (including "Intended output
  differences" and "Decisions"), and Findings for the bugs each port fixes.
- Depends on TASK-174.
