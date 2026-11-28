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

## Findings

### 2026-11-28: the plan

The ports follow TASK-174's method, so each one changes no output by
construction:

1. **Each port moves a directive's parse into the directive rule, with
   today's token shape**, and renders it from the node. The block plugins'
   containers run to the end of their range today, and the parse depends on
   token levels (TASK-174's Findings), so the rule reproduces that shape. The
   structure pass already pairs every block and stays the one place that
   does.
2. **Each intended output difference is its own commit after the ports**,
   with the snapshot. Pairing is in one place by then, so most of them are a
   change to how a pair renders, not to the parse.
3. **Real open/close pairs come last.** The block rule scans for its `exit`
   inside its Markdown container and tokenizes only up to it. That is the
   list-item fix: no output changes except the content that is dropped
   today. It also makes the reproduced shape, and most of the structure
   pass's rewriting, unnecessary.

Each port is checked by a differential run over the GitLab projects (every
Markdown file for all seven targets, before and after the commit), as
TASK-164 did, and by the golden test.

Order: pullquote and blockquote, dialogue, gallery and spread, the figure
family, footnotes, front matter, `media`; delete `state.cursor`; then the
intended differences; then real pairs.
