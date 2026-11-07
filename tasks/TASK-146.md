# TASK-146: Fix footnote links when a note is referenced more than once

**Epic:** EPUB spec compliance
**GitHub Issue:** #721 — https://github.com/triplecanopy/b-ber/issues/721
**Scope:** parser-footnotes

## Description

When a chapter refers to the same footnote twice, every footnote link after
the repeat points to the wrong note, and the last one points nowhere. For this
chapter:

```markdown
A reference footnote.[^ref] The same note again.[^ref] Another one.[^two] An inline note.^[Inline.]

[^ref]: The reference note.
[^two]: The second note.
```

b-ber renders these refs:

| Ref | Shows | Links to | Should link to |
| --- | ----- | -------- | -------------- |
| first `[^ref]` | 1 | note 1 | note 1 |
| second `[^ref]` | 1:1 | **note 2** | note 1 |
| `[^two]` | 2 | **note 3** | note 2 |
| `^[Inline.]` | 3 | **`notes.xhtml#fnundefined`** | note 3 |

EPUBCheck reports the last link as RSC-012 (fragment identifier is not
defined). The misdirected links in between are valid, so no checker catches
them. Readers who tap a note number land on the wrong note.

**Cause.** `parser-footnotes` (adapted from markdown-it-footnote 3.0.1) pairs
refs with notes through a FIFO queue in `Counter`:

- `renderFootnoteOpen` calls `counter.setRef(label)` once per **note**. It
  generates `-<label>-<random hash>` and pushes it.
- `renderFootnoteRef` calls `counter.getRef()` once per **reference** and
  shifts the queue.

The notes are rendered first: the `footnote_tail` core rule hands them to
`grammar-footnotes`, which renders them during the parse. The chapter's refs
are rendered after that. As long as each note has exactly one ref, the queue
lines up. A second ref to the same note takes the next note's id. Every later
ref shifts by one, and the last finds the queue empty, so its id is
`undefined`.

Upstream markdown-it-footnote has no such queue. It derives both ids from
`meta.id` and `meta.subId`, which `footnoteRef` already sets on every token.

**Smaller defects in the same code:**

- Inline `^[…]` notes have no label, so their ids are `fn-undefined-<hash>` and
  `fnref-undefined-<hash>`. They are unique only because of the hash.
- Two refs to one note need distinct `fnref` ids. Today they get distinct ids
  only by accident, because each takes a different note's id.
- The `Counter` is module-global, so the queue is shared across every file in
  a build. Today a chapter can only take more ids than it put in, never fewer,
  so nothing leaks into the next file. That holds only because every note in
  the list has at least one ref.

Found in TASK-144, where a coverage chapter with a repeated reference produced
the RSC-012 error. The kitchen-sink fixture never repeats a reference, which is
why the e2e suite has not caught this. It reproduces on markdown-it 8 and 15.

## Subtasks

- [ ] Replace the queue with ids derived from the token: the note from
      `meta.id` (and its label when it has one), each ref from `meta.id` plus
      `meta.subId`, so repeats get `…:1`, `…:2`. Keep one random component per
      build or per file if cross-file uniqueness needs it, but compute it
      once per note, not per call.
- [ ] Give inline notes a real label (their list index) instead of
      `undefined`
- [ ] Decide where each note's backlink goes when it has several refs. The
      first ref is markdown-it-footnote's behaviour; b-ber today emits one
      hidden backlink per note.
- [ ] Tests in `parser-footnotes`, which has only `test.todo` placeholders:
      single refs, repeated refs, inline notes, and multi-paragraph notes,
      asserting every `href` resolves to an `id` in the notes output
- [ ] Add a repeated reference to the kitchen-sink fixture, and to
      `b-ber-markdown-renderer/__tests__/fixtures/document.md`. The output
      snapshot added in TASK-144 already contains the broken links; this task
      updates it, and the diff should show exactly the corrected hrefs.
- [ ] Check `group_footnotes: true` as well as the default. It changes the
      numbering path in `renderFootnoteCaption` and `Counter#listCounter`.

## Notes

- Reproduce: the output snapshot in
  `b-ber-markdown-renderer/__tests__/__snapshots__/index.test.js.snap` (from
  TASK-144) shows the four refs above.
- Related: TASK-144 (where this was found), TASK-145 (the other renderer bug
  found there).
