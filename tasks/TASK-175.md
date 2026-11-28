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

- [x] Figure family
- [x] pullquote and blockquote
- [x] dialogue
- [x] gallery and spread
- [x] footnotes: nothing to port (Findings, "footnotes and front matter")
- [x] front matter: nothing to port (same)
- [ ] `media` as a node
- [x] Delete `state.cursor`
- [x] One commit per intended output difference, with the snapshot
- [x] A test that a block inside a list item loses nothing after it (the example above), with the `exit` inside the item and with none
- [x] The GitLab survey script: no project that builds today gains an error

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

### 2026-11-28: the ports

Every directive is parsed by the directive rule; no `b-ber-parser-*` plugin
is registered. Each grammar still draws its own markup, from tokens shaped as
its old parser made them. The renderer passes in each block family's opener
`render`, b-ber-grammar-section's and b-ber-grammar-pullquote's new `close`,
and each single-line directive's own `validate` and `render`.

- **Blocks** (pullquote and blockquote, dialogue, gallery and spread) are
  claimed by the old plugins' regexes, in their old order (`registry.ts`'s
  families). The parse passes the old parsers ran once a block's tokens were
  complete still run: the speaker lines (`speakers.ts`, copied) and the
  gallery items (exported from b-ber-parser-gallery, run through a new
  `afterBlock` hook, because they read State).
- **Single-line directives** (figure, audio and video, vimeo, iframe, logo)
  are claimed by asking each grammar's `validate`, as b-ber-parser-figure
  did, and take their caption with that parser's scan. Each is one
  `directive_inline` token and an inline node in the tree, with its caption.
- **The tree** now has a node for every directive.

Each port was checked with a differential run over the GitLab projects: every
Markdown file rendered for all seven targets (17,423 renders) with the
commit before and the commit after, plus each figure's page through the
templates (1,761), comparing the output, the error thrown and every warning
and error logged. Every port was identical.

### 2026-11-28: `state.cursor`, deleted

The structure pass pairs every block and puts one `directive_close` where it
closes: at its `exit`, at an outer block's `exit` that crossed it, or at the
end of its Markdown container. **Every close is drawn there**, by the
grammar's `close`, from the node; the exit line and the range's end draw
nothing. Duplicate ids are checked per file in the renderer's host, for
pullquotes and blockquotes too. b-ber-grammar-renderer's `validateOpen`
records nothing, and the build no longer calls it.

The cursor held an unclosed block's id for the rest of the build. The
differential renders each file in a fresh build, so it cannot see that: 42
files in 13 projects left an id behind, all of them renders that threw
partway, and no other file in those projects reuses the id.

### 2026-11-28: the intended output differences

Each is its own commit, with its tests and, where kitchen-sink changes, the
golden snapshot. GitLab counts are files whose output changes.

| Difference | GitLab | Kitchen-sink |
| ---------- | ------ | ------------ |
| an opener straight after a paragraph line no longer throws `Duplicate [id]` (dialogue, gallery, spread; TASK-174 fixed it for sections) | none | no change |
| consecutive single-line directives stop swallowing each other | none | the gallery's figures 02 and 03 appear; figure 01 loses its bogus caption |
| `pullquote` keeps its `citation` and stops being a `chapter` | 49 files | its pullquote's class |
| `epub:type` keeps its family when `classes` is given | 249 files, every change restoring a missing family | one subchapter |
| attribute values are escaped | 11 files (`&` in iframe URLs, `'` in alt text) | no change |
| a lone word no longer swallows the next attribute | none | no change |
| speaker lines and gallery items after their block's `exit` are plain text | none | no change |
| crossed exits and unclosed pullquotes produce balanced output, **and** an unmatched `exit` is ignored | 23 files: 6 that crashed now build, every one balanced | no change |
| every block left open closes at the end of its container | none | no change |
| a block inside a list item no longer drops the rest of the document | none | no change |

**Two of these landed in one commit.** A crossed block's own later `exit`
closes nothing. Ignoring unmatched exits on their own would drop that block's
close; balancing crossed exits on their own crashed `the-world-is-unknown`,
whose typo'd exit closed its blockquote by prefix and left the pairing
thinking it unclosed. Together, every block closes exactly once.

**`the-world-is-unknown` needs a source fix**, as TASK-161 expected: its
`::: exit:affirmations-pullquotes` closes nothing now, so the rest of the
essay is inside the blockquote `affirmations-pullquote`. The exit should
read `exit:affirmations-pullquote`.

**The list-item fix is one line, not real pairs.** The rule set
`state.line` to the end of its range after tokenizing the rest of it. In a
list item or a footnote, markdown-it's tokenizer stops where the indentation
drops, so the rule reported the rest of the document as consumed. It now ends
where the tokenizer stopped. At the top level and in a blockquote the
tokenizer always reaches the range's end, so nothing else changes. Real
open/close pairs (blocks tokenizing only up to their `exit`) would change the
parse's token levels, which tight lists and `maxNesting` depend on, and are
not needed for any of the differences above. They belong with TASK-176, when
the XHTML is built from the tree.

### 2026-11-28: footnotes and front matter

Neither is a `:::` directive or a fork of markdown-it-container:
b-ber-parser-footnotes is a fork of markdown-it-footnote and front matter is
markdown-it-front-matter. Their tokens are real pairs already, which the tree
lifts like any other Markdown. What they do with State (the footnotes list,
guide entries, `spine.frontMatter`) is per-document state, which is
TASK-177's. Nothing here needed porting.

### 2026-11-28: the GitLab survey (test 9)

`scripts/parse-corpus.js` after these changes: 263 projects, 2,489 files,
none that fails to parse, and every count identical to TASK-174's table. No
project that builds today gains an error.

