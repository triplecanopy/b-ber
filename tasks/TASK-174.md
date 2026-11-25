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

- [x] The directive rule, per the spec's "Lines and fences" and "Grammar"
- [x] The tree, and `section` rendered from it
- [x] Diagnostics with spans and notes; the spec's tests 1–6 for the codes `section` can raise
- [x] Flip TASK-153's duplicate-id defect test (the false `Duplicate [id]` after a paragraph)
- [x] A script that runs the parse over the GitLab projects (`gitlab-projects/_survey/`), per the spec's test 9
- [x] Golden output unchanged

## Notes

- Design: [TASK-161](./TASK-161.md), "The pieces" and "Directive syntax".
- Doesn't depend on [TASK-160](./TASK-160.md).

## Findings

### 2026-11-25: the approach, and why

The code is in `b-ber-markdown-renderer/src/directives/`, built as a second
entry (`dist/directives`) that imports no `State`. "Starting with section"
means every block b-ber-grammar-section rendered: the frontmatter, bodymatter
and backmatter sets, `epigraph` and `subchapter` among them.

**Three pieces:**

1. **The block rule** (`rule.ts`) claims exactly the lines b-ber-parser-section
   claimed for grammar-section: the same regex, registered first before
   `fence`, so it sits where `container_section` sat in the rule order and the
   old plugins see the same lines as before. Silent mode only answers yes or
   no.
2. **The structure pass** (`structure.ts`), a core rule after `block`, reads
   every directive line in the document and pairs blocks by the spec. It
   reads lines from three places: tokens claimed by the rule or by an old
   plugin, lines an old figure-family plugin swallowed as a caption (bug 11),
   and paragraph or setext-heading text. It matches each `exit` against the
   open blocks of its Markdown container (document, list item, blockquote,
   footnote). Its diagnostics go to `env.diagnostics`, in source order. It
   rewrites the rule's tokens into real pairs (`directive_open` /
   `directive_close`).
3. **The tree** (`tree.ts`) is lifted from the final tokens into
   `env.tree`. Directive nodes are `{ type: 'directive', name, id, attrs,
   position, children, … }`. The same node object sits on the open and close
   tokens' `meta`. In the build, section is rendered from these tokens. The
   XHTML is built from the tree in TASK-176.

