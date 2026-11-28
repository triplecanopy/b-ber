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

- [x] The element builder and serializer
- [x] Directive renderers build elements, not strings
- [x] Golden output unchanged, apart from differences TASK-175 already listed
      (and the two below, each in its own commit with the snapshot)
- [x] Decide whether real open/close pairs belong here: they do not
      (Findings, "Real open/close pairs")

## Notes

- Design: [TASK-161](./TASK-161.md), "The pieces".
- Depends on TASK-175.

## Findings

### 2026-11-28: the approach

**Where the builder lives.** `b-ber-markdown-renderer/src/xhtml.ts`: `h(tag,
attrs, children)`, with `h.text`, `h.raw`, `h.comment`, `h.fragment`, and
`serialize`. It imports nothing, so TASK-179 moves it as it is. The node types
(`XhtmlNode`, `XhtmlBuilder`) and the render API (`BlockRender`,
`InlineRender`, `BlockDirective`, `InlineDirective`, `ClosedBy`) are declared
in b-ber-lib's `markdown.ts`, beside `DocumentEnv` and the rest of what the
grammars and the renderer share: the grammars cannot depend on the renderer,
which depends on them. So the renderer hands each grammar `h`, as TASK-161's
sketch has it (`render: ({ node, children, h }) => …`). No new dependency.

**Rendering from the tree.** `directives/render.ts` replaces markdown-it's
`renderer.render`, so every render, a nested one included, walks the tree
lifted from its tokens:

