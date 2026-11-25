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
  fixed;
- **a directive block inside a list item no longer drops the rest of the
  document.** Added 2026-11-25, after TASK-174 found it (TASK-161's list is
  closed, so this task extends it). Today a block opened in a list item
  swallows the rest of that item's range, and markdown-it never parses what
  follows: later items, the text after the list, and the rest of the file
  vanish, with no warning, even when the `exit` is correctly inside the item.
  Under the spec the block closes at its `exit`, or at the end of its list
  item if it has none (`unclosed-block`), and everything after it renders. No
  GitLab project puts a directive inside a list today, so no book's output
  changes; the fix is pinned by a test, not the golden snapshot.

  ```
  ::: chapter:c1
  - First item.

    ::: pullquote:q1
    A quote inside the list item.
    ::: exit:q1

  - Second item.

  After the list.
  ::: exit:c1
  The last paragraph.
  ```

  Today's output ends after the pullquote. "Second item.", "After the
  list." and "The last paragraph." are missing.

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
- [ ] A test that a block inside a list item loses nothing after it (the example above), with the `exit` inside the item and with none
- [ ] The GitLab survey script: no project that builds today gains an error

## Notes

- Design: [TASK-161](./TASK-161.md), "Directive syntax" (including "Intended output
  differences" and "Decisions"), and Findings for the bugs each port fixes.
- Depends on TASK-174.