**Coexistence: the rule reproduces the old token shape, then a pass
restructures it.** Each claimed line still opens a container holding the rest
of its range (b-ber-parser-section's shape, bug 4), and the structure pass
then rewrites those tokens. The parse depends on token *levels* in ways a
real pair would change:
- markdown-it hides the paragraphs of a tight list by level, so a paragraph
  after a directive inside a list item is a `<p>` today only because the
  directive raised the level;
- `maxNesting` (100) cuts a file off by level (no GitLab file comes close:
  the deepest reaches level 53);
- the container sets `state.line` to the end of the range (quirk 1 below).

None of these occurs in the GitLab projects. Reproducing the shape makes the
output identical for every input, not just the ones measured.

So the parse runs exactly as before. The pass then:
- turns an opener's open token into `directive_open`;
- turns an exit's open token into `directive_exit` and each range-end close
  into `directive_end`, both nesting 0 and render-only, kept where the old
  tokens were;
- inserts `directive_close` tokens where the spec closes a block: at its
  `exit`, at a crossed exit for the inner blocks, or at the end of its
  container when unclosed.

The render rules call grammar-section's `render`, unchanged, with tokens
shaped as the old parser made them, at the same positions, against the same
`state.cursor`. `directive_close` renders nothing. Output is therefore
identical by construction, quirks included.

**`state.cursor` is kept** (`legacy-host.ts`), because grammar-section's exit
and close rendering, the gallery/spread closing markup, and the dialogue,
gallery, spread and pullquote duplicate checks all read it. The rule adds a
structural id in non-silent mode only, claims an `exit` only when its id is
in the cursor (any other goes on to grammar-pullquote, as before), and throws
the old parser's two errors word for word: `Duplicate [id] …` and
`Missing [id] for [x:start] …`. Those throws preempt the diagnostics in a
build, as they did before; the parse with `pureHost` reports them as
`duplicate-id` and `missing-id` instead.

**The old directives are tracked but not owned.** pullquote, blockquote,
dialogue, gallery and spread openers, and pullquote-claimed exits, take part
in the pairing, so an exit that closes a pullquote is not "unmatched" and
crossing is computed over every block. Their tokens are untouched and are
leaves in the tree, since their containers run to the end of the range.
The spec's "`exit` closes the named block and any blocks still open inside
it" therefore causes no conflict when old blocks nest in new ones or the
other way round. The pairing is a separate pass that sees both, and the
output follows today's renderer. The i26 case (a structural `subchapter`
left open inside an old `spread`, closed by the spread's exit) gives a
`crossed-exit` warning and a `directive_close` at that line.

**The TASK-153 test** moved from grammar-section (which still exports the
old `plugin`, now unused by the build) to the renderer's tests, flipped:
"renders a section straight after a paragraph line". Dialogue, gallery and
spread keep the defect until TASK-175.

### 2026-11-25: verification

- Golden (`npx playwright test --project=cli golden`): 4 passed, unchanged.
  The renderer's own snapshot: unchanged.
- A differential run (a scratch harness, not committed) rendered every
  Markdown file of the GitLab projects (2,639 files) for `epub` and `web`,
  once with `main`'s build and once with this branch's, with each project's
  `src` and `media.yml`. All 5,278 renders were identical: the output (hashed,
  footnote ids normalized), the error thrown (359 renders throw, as on
  `main`), every logger message, and the ids left in `state.cursor`.
- Tests 1–6 for every code a structural block can raise
  (`__tests__/directives.test.js`): 17 codes, each with exact spans, shift
  invariance (5 lines of text, then 2 blocks deep), first line and after
  front matter, CRLF, no boundary carets over every case and the
  kitchen-sink and fixture files, and all codes in one file in source order.
  Test 8 holds: the kitchen-sink gives no errors, and its only warnings are
  `deprecated-name` for each of its 11 `subchapter`s.

### 2026-11-25: today's quirks, reproduced

To keep the output identical, these were reproduced and not fixed. Each is a
candidate for TASK-175 or TASK-176:

1. **Content after a block opened inside a list item is dropped.** The
   container sets `state.line` to the end of the document, and the list
   rule takes that as consumed. In `- item\n\n  ::: section:in\n\n  text\n\n::: exit:in\n\nlost\n`,
   neither the exit nor `lost` reaches the output. The diagnostics cannot see
   those lines either. No kitchen-sink file and no GitLab file has a
   structural directive inside a list item. This is content loss, so it should
   probably join TASK-161's "Intended output differences".
2. **An opener with `exit` anywhere on its line renders as a close, or
   throws.** grammar-section's `MARKER_CLOSE_RE` is unanchored, so
   `::: chapter:c title:"the exit"` takes the exit path with no id and
   throws a `TypeError` in `htmlId`.
3. **An unclosed block whose opener has attributes is never closed** in the
   output, and its id stays in `state.cursor` for the rest of the build.
   `closeElement` splits the info on `:` and gets `c classes` as the id.
4. The `START` comment's line is 0-based (TASK-161 bug 18).

### 2026-11-25: where the diagnostics fall short of the spec

- In a build, positions are offsets into the source after `prepare()` (the
  `media` pre-pass), not the author's file. A `media` line whose replacement
  adds caption lines shifts the lines after it. TASK-175 makes `media` a tree
  transform. `scripts/parse-corpus.js` parses the raw files.
- `duplicate-id` is reported when the second opener is structural; the first
  may be any block. The old plugins' own ids are checked when they are ported.
- Attribute diagnostics are for structural blocks only. A quoted value
  written after a space (`title: "A b"`) gives `missing-value` and then one
  `stray-word` per word, which is accurate but noisy.
- `unknown-name`'s note ("the line is rendered as text") is given only when
  the line is text. `::: junk figure:f …` is still claimed by grammar-image
  (bug 12), and the warning comes without the note.

### 2026-11-25: the GitLab projects (test 9)

`node packages/b-ber-markdown-renderer/scripts/parse-corpus.js ../gitlab-projects`,
after a build: 263 projects, 2,489 Markdown files, all parsed.

| Code | Found | Survey (TASK-161, 2026-11-25) |
| ---- | ----- | ----------------------------- |
| `crossed-exit` | 19 in 17 projects | 19 in 17 |
| `unclosed-block` | 3 in 3 projects | 3 in 3 |
| `unmatched-exit` | 11 in 10 projects | 11 in 10 |
| `id-characters` | 0 | 0 |
| `missing-id` | 0 | 0 |
| `duplicate-id`, `exit-missing-id` | 0 | (duplicate block ids within a file: 0) |
| `unknown-name` | 5 in 2 projects (`image`, `soundcloud`, `soundcloud-inline`) | 5 in 2 |
| `deprecated-name` | 836 in 196 projects | `subchapter`: 835 in 195 |
| `draft-name` | 141 in 66 projects | `credits`: 133 in 66, plus `seriespage` |
| `unknown-attribute` | 53 in 21 projects, all `pagebreak` | not surveyed |
| `stray-word` | 11 in 6 projects | not surveyed |
| `missing-value` | 2 in 2 projects | not surveyed |
| `exit-trailing-text` | 1 in 1 project | not surveyed |

There are no errors, so no project that builds today gains one.

**Differences, explained:**
- The script finds 263 projects to the survey's 262. The extra one is
  `b-ber-template-new`, whose `config.yml` is a template that does not parse
  as YAML (`%BASE_PATH%`). The survey skipped it; the script reads only its
  `src:` line. Its one `subchapter` accounts for the 836th `deprecated-name`.
- The attribute warnings are new. They are real author mistakes the renderer
  drops in silence today:
  - `classes="titlepage"` is a stray word (written with `=`);
  - in `title: "…"` and `classes: "break-after"`, a space after the colon
    leaves the value empty;
  - an exit carries `classes:"break-after"`;
  - `pagebreak` is not a block attribute. The renderer already warns about
    it.