- a block is built whole by its family's render, from its node and its
  rendered children. The render is called at the opener and returns what
  builds the block once the children have rendered, so the grammars' warnings,
  errors and what they collect (figures, footnotes, the citation's render)
  happen in the order they always have. The differential compares every
  logged message, in order;
- a single-line directive is built by its grammar's render from its node;
- Markdown is rendered by markdown-it's own rules, a token at a time, with the
  whole token list and the token's index, because rules read their neighbours
  (`renderToken`'s line breaks, the footnote rules). A pair's open and close
  render around its children. The tree holds every token once, in order, so
  the Markdown's output is markdown-it's by construction.

The structure pass already made the token list balanced (one
`directive_close` per block, where it closes), so the tree needed only to
remember each pair's close token and each block's family and `closedBy`.

**The grammars.** Each block family's `render` builds its whole block: the
start comment, the element with its children, the close and the end comment.
b-ber-grammar-section's `close`, which drew every block's close and had to
match the gallery's and the spread's full-bleed scaffolds by hand, is gone;
the end comment every block writes moved to b-ber-grammar-attributes
(`blockEndComment`), with `attributesList` (the attributes `attributesString`
writes, unescaped) and `commentLines`. The inline grammars build their
thumbnails, embeds and fallbacks as elements. The b-ber-lib markup helpers the
iframe grammar used (`renderPosterImage`, `renderCaption`,
`createUnsupportedInline`) are copied into it, as TASK-177 did for
`ensurePoster`; b-ber-lib's are left unused for TASK-173.

Each grammar's change is confined to its own package plus one line in the
renderer's `src/index.ts`, so the consolidation folds them in as they are.

**Byte-identical by construction.** Whitespace between tags is kept as text
nodes, exactly as the template strings had it (`nl(8)` and the like), since
the reader can see whitespace text. The string renders were adapted to the
new API first (`legacy-render.ts`), then each grammar was converted, one per
commit, and the adapter was deleted with the last.

### 2026-11-28: what is still markup, and why

`raw` nodes are what a directive does not build itself:

- **markdown-it's output**: a caption, a citation, a resolved `media` line
  that no grammar claims. And the Markdown around the directives, whose pairs
  markdown-it balances;
- **b-ber-templates' figure markup** (`figure-inline`, and the list of
  illustrations' pages). Not converted: b-ber-templates sits below the
  grammars and its figure templates are shared with b-ber-tasks' `loi`, so
  building them needs the builder somewhere b-ber-templates can import it
  (b-ber-lib, or b-ber-templates itself), not in the renderer. Each template
  writes a whole fragment from one function, so it is not the
  open-in-one-call problem. Where the figure templates go is TASK-179's call;
  the figure data the grammars collect still carries markup strings for them
  (`attrString`, `sourceElements`, `commentStart`), unchanged;
- **entities**: the citation's `&#8212;&#160;`.

Footnotes and front matter are not directives (TASK-175's Findings): the
footnote rules render markdown-it token pairs, and the notes page is built
from tokens, so the tree renders them like any Markdown. Gallery items and
speaker lines are token rewrites during the parse, likewise.

The grammars' `render` is no longer a markdown-it render rule, so their
exported `plugin`s (the old `b-ber-parser-*` plugins, unused by the build
since TASK-175) no longer render with them. Their tests that rendered through
the old parsers went. TASK-179 deletes the parser packages.

### 2026-11-28: the serializer writes each thing one way

- attributes `name="value"`, one space before each, escaped as `Html.escape`
  escapes (`& < > " '`);
- a void element `<img …/>`, as b-ber's own markup writes it (markdown-it
  writes ` />`, and its output is not the serializer's);
- every other element opened and closed, even when empty;
- text escapes `& < >`;
- a comment `<!-- value -->`, with `--` written `- -`, since XML forbids it.
  No GitLab output and no kitchen-sink output has `--` inside a directive's
  comment (an id or a file name with `--`), so nothing changes; a
  `_markdown/a--b.md` would have given malformed XML.

### 2026-11-28: intended output differences

Two, each its own commit with its tests and, where kitchen-sink changes, the
regenerated golden snapshot. GitLab counts are renders (of 17,423) whose
output changes.

| Difference | GitLab | Kitchen-sink |
| ---------- | ------ | ------------ |
| the directives' tags are written one way, so that building them as elements changes nothing (`7661bbe8`) | 2,862 renders, 464 files, 185 projects; every one identical once its tags are written one way | the dialogue's, the gallery's, the spreads' and the logo's tags (25 files) |
| an opener with `exit` anywhere in its line opens its block (`d3af4152`) | none | no change |

**Tags, written one way.** Done in the string renders, before any was
converted:

- one space before each attribute: `<section id="g"  class=…>` (dialogue,
  gallery, spread), `<div  class=…>` (spread), `<div id=…  class=…>` (the
  unsupported fallbacks) and `<iframe src=… >` (an iframe with no other
  attributes) lose a space;
- no space before `/>`: the logo's `<img … />`;
- an iframe is opened and closed: audio and video's third-party embed wrote
  `<iframe src=… />`, which does not close in HTML, the web target's parser;
- the values written unescaped are escaped: a media file's or a remote
  source's `src`, an aspect ratio in a class, a Vimeo id and a logo's path.

Checked by comparing the full output of every render before and after, with
every start tag of both rewritten one way (attributes re-spaced, values
unescaped): all 2,862 differing renders identical after it, and every other
field (errors, messages, figures, footnotes, guide, front matter, remote
assets) identical. The same comparison without unescaping values is also
identical, so no escaped value and no self-closed iframe occurs in GitLab.
Vimeo's multi-line `<iframe>` (125 renders, 106 files) is one line now.

**`exit` in an opener's line.** TASK-174's quirk 2: `exit` was matched
anywhere in the line, so `::: chapter:c title:"exit:here"` drew a stray
`</section>` and then the block's contents (or failed with a `TypeError`
when no `exit:id` followed), and a pullquote drew neither its open nor its
close. It was the last markup a directive wrote that its element tree could
not hold: until this commit the section grammar kept it as raw markup. The
directive rule tells exits from openers, so the grammars no longer look. No
GitLab project has such a line.

### 2026-11-28: real open/close pairs

**They do not belong here.** TASK-175's Findings left them to this task "when
the XHTML is built from the tree"; having built it, they are not needed for
it, and they are a change to the parse, not the output:

- the tree render needs a balanced token list and a node per block. The
  structure pass already gives both, over the old parsers' token shape, so
  the tree render works with no output difference;
- real pairs (a block tokenizing only up to its `exit`) change token levels,
  which decide tight-list paragraphs and markdown-it's `maxNesting` cut-off
  (TASK-174's Findings). No GitLab file would change, but it is a parse
  change with its own risk and its own test, which TASK-161 puts in piece 1,
  the rule, not in piece 4, the rendering;
- TASK-178 builds `bber check` on the parse's diagnostics in parallel. Changing
  the parse under it here would make the two branches disagree about the very
  structure pass both read.

What they would buy: the structure pass could drop its token rewriting
(`directive_exit`, `directive_end`, `contentEnd`) and the rule its
reproduction of the old shape. That is a follow-up for after TASK-178, before
or with TASK-179; it is not filed.

### 2026-11-28: verification

Every commit: `npm test` (171 suites; 1,885 tests at the end), `npm run
typecheck`, the golden test (5 passed, unchanged except where the table above
says), and the differential.

**The differential** is TASK-175's and TASK-177's scratch harness (not
committed), run after each commit against the commit before:

- **every Markdown file** of the GitLab projects, each in a fresh build, for
  all seven targets: 17,423 renders, comparing the XHTML, each figure's page
  through the figure templates (1,768), the footnotes, guide items, front
  matter, remote assets, the error thrown (358) and every warning and error
  logged, in order (7,503);
- **every project's documents in turn**, 1,841 runs (263 projects × 7
  targets), with one footnote numbering per run and each document's figures
  and notes counted from the ones before, so that book-wide numbering and
  figure order are compared too. TASK-165 made the render task take a build
  context, so this mode now runs the render task's loop over
  `renderDocument` itself instead of calling the task; 140 runs throw, as
  before.

Every commit but the two in the table was identical in both modes. Those two
differ only as described. The real-CLI harness (TASK-165's) was not needed:
nothing in b-ber-tasks changed.

**Coverage**, from the full outputs: the Vimeo player and the unsupported
fallback (125 renders each), full-bleed galleries (88) and spreads (559),
inline audio (439) and video (162), iframes (19), citations (581) and
dialogue (329). The logo occurs in no GitLab project; the kitchen-sink's
golden output covers it.

### 2026-11-28: outside the grammars and the renderer

- **b-ber-tasks: unchanged.** `renderDocument` returns the XHTML as a string,
  as before.
- **b-ber-lib:** the node and render types in `markdown.ts` and their exports;
  in `utils`, `createUnsupportedInline` lost a space (the tag commit) and is
  now unused, with `renderPosterImage` and `renderCaption`.
- **b-ber-markdown-renderer's `src/index.ts`:** the `directives` options take
  `blocks` (each family's `BlockRender`) instead of `legacy` and `close`, and
  `inline` takes each grammar's `InlineRender`, from the same code. Nothing else in it changed,
  so it meets TASK-178's changes there (`host`, `withDefaults`, `parse`) only
  at that call.
- **The directive rule's options:** `legacy`, `close` and the string
  `LegacyRender` are gone; `blocks` replaces them. `ResolvedMedia` moved to
  `directives/render.ts`. `exitFamilyOf` was removed from `structure.ts`.
- **The tree:** a `TokenNode` pair keeps its `close` token; a
  `DirectiveNode` gets `family`, `closedBy` and, for `media`, `media`, set
  when it is lifted. A close token with nothing open is now a leaf, so that it
  still renders.
