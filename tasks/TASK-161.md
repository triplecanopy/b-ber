# TASK-161: Design the directive grammar: one rule, a syntax tree, per-target rendering

**Epic:** Build pipeline & directive redesign
**GitHub Issue:** #809 — https://github.com/triplecanopy/b-ber/issues/809
**Scope:** grammar, parser, markdown-renderer

## Description

This is a design task. Its output is this document, agreed and refined.
Implementation follows in tasks filed from the Plan section. The epic (#792)
holds the sequencing.

### The syntax we must keep

Existing projects' Markdown keeps working unchanged. That is the hard
constraint.

```
::: chapter:ch-01                                  block directive: name:id, then attributes
::: subchapter:ch-01-s2 classes:highlighted        attributes as key:value
::: figure:fig-01 source:image.png alt:"An image"  inline (single-line) directive: no exit
::: exit:ch-01                                     closes the block directive with that id
```

There are about 60 names (`b-ber-shapes-directives`):
- frontmatter, bodymatter and backmatter structure (EPUB Structural
  Semantics);
- inline media: `figure`, `audio`, `video`, `vimeo`, `iframe`, `logo`,
  `media`, each with a `-inline` variant;
- misc: `pullquote`, `blockquote`, `dialogue`, `gallery`, `spread`,
  `epigraph`;
- draft and deprecated sets.

`media`/`media-inline` are replaced per build from `media.yml`.

"Existing projects" was checked on 2026-11-25 against all 262 b-ber projects
in the canopycanopycanopy GitLab group (Findings). A form that none of them
uses is not kept merely because a source accepts it: the single-line
`epigraph`, the `key "value"` attribute form, and the 37 draft-only and
deprecated-only names.

### How markdown-it works (the parts that matter here)

- `md.render(src, env)` is `renderer.render(md.parse(src, env), options,
  env)`. It is **synchronous** from start to finish.
- **Core chain:** normalize → block → inline → linkify → replacements →
  smartquotes → text_join. Each is a rule in a `Ruler` you can insert into.
- **Block phase.** The source is pre-split into per-line offset arrays
  (`bMarks`, `eMarks`, `tShift`, `sCount`). For each line, block rules are
  tried in order, and the first that returns `true` consumes lines and
  pushes tokens.
  - Rules also run in **silent mode** as lookahead. A rule registered with
    `alt: ['paragraph']` is asked "could you start here?" while a paragraph
    is open. A silent-mode rule must have no side effects.
- **The output is a flat `Token[]`.** Each token has `nesting` (+1 opens,
  0 is self-contained, −1 closes) and `level`. The inline phase then fills
  `children` on each `inline` token.
- **The renderer** loops over the tokens, calling
  `rules[type](tokens, idx, options, env, self)` and concatenating the
  returned strings.
- **`env`** is a per-render object passed to every rule. It is the intended
  home for per-document state.

### How b-ber uses it today

- **`b-ber-markdown-renderer`** is a singleton `MarkdownIt` instance. For each
  directive package it calls
  `.use(pkg.plugin, pkg.name, pkg.renderer({ instance, context }))`.
  - `context` is the renderer object itself, read for `context.fileName`,
    which is reassigned on every `render()` call.
  - Before parsing, `grammar-media` splices replacement directives into the
    raw Markdown string.
- **`parser-*`** are forks of `markdown-it-container`: section, gallery,
  dialogue, and a single-line figure rule. There is also a fork of
  `markdown-it-footnote`.
- **`grammar-*`** each export `{ plugin, name, renderer }`. `renderer()`
  returns `{ marker, minMarkers, markerOpen, markerClose, validateOpen, render }`.
  - `grammar-renderer`'s `createRenderer` is a factory supplying a default
    `validateOpen` that pushes `{ id, type }` onto `state.cursor`.
  - `pullquote` cannot use the factory, so it is written out by hand with
    module-level `citation` and `pullquoteIndices`.

| Directive package | Parser | Factory | State it touches |
| ----------------- | ------ | ------- | ---------------- |
| section | parser-section | yes | build, cursor (add/remove) |
| pullquote | parser-section | no | (module-level state instead) |
| dialogue | parser-dialogue | yes | |
| gallery | parser-gallery | yes | build |
| spread | parser-gallery | yes | build |
| image | parser-figure | | build, src, figures (add) |
| audio-video | parser-figure | | build, src, figures, remoteAssets (add) |
| vimeo | parser-figure | | build, src, figures (add) |
| iframe | parser-figure | | build, figures (add) |
| logo, epigraph | parser-figure | | src |
| footnotes | parser-footnotes | | footnotes (add) |
| frontmatter | markdown-it-front-matter | | guide (add), spine.frontMatter |
| media | (string pre-pass) | | build, media |

### The root problem: the tokens don't describe the structure

Every directive, **including `::: exit:id`**, is parsed as a container
opener, and each container runs to the end of the document. Tokens for two
nested sections:

```
container_section_open " section:a"
  container_section_open " section:b"
    container_section_open " exit:b"
      container_section_open " exit:a"
        paragraph "tail"
      container_section_close " exit:a"     ← every close stacks up at EOF
    container_section_close " exit:b"
  …
```

The real nesting is rebuilt **at render time** from the global
`state.cursor` stack:
- one render call emits `<section>`, and another emits `</section>` when it
  meets an `exit` *open* token;
- the close tokens are mostly ignored;
- gallery and spread closing markup lives in `grammar-section`'s exit
  handler.

So whether the XHTML is balanced depends on bookkeeping across render calls,
not on the parse.

Consequences found so far:
- **A directive straight after a paragraph line throws a false
  `Duplicate [id]`** (pinned in TASK-153). `validateOpen` pushes onto
  `state.cursor` during silent-mode lookahead. It affects `section` and every
  block type it handles, plus `dialogue`, `gallery` and `spread`.
- **Pullquote's module-level state** can leak between files and between
  builds.
- **The renderer and validator disagree.** `b-ber-validator` has its own
  parser-combinator grammar, so `bber check` and the build can disagree about
  the same Markdown (#797).

## Design

### Should markdown-it be replaced?

| Option | For | Against |
| ------ | --- | ------- |
| unified / remark (micromark) + remark-directive | A real tree with positions, async transforms, structured diagnostics (vfile), large ecosystem | ESM-only, while b-ber publishes CommonJS through tsdown. Dozens of small packages. b-ber's syntax would need a hand-written micromark extension, the hardest kind to write. Using `remark-directive`'s own syntax (`:::name{#id}`) would break every existing project. |
| MyST (mystmd) | The closest prior art: directives, publishing to HTML, PDF, JATS and docx. Its parser tokenizes with markdown-it and converts the tokens to an mdast tree, then runs transforms. | A different directive syntax. A model to follow, not something to adopt. |
| Pandoc | Its fenced divs (`::: {#id .class}`) are nearly b-ber's syntax, and Lua filters are a proven extension model | An external Haskell binary; wrong fit for an npm tool |
| marked | Simple | Weaker block extension points, no real tree |

**Decision: keep markdown-it as the tokenizer and add the tree layer
ourselves (MyST's architecture).**
- markdown-it already handles the syntax, works with CommonJS, is fast and is
  one dependency.
- The problems above are in how b-ber uses it, not in markdown-it.
- If the unified ecosystem is wanted later, our tree can be converted to hast
  at the end without redoing the parser.

### The pieces

**1. One directive block rule.** It replaces `parser-section`,
`parser-gallery`, `parser-dialogue` and `parser-figure`.
- On `::: name[:id] [attrs]`, it looks `name` up in the directive registry.
- **Inline (single-line) directives** (`figure`, `vimeo`, …) emit one
  `directive` token.
- **Block directives** scan forward for the matching `::: exit:id`, counting
  depth by id. The lines between are tokenized as children with
  `state.md.block.tokenize(state, start, end)`. The rule emits one real
  `directive_open` / `directive_close` pair, so `exit` is no longer a token.
- **Silent mode answers "yes" or "no" and does nothing else.**
- Problems (missing id, unclosed block, duplicate id, unknown name) are
  pushed to `env.diagnostics` with file, line and column, not thrown halfway through
  a parse. The build decides what is fatal. That way one run reports every
  problem in a file.
- Attributes are parsed in one place (today's `grammar-attributes`, moved
  in). It accepts `key:value` only. `key "value"` was dropped on 2026-11-25:
  no project uses it (see "Directive syntax").

**2. A tree.** After `md.parse`, a small pass (about 100 lines) lifts the
flat tokens into a tree. Directive nodes are typed: `{ type: 'directive',
name, id, attrs, children, position }`. Markdown nodes keep markdown-it's
token types.

**3. Transforms over the tree.** They run in order and may be **async**:
- the `media` substitution from `media.yml`, as a tree rewrite instead of
  string splicing;
- collecting figures, footnotes, guide entries and remote assets into the
  render result (TASK-160's typed outputs);
- reading image dimensions without blocking.

**4. Rendering per target.** Each directive definition has a `render`
function, plus optional per-target overrides where markup really differs
(gallery and spread on web and reader, media on reader). Output is **built
as a tree** and serialized once, so the XHTML is well-formed by
construction. That means a small element builder (`h(tag, attrs,
children)`) and an XHTML serializer, not template strings with a `</section>`
emitted from a different function.

**5. Per-document state lives in `env`.** `md.render(src, { fileName,
target, diagnostics: [], … })`. No grammar code imports `State`.

Internally, a directive is defined like this. It is **not a public API
yet**:

```ts
const pullquote: DirectiveDefinition = {
  name: 'pullquote',
  kind: 'block',
  attributes: { citation: optional(string) },
  render: ({ node, children, h }) =>
    h('section', attrs(node), [
      ...children,
      node.attrs.citation && h('footer', {}, [h('cite', {}, ['— ', node.attrs.citation])]),
    ]),
}
```

The open token, the children and the citation are in one place, so there is
no module-level state.

### Parse once, render many

Parsing and transforms that don't depend on the target run once, in
TASK-160's prepare phase. Each target renders from the shared, read-only
tree. Transforms that do depend on the target (`media` substitution) run per
target, on a cheap copy of the affected nodes.

### Directive syntax

This is the specification the one directive rule implements. It was written
from the three sources that define the syntax today: the name lists in
`b-ber-shapes-directives`, the validator's grammar and the renderer's parsers.
They disagree in 36 places (see the 2026-11-24 Findings). The choices where
they disagree were decided on 2026-11-25, after checking each against the 262
b-ber projects on GitLab (Findings, "Decisions"). Rules where all three agree
are stated plainly.

Two principles decide most of the proposals:

- **The renderer is the baseline.** It is what builds books, and the golden
  output (TASK-152) pins it. The validator rejects three of the nine
  kitchen-sink files that build fine, so where the two differ the renderer's
  acceptance wins, unless the renderer's behaviour is itself a defect.
- **Severity follows today's consequence.** A condition is an **error** when
  today's build throws on it, or when its output today is malformed XHTML or
  silently loses content. Otherwise it is a **warning**, and the output stays
  as it is today, unless the change is listed under "Intended output
  differences" below. So a project whose output is correct today keeps
  building. The GitLab survey is the check: no project that builds today
  gains an error.

#### Lines and fences

A **directive line** is a line that markdown-it would let start a block (not
inside fenced or indented code), and that consists of:

| Part | Rule | Today |
| ---- | ---- | ----- |
| indentation | 0–3 spaces, relative to the enclosing Markdown container (list item, blockquote). 4 or more is indented code | renderer: same (markdown-it's `code` rule runs first). Validator: column 0 only; an indented directive is silently treated as text |
| fence | 3 or more `:` | renderer: ≥3. Validator: exactly 3. `grammar-media`: exactly `::: ` |
| after the fence | zero or more spaces or tabs | renderer: any. Validator: exactly one space |
| body | an exit or an opener, below | |
| end | trailing whitespace is ignored. Line endings are normalized to `\n` first, as markdown-it does | validator: CRLF fails |

- The fence length of an `exit` need not match its opener's. Blocks are
  matched by id, not by fence.
- A directive line **may interrupt a paragraph**: `text\n::: figure:f …` is a
  paragraph followed by a directive. Renderer and validator agree.
- A directive line **may be the first line of the file**, or the first line
  after front matter. Front matter is a `---` line on line 1 through the next
  `---` line (markdown-it-front-matter); nothing inside it is a directive. The
  validator gets the first line wrong today (#797).
- A directive line inside a list item or blockquote is a directive (the
  renderer's behaviour; the validator ignores such lines). A block opened there
  must be closed in the same container; at the container's end it is unclosed.

#### Grammar

```
directive-line = indent fence ws* (exit | opener) ws* EOL
fence          = ":::" ":"*
ws             = " " | "\t"
exit           = "exit" ":" id [ws+ text]               ; text: warning, ignored
opener         = name [":" id] { ws+ (attribute | word) }
name           = [a-z] [a-z0-9-]*                       ; must be registered
id             = idchar+                                ; idchar: not ws
attribute      = key ":" value
key            = keychar+                               ; keychar: not ws, ':', '"', "'"
value          = quoted | bare
quoted         = '"' [^"\n]* '"' | "'" [^'\n]* "'"
bare           = [^ \t\n"'] [^ \t\n]*                   ; may contain ':' (URLs)
word           = keychar+                               ; a lone word: warning, ignored
caption        = "::" ws* text EOL "::" ws* EOL         ; only directly after an inline opener
```

The **name is the first token** after the fence. `::: junk figure:f …`
is an unknown directive `junk`, not a figure (today `grammar-image`'s
unanchored regex renders a figure).

#### Names and kinds

Names are lowercase and case-sensitive. The 45 names in `ALL_DIRECTIVES`
are recognized, plus `exit`. The 37 names that are only in `DRAFT_DIRECTIVES`
or `DEPRECATED_DIRECTIVES` are removed from the registry: none of the 262
GitLab projects uses one.

| Kind | Names | Written as |
| ---- | ----- | ---------- |
| block, structural | frontmatter (8, including `epigraph`), bodymatter (11, including `subchapter`, `section`, `article`) and backmatter (8) sets | `::: name:id [attrs]`, content, `::: exit:id` |
| block, misc | `pullquote`, `blockquote`, `dialogue`, `gallery`, `spread` | as above |
| inline (single-line) | `figure`, `logo`, `audio`, `video`, `vimeo`, `iframe`, `media`, and the `-inline` variant of each except `logo` | one line, optionally followed by a caption. No exit |
| draft, also in another set | `credits`, `seriespage` (backmatter) | as a structural block |
| deprecated, also in another set | `subchapter` (bodymatter) | as a structural block |
| reserved | `exit` | only to close a block |

- `epigraph` is in both the frontmatter and misc sets. It is a **structural
  block** (`::: epigraph:id` … `::: exit:id`), which is how the renderer
  treats it today. **The single-line form documented in `grammar-epigraph` is
  not part of the syntax.** It has never rendered (the grammar is not
  registered), and no project uses it; only the kitchen-sink fixture does,
  and the fixture is rewritten to the block form. `::: epigraph` with no id is
  `missing-id`.
- **`subchapter`, `credits` and `seriespage` render as `chapter`**, with the
  original name added as a class, and a warning: today's
  `render [epub:subchapter] is [deprecated]. substituting with [chapter]`.
  This is today's behaviour, kept: `subchapter` is used 835 times in 195
  projects, `credits` 133 times in 66.
- **The 37 draft-only and deprecated-only names are unknown names.** Today they
  render as literal paragraph text (the validator accepts them as blocks), so
  output is unchanged.
- **`pullquote` is not draft-substituted.** It is a misc block with its own
  `citation`. Today its membership of the draft set turns it into a chapter
  and drops `citation` as unsupported. **Proposed**, an intended output
  difference.
- **An unknown name** is a warning, and the line renders as text, as today.
  The validator makes it an error; the renderer says nothing.

#### Ids

- **Every directive needs an id**: `name:id`. An `exit` needs the id of the
  block it closes. A missing or empty id (`::: chapter`, `::: chapter:`) is an
  error. Today the renderer throws for a block with no id and for a bare
  `::: figure`. It renders `::: figure source:x` and `::: chapter:` as literal
  text, and silently drops `::: video source:x`. The validator rejects all of
  them.
- **Characters.** An id is `[A-Za-z0-9_-]+`, which the output uses
  unchanged. Any other character is an error (`id-characters`). Today the
  renderer accepts it and writes it as `-` (`htmlId`: `a.b` → `a-b`), and the
  validator rejects it. No project has such an id, so this breaks nothing,
  and every id reaches the output exactly as written.
- **Uniqueness.** Ids are compared as written.
  - Every directive id is unique **within its file**: they all become `id`
    attributes in one XHTML document.
  - The ids of the directives that get **a page of their own**, `figure`,
    `audio`, `video`, `vimeo`, `iframe`, and a `media` that resolves to one of
    them, are unique **within the book**: each becomes `figure<id>.xhtml` or
    `figure-<id>.xhtml`, in one directory.
  - The `-inline` variants get no page, so they are only unique within their
    file. Reusing an inline figure's id in another file is fine: 30 of the
    GitLab projects do it.
  - Block ids may repeat across files.
  - A duplicate is an error at the second occurrence, with a note at the
    first.

  Today the renderer enforces per-file uniqueness of block ids by accident
  (see Findings), plus a false positive (TASK-153), and never checks
  `pullquote`, `blockquote` or figure ids. The validator checks nothing. With
  the scope above, the GitLab projects have one real collision (in a proof of
  concept), and no duplicate block id within a file.

#### Attributes

| Rule | Spec | Today |
| ---- | ---- | ----- |
| form | `key:value` only. `key "value"` is a warning (`attribute-form`) and is ignored | renderer: `key:value` only; `key "value"` is silently ignored on a block, and a line in that form with no id renders as literal text. Only the unregistered `grammar-epigraph` parses it. Validator: `key:value` only. No project uses it |
| quoting | `"…"` or `'…'`; the other quote may appear inside; no escapes; no newlines | renderer: same, except an unclosed quote runs to end of line. Validator: the other quote is rejected; a quoted value may span lines |
| unquoted value | runs to the next space or tab; may contain `:` | renderer: same. Validator: rejects `:`, so every URL `source` fails |
| unclosed quote | warning; the value runs to end of line | |
| whitespace | one or more spaces or tabs between attributes | validator: exactly one space |
| empty value | `key:""`. `key:` alone is a warning, attribute dropped | renderer drops silently; validator rejects |
| lone word | warning, ignored; the attributes after it parse normally | renderer drops it silently **and** merges it into the next key: `title:foo bar classes:x` loses `classes` |
| boolean | `key:yes` is on, any other value is off (`controls`, `autoplay`, `muted`, `autobuffer`, `loop`) | renderer: same |
| unknown key | warning, dropped. Allowlists are `SUPPORTED_ATTRIBUTES`, with `block` shared by all structural blocks | renderer: same message. Validator accepts anything |
| repeated key | warning at the second; the last value wins | renderer: last wins silently |
| required | `source` on every inline directive except `media`. Missing is an error | renderer throws |
| `media` | takes no attributes; error | renderer: the attributes become part of the id, then `Missing ID [m classes] in media.yml` |
| output | values are text and are escaped in the output | renderer writes them raw: `title:"<b>&"` gives malformed XHTML |

#### Blocks, nesting and `exit`

- A block's content is Markdown, including other directives. **Any directive
  may nest in any block**; the sources impose no other restriction, and the
  spec adds none.
- Two line forms mean something only inside one block:
  - `:: Speaker :: text`, a speaker line, only directly inside `dialogue`;
  - `:: key:value … ::`, a gallery item, only directly inside `gallery`.

  Elsewhere they are ordinary text. Today the renderer goes on applying both
  after the block's `exit`, to the end of the file. The validator accepts
  speaker lines anywhere and rejects gallery items everywhere.
- **`::: exit:<id>` closes the block named `<id>`, and any blocks still open
  inside it.** An `exit` that skips past open blocks closes them implicitly,
  the way an HTML end tag closes unclosed elements inside it, with a warning.
  Today the renderer closes only the named block, which misnests the output,
  and the validator rejects it. Real books rely on it: the i26 title pages
  leave `subchapter:spread-contents` open and close it with the outer
  `spread`'s exit. 19 such exits are in 17 GitLab projects (8 of them i26
  title pages), and they build.

| `exit:<id>` where `<id>` … | Result |
| -------------------------- | ------ |
| is the innermost open block's | closes it |
| is an outer open block's | warning (`crossed-exit`) at the exit, with a note at each inner block's opener. The inner blocks close at this line, then the named one |
| matches no open block (a typo, a block already closed, an inline directive's id) | warning (`unmatched-exit`) at the exit, and the line is ignored. The note names the innermost open block and its line, or says none is open, or says the id belongs to a single-line directive. Today it depends on context: inside an open pullquote or blockquote it closes that block (`the-world-is-unknown`'s typo `exit:affirmations-pullquotes`), otherwise `grammar-pullquote` crashes with a `TypeError` (`international-art-english-e-book` fails to build). 11 in 10 GitLab projects |
| is missing | error at `exit` |

- **An unclosed block** is a warning at its opener. It closes at the end of
  its Markdown container (end of file at the top level). That is today's
  behaviour for structural blocks, made uniform: today an unclosed
  `pullquote` is left open in the output. 3 GitLab projects leave a block
  open to the end of the file, one of them a published book
  (`who-belongs-to-the-land`), so it stays a warning.

#### Inline directives and captions

An inline directive occupies one line. A caption, if any, is exactly the
next two lines, at column 0:

```
::: figure:fig-01 source:image.png alt:"An image"
:: The caption, inline Markdown, one line
::
```

- The caption line starts with exactly two colons. A `:::` line is never a
  caption. Today `parser-figure` treats any following line starting with `::`
  as a caption marker, so **consecutive figure lines swallow each other**: the
  kitchen-sink gallery's three figures render as one (Findings).
- No space is needed after `::` (renderer; the validator requires one).
- A caption line with no closing `::` line is a warning. Both lines render as
  text, as today.

#### `media`

`media` and `media-inline` are parsed like any other inline directive, into a
node:

```
{ type: 'directive', name: 'media', inline: false, id: 'm', attrs: {}, position }
```

It takes no attributes and no caption of its own. It is **resolved per target
at render time**, on a copy of the node (TASK-160's parse once):

1. Look up `media.yml[id][target.name]`. The target name is the frozen
   public name (`epub`, `mobi`, `pdf`, `web`, `reader`, `sample`, `xml`); it
   is the only key used.
2. The entry is `{ type, caption?, ...attrs }`. The node becomes the directive
   `type` (with `-inline` if the node is `media-inline`), with the **same id**,
   `attrs` (values converted to strings), and `caption` parsed as inline
   Markdown.
3. `type` must be an inline name other than `media`. The resolved directive is
   then checked like a written one: required and unknown attributes.

What resolution needs: the node's id and inline flag, the target name, the
parsed `media.yml` (`Project.media`), and the directive registry. Its
diagnostics are anchored at the `media` line, with a note naming the
`media.yml` key path (`m.web.type`).

- **A missing target key is an error when that target is built**, as today.
  `bber check` doesn't know which targets will be built, so there it is a
  warning. Most entries define only some targets: 108 of the 136 entries in
  the GitLab projects define `epub`, `mobi` and `reader` and nothing else.
- **YAML merge keys (`<<`) keep working.** 18 entries use them.
- A non-inline `media` id shares the page-figure id space (unique within the
  book), since it renders as one.

This replaces the string pass, which differs today in these ways:
- it recognizes only exactly `::: ` at column 0;
- it misses a `media` line that is the last line of a file without a trailing
  newline (unless it is the only line);
- it rewrites inside fenced code;
- it never validates `type`;
- it writes values unescaped into `key:"value"`.

#### Diagnostics

Every problem is a diagnostic pushed to `env.diagnostics`; nothing is thrown
mid-parse. One run reports every problem in a file.

```ts
interface Diagnostic {
  code: string                         // the kebab-case codes below
  severity: 'error' | 'warning'
  message: string                      // states the problem, not the parser's expectation
  file: string
  span: { start: number; end: number } // offsets into the normalized source, end exclusive
  notes?: { message: string; file?: string; span?: { start: number; end: number } }[]
}
```

- **Line and column** are derived from `span.start`, 1-based, with columns
  in UTF-16 code units, as tsc and ESLint count them. Normalizing `\r\n`
  changes no line or column.
- **The reporter** prints `file:line:col - severity code: message`, then the
  source line with the span underlined (`^^^^`), then each note the same way.
  An editor highlights the same span.

  ```
  _markdown/ch-01.md:3:5 - warning unknown-name: Unknown directive `chaptr`. Did you mean `chapter`?
    3 | ::: chaptr:ch-01
      |     ^^^^^^
  ```
- **Every diagnostic is anchored to the construct it is about.** Never to a
  document boundary, a line's newline, or where a parser backtracked to. A
  span never starts at offset 0 or at the end of the text unless its construct
  does. It is never empty, and never only whitespace.

| Code | Severity | Span | Message (example) and notes |
| ---- | -------- | ---- | --------------------------- |
| `unknown-name` | warning | the name | Unknown directive `chaptr`. Did you mean `chapter`? Note: the line is rendered as text |
| `draft-name` | warning | the name | `credits` is a draft EPUB structural semantic and is rendered as `chapter` |
| `deprecated-name` | warning | the name | `subchapter` is deprecated and is rendered as `chapter` |
| `missing-id` | error | the name, plus `:` if present | `chapter` needs an id: write `chapter:<id>` |
| `id-characters` | error | the id | The id `a.b` may only contain letters, digits, `_` and `-` |
| `duplicate-id` | error | the second id | The id `a` is already used. Note at the first (may be in another file, for page figures) |
| `unknown-attribute` | warning | the attribute, key through value | `figure` has no attribute `bogus`; it is ignored |
| `duplicate-attribute` | warning | the second attribute | `classes` is given twice; the last value is used. Note at the first |
| `missing-value` | warning | the key and colon | `classes` has no value; write `classes:""` (for a boolean: `autoplay:yes`) |
| `unterminated-quote` | warning | the opening quote to end of line | The value of `title` opens a quote that is not closed on this line |
| `stray-word` | warning | the word | `extra` is not an attribute; attributes are written `key:value` |
| `attribute-form` | warning | the key through the closing quote | `caption "…"` is ignored; write `caption:"…"` |
| `missing-attribute` | error | the name and id | `figure:f` needs a `source` attribute |
| `missing-asset` | error | the `source` value | No image `x.png` in `_images/` |
| `unclosed-block` | warning | the opener line, fence to end | `chapter:a` is never closed; it ends at the end of the file (or: of the list item at line N). Note: add `::: exit:a` |
| `unmatched-exit` | warning | the exit line, fence to end | `exit:zzz` matches no open block. Note at the innermost open block's opener ("`chapter:a` is open here"), or "no block is open", or "`figure:zzz` is a single-line directive and has no exit" |
| `crossed-exit` | warning | the exit line | `exit:a` also closes `section:b`, which is still open inside `chapter:a`. Note at `section:b`'s opener: add `::: exit:b` |
| `exit-missing-id` | error | `exit` | `exit` needs the id of the block it closes |
| `exit-trailing-text` | warning | the trailing text | Text after `exit:a` is ignored |
| `unclosed-caption` | warning | the caption line | The caption is not closed; add a line containing only `::` |
| `media-attributes` | error | the attributes | `media` takes no attributes; set them in `media.yml` under `m.<target>` |
| `media-unknown-id` | error | the id | `media.yml` has no entry `m` |
| `media-missing-target` | error when building that target; warning in `bber check` | the id | `media.yml` entry `m` has no `pdf` key. Note: the `media.yml` path |
| `media-bad-type` | error | the id | `media.yml` `m.web.type` is `chapter`; it must be an inline directive |

**Tests the implementation must have:**

1. One test per code. It asserts the code, severity, message, and the exact
   start and end `line:col` of the span and of each note.
2. **Shift invariance.** Every case is run again with 5 lines of plain text
   prepended and nested 2 blocks deep. Every span moves by exactly the
   inserted lines, and its column is unchanged. This is the test that
   catches anchoring to a backtrack point.
3. **First line.** Every case is run with its construct on line 1 and right
   after front matter; the diagnostics are the same, shifted (#797).
4. **No boundary carets.** Over every case and fixture, no span starts at
   offset 0 or at the text's length unless the construct starts there. No
   span is empty, and `text.slice(start, end)` starts with the token the
   message names.
5. **All problems reported.** One file with one instance of every code yields
   all of them, in source order.
6. **CRLF.** The same input with `\r\n` gives identical `line:col`s.
7. **Agreement.** For every case and fixture, `bber check` and the build
   produce the same diagnostics (#797's class of defect).
8. **Kitchen-sink.** No errors, and an explicit list of the warnings it is
   expected to produce (today: `deprecated-name` for each `subchapter`).
9. **The GitLab projects.** Run the parse over the clones of every project in
   the canopycanopycanopy group (`gitlab-projects/` beside the b-ber
   checkout; `_survey/survey.js` there finds them). No project that builds
   today gains an error. The repos are private, so this is a script run before
   the parser lands, not a CI job.

#### Intended output differences

Each lands in its own commit, with the golden snapshot regenerated (see
Output compatibility):

- consecutive inline directives no longer swallow each other (kitchen-sink
  gallery: figures 02 and 03 appear, and figure 01 loses its bogus caption);
- `pullquote` keeps its `citation` and is no longer a `chapter`;
- `epub:type` keeps its family when `classes` is given
  (`epub:type="bodymatter chapter"`, not `" chapter"`);
- attribute values are escaped;
- a lone word no longer swallows the next attribute;
- speaker lines and gallery items after their block's `exit` are plain text;
- crossed exits and unclosed pullquotes produce balanced output;
- an unmatched `exit` is ignored. Inside an open pullquote or blockquote it no
  longer closes that block. That changes `the-world-is-unknown`, whose typo
  closes its blockquote by accident; its source should be fixed. Elsewhere the
  build no longer crashes (`international-art-english-e-book` builds again);
- the kitchen-sink fixture's single-line epigraph is rewritten to the block
  form, so the epigraph renders instead of appearing as literal text.

#### Decisions (2026-11-25)

The seven open decisions, settled after checking each against the 262 b-ber
projects on GitLab (Findings):

1. **`key "value"`: dropped.** No project uses it; only the kitchen-sink
   fixture did. One attribute form: `key:value`.
2. **The single-line `epigraph`: not implemented.** No project uses it, and it
   has never rendered. The fixture is rewritten to the block form.
3. **The 37 draft-only and deprecated-only names: removed from the registry.**
   No project uses one. They are `unknown-name`, which keeps today's
   literal-text output.
4. **Duplicate ids: an error**, with the scope narrowed to what actually
   collides (per file; per book only for figures with a page of their own).
   As first written, the rule would have failed 30 projects.
5. **Ids outside `[A-Za-z0-9_-]`: an error.** No project has one. Whether
   EPUBCheck also rejects ids that are not XML names (a leading digit or `-`)
   is still to be checked.
6. **A `media.yml` entry with no key for the target: an error when building
   that target**, as today, and a warning in `bber check`.
7. **Unknown names and unclosed blocks: warnings.** So are crossed and
   unmatched exits, which the first draft made errors: real books that build
   today rely on both. `bber check --strict` fails on warnings, for CI.

### `bber check` uses the same grammar

`b-ber-validator`'s separate grammar is replaced by the parse plus
`env.diagnostics`. One grammar decides what is valid, so #797-style
disagreements cannot happen.

**`b-ber-validator` stays a separate package: a thin layer over the shared
parse** (decided 2026-11-24). It doesn't go into the consolidation.
- **What goes:** its parser-combinator grammar, meaning `src/validator.ts` and
  `src/combinators/`, along with its own list of the directive names.
- **What stays:** `report.ts` (line number, caret-pointed excerpt, colours),
  plus a `check(source, fileName)` that runs the shared parse and returns
  `env.diagnostics` for `report` to format. `b-ber-tasks`' `validate` task
  calls `check`.
- **Why separate:** checking and reporting is a different job from rendering.
  The validator can serve `bber check`, a CI lint, or an editor without the
  render half.

That puts two requirements on the consolidated package:
- **Parsing is importable without rendering.** The package exports a parse
  entry point that loads no templates, no target features and no `State`,
  for example a `b-ber-markdown/parse` subpath. The validator depends on that
  entry point only.
- **Diagnostics are as precise as the validator's today:** a line *and*
  column, or a span, for each problem, so `report` can still point a caret at
  it. A diagnostic with only a line would make `bber check` worse than it is
  now. The specification subtask should state what positions each kind of
  diagnostic carries.

### Package consolidation

These become one package (working name `b-ber-markdown`):
- the 16 `grammar-*` packages, including `grammar-attributes` and
  `grammar-renderer`;
- the 5 `parser-*` packages;
- `b-ber-markdown-renderer`;
- `b-ber-shapes-directives`.

That is about 23 packages into 1.
- The only consumers outside that set are `b-ber-tasks` (the renderer) and
  `b-ber-validator` (today the shapes; afterwards the parse entry point).
- The old packages get a final release that `npm deprecate`s them, pointing
  at the new package.
- It ships with TASK-160's `State` removal as **5.0**.

### Output compatibility

The golden-output test (TASK-152) is the contract. The port aims at
**byte-identical output first**. Every intended difference (balanced markup
where today's is accidentally unbalanced, the duplicate-id fix) lands in its
own commit, with the regenerated snapshot showing the diff.

### Not in scope

- **The public `defineDirective` API and user-loaded directives**
  (`directives:` in `config.yml`). These are future work once the new code is
  stable. The internal `DirectiveDefinition` is shaped so it can be exposed
  later. Two rules for when it is:
  - the built-ins use the same API;
  - a name collision is an error unless the project explicitly overrides a
    built-in.
- New syntax. A generic attribute syntax (`{#id .class}`, as in Pandoc and
  MyST) could be accepted alongside the current one later; not here.

## Plan (tasks to file once this is agreed)

1. **The directive rule and the tree**, behind the existing renderer, for
   `section` alone. Golden output unchanged. Flip the duplicate-id defect
   test.
2. **Port the rest of the directives** one per commit (figure family,
   pullquote, dialogue, gallery/spread, footnotes, frontmatter, media). Delete
   `state.cursor`.
3. **Tree-built XHTML output** with the element builder and serializer.
4. **`env`-only state.** The grammar stops importing `State` (needs
   TASK-160's step 1).
5. **`bber check` on the shared grammar.** `b-ber-validator` becomes the
   thin layer described above. Its grammar and combinators are deleted, and
   its tests move to the parse's diagnostics. #797 can then be closed as fixed.
6. **Consolidate the packages** and deprecate the old ones (5.0).

## Subtasks

- [ ] Review this design; record decisions and changes below
- [x] Specify the directive syntax precisely (names, id rules, both attribute
      forms, nesting, what `exit` may close), from the shapes, the
      validator's combinators and the current parsers. Today it exists only
      as the union of those three. Done in "Directive syntax"; its open
      decisions were settled on 2026-11-25 ("Decisions")
- [x] Decide which differences from today's output are intended, and list
      them: "Intended output differences", decided 2026-11-25
- [x] Decide the validator question: a separate, thin package over the
      shared parse (2026-11-24)
- [ ] File the implementation tasks in the Plan under #792 and update its
      sequencing

## Notes

- Depends on: TASK-160 for `BuildContext`/targets (for rendering and the
  per-target features) and the prepare phase (parse once). The directive rule
  and the tree (Plan 1–2) can start without it.
- Related: #797 (validator first line), TASK-153's duplicate-id defect test.
- Prior art: MyST/mystmd (markdown-it → tree), Sphinx (`add_directive`,
  per-builder node visitors), Pandoc fenced divs and filters.

## Findings

### 2026-11-24: directive syntax, three sources compared

**Method.** Read at `72066c35`:
- `b-ber-shapes-directives/src/index.ts`;
- `b-ber-validator/src/validator.ts` and `combinators/`;
- every `grammar-*` and `parser-*` package registered by
  `b-ber-markdown-renderer/src/index.ts`, plus `grammar-epigraph`, which is
  not registered.

Then ran each rule against the built packages:
- about 80 inputs through the validator;
- the same inputs through the real renderer, in a copy of the kitchen-sink
  fixture with `process.argv` faked, for the `epub` and `web` builds;
- `grammar-media`'s pre-pass for `epub`, `web` and `pdf`, with a stub
  `media.yml`;
- the validator over the nine kitchen-sink files;
- the golden output (TASK-152), checked for what the build produces today.

Line numbers below are at that commit.

The block rule order, which decides who claims a line: `front_matter > table
> code > container_section > container_pullQuote > container_dialogue >
container_gallery > container_spread > container_figure >
container_audio-video > container_vimeo > container_iframe > container_logo >
fence > …`. The first container rule whose `validate(Open)` accepts the line
wins. A line none accepts falls through to `paragraph`. That is why an unknown
or malformed directive renders as literal text rather than failing.

**The validator rejects the kitchen-sink.** `bber check` fails 3 of its 9
files, all of which build:
- `chapter-01.md` at 10:13, on the `key "value"` epigraph;
- `chapter-02.md` at 54:40 and `chapter-03.md` at 34:38, on
  `source:https://…`: its value pattern excludes `:`.

**Discrepancies.** V = validator, R = renderer, S = shapes. "lit." means the
line is rendered as a literal paragraph, with no message.

| # | Rule | Minimal input | V | R | Proposed (reason) |
| - | ---- | ------------- | - | - | ----------------- |
| 1 | indentation | `   ::: chapter:a` | not a directive; passes vacuously | directive | R: markdown-it's own rule |
| 2 | fence length | `:::: chapter:a` | rejects | directive; `grammar-media` needs exactly `::: ` | ≥3: R |
| 3 | after the fence | `:::chapter:a`, `:::  chapter:a` | rejects ("Space") | directive | any whitespace: R |
| 4 | first line | `::: chapter:a\n\n::: exit:a\n` | fails; the unclosed `::: chapter:a\n` passes (#797) | directive | directive (R) |
| 5 | CRLF | `\r\n` endings | fails at the id ("End of line") | normalized | normalize (R) |
| 6 | inside code | ` ``` ` around `::: chapter:a` | a directive (unclosed: fails) | code; `grammar-media` still rewrites it | code (R) |
| 7 | id characters | `chapter:a.b`, `chapter:é` | rejects | accepts, writes `a-b`, `-` | accept, warn (R; compatibility) |
| 8 | missing id, inline | `::: figure source:x` | rejects | lit.; `::: video source:x` dropped | error (content is lost) |
| 9 | empty id | `::: chapter:` | rejects | lit. | error |
| 10 | `:` in a value | `source:https://vimeo.com/1` | rejects | accepts | accept (R; the fixture uses it) |
| 11 | `key "value"` | `title "x"`; `::: epigraph caption "…"` | rejects | ignored on a block; lit. without an id; only the unregistered `grammar-epigraph` parses it | accept (open decision 1, 2) |
| 12 | other quote inside | `title:"it's"` | rejects | accepts | accept (R) |
| 13 | unclosed quote | `classes:"foo bar` | scans to the next `"`, across lines, or reports past the end of the text | value to end of line | value to end of line, warn |
| 14 | multi-line value | `title:"a\nb"` | accepts | not possible: attributes are one line | one line (R) |
| 15 | empty value | `classes:` | rejects | dropped silently | warn, dropped |
| 16 | lone word | `controls`; `title:foo bar classes:x` | rejects | dropped; `bar classes` becomes one key and `classes` is lost | warn; parse the rest |
| 17 | spacing | two spaces or a tab between attributes | rejects | accepts | accept (R) |
| 18 | unknown key | `bogus:x` | accepts | warns, drops | warn (R) |
| 19 | repeated key | `classes:x classes:y` | accepts | last wins, silently | last wins, warn |
| 20 | unknown name | `::: chaptr:a` | error at the name (correct anchor) | lit. | warn, lit. (compatibility) |
| 21 | draft- or deprecated-only name | `::: abstract:a`, `::: note:a` | accepts as a block | lit.; the substitution code is unreachable | substitute `chapter` (open decision 3) |
| 22 | `pullquote` in the draft set (S) | `::: pullquote:p citation:"X"` | accepts | rendered as `chapter`, `citation` dropped | misc block with citation |
| 23 | `epigraph` in two sets (S) | `::: epigraph:e` | block | block (via section); `SUPPORTED_ATTRIBUTES.epigraph` (`alt`, `source`) is never consulted | structural block |
| 24 | `media` attributes | `::: media:m classes:x` | accepts | `Missing ID [m classes]` | error |
| 25 | duplicate ids | `chapter:a` … `exit:a`, then `chapter:a` again | accepts | throws, even after the exit; pullquote and figure ids never checked | per file, figures per book (open decision 4) |
| 26 | crossed exits | `a`, `b`, `exit:a`, `exit:b` | error at the second id | closes by id: misnested; with `spread` on web, `</section>` before `</div></div>` | error with recovery |
| 27 | stray exit | `::: exit:zzz` | "End of string" on the line before | `TypeError` crash | error at the exit |
| 28 | text after exit | `::: exit:a foo` | accepts | ignored | warn |
| 29 | unclosed block | `::: chapter:a\n\nBody\n` | error on the line before | closed at end of file silently; `pullquote` left open | warn, close at container end |
| 30 | caption spacing | `::A caption` | rejects | accepts | accept (R) |
| 31 | `:::` after an inline | three adjacent `::: figure` lines | accepts | the 2nd becomes the 1st's caption, the 3rd is lost | never a caption (V) |
| 32 | speaker line | `:: Bob :: hi` after `exit:d` | accepts anywhere | applied to the end of the file | only inside `dialogue` |
| 33 | gallery item | `:: type:image source:a.png ::` | rejects (its TODO.md) | applied to the end of the file | only inside `gallery` |
| 34 | `::` in text | `::not a caption` inside a block | rejects ("Space") | text | text (R) |
| 35 | in a list or blockquote | `- item\n\n  ::: chapter:a` … | ignored, passes | directive | directive (R) |
| 36 | name not first | `::: junk figure:f source:x`; `::: audiobook:x` | rejects | renders a figure; drops the line | name is the first token |

**Bugs found** (recorded, not fixed):

1. `validator/src/combinators/oneOf.ts:21` keeps the **nearest** failure,
   though its comment says furthest. Flipping the comparison in a copy of the
   built package moved **none** of the misplaced carets, though. The real
   cause:
   - `many.ts:15-17` ends a repetition on any non-fatal failure and discards
     it;
   - the top-level `eos()` (`validator.ts:142`) then reports "End of string"
     where `many` stopped;
   - the fences (`validator.ts:35-36`) begin with `\n`, so that offset is the
     newline at the end of the previous line.

   An unclosed block on line 3 is reported at 2:1, and a stray exit on line 5
   at 4:1.
2. `validator.ts:35-36`: a fence must follow a `\n`, so a directive on line 1
   is body text. That inverts the result (#797).
3. `validator.ts:28`: `ascii` excludes `:`, so URL values fail.
   `validator.ts:29`: `words` is `[^'"]+`, which crosses newlines. On an
   unclosed quote, `close.ts:17,28-29` reports an index past the end of the text
   (offset 60 of 59).
4. `parser-section/src/index.ts:74` (the same line in `parser-gallery` and
   `parser-dialogue`) compares the **opener's** `pos` with each later line's
   `start`. That is always negative, so no closing fence is ever found and
   every container runs to the end of the document. This is the mechanism
   behind "The root problem" above.
5. `grammar-renderer/src/index.ts:74` adds ids to `state.cursor` during
   parsing, including silent mode, and only render removes them. So any block
   id used twice in a file throws `Duplicate [id]`, even after its `exit`.
   That is the per-file uniqueness noted above, and the TASK-153 false
   positive (`grammar-section/__tests__/index.test.js:102`).
6. `grammar-pullquote/src/index.ts:24` matches `exit`, and `validateOpen`
   (103-117) accepts every exit that `section` declined. `handleClose` (77)
   then destructures `undefined` when no pullquote is open. Any stray exit,
   an exit for a figure, or the exit of a misspelled opener crashes with
   `Cannot destructure property 'id' of 'pullquoteIndices[…]'`. Also,
   `MARKER_CLOSE_RE` (25) has `[\s]+` where `[^\s]+` was meant.
7. `shapes-directives/src/index.ts:94` puts `pullquote` in the draft set, and
   `grammar-attributes/src/index.ts:260` substitutes draft names first. Every
   pullquote renders as `class="pullquote  chapter" epub:type=" chapter"`
   (golden `epub/OPS/text/kitchen-sink-chapter-01.xhtml:24`), and its
   `citation` is dropped as unsupported.
8. `grammar-attributes/src/index.ts:214` looks up the family of
   `result.classes` instead of the directive. With `classes`, `epub:type`
   loses its family: golden `kitchen-sink-chapter-01.xhtml:43`,
   `epub:type=" chapter"`.
9. `grammar-attributes/src/index.ts:97`: attribute values are written
   unescaped. `title:"<b>&"` gives `title="<b>&"`. The same is true of
   `grammar-media/src/helpers.ts:33`.
10. `grammar-attributes/src/index.ts:123-158` (`parseAttrs`): a lone word is
    merged into the next key (`bar classes`), so that attribute is lost.
11. `parser-figure/src/index.ts:92-116` takes any following line that starts
    with `::`, including `:::`, as a caption marker. In the kitchen-sink
    gallery (`chapter-02.md:30-32`) the golden epub has only figure 01. Figure
    02's directive is figure 01's caption
    (`figurech-02-gallery-figure-01.xhtml:23`), and figure 03 is gone. The
    golden snapshot pins this.
12. `grammar-image/src/index.ts:23` is unanchored, so `::: junk figure:f …`
    renders a figure. At :79 the "missing source" check tests the attribute
    string, not `source`.
13. `grammar-audio-video/src/index.ts:36` validates with `^(video|audio)` and
    renders `''` when the full pattern fails (177). So `::: audiobook:x` and
    `::: video source:x` vanish without a message. `vimeo` (31, 125) and
    `iframe` (16, 24) have the same shape.
14. `b-ber-markdown-renderer/src/index.ts:52-104` never registers
    `grammar-epigraph`. The single-line epigraph renders as literal text:
    golden `kitchen-sink-chapter-01.xhtml:16`.
15. `grammar-media/src/index.ts`:
    - 74-85: a last line with no trailing newline is never scanned;
    - 100: only exactly `::: ` is matched;
    - 103: `split(':')` puts attributes into the id;
    - the scan is line-based, so it rewrites inside fenced code;
    - `type` is never validated.
16. `parser-dialogue/src/index.ts:116-118` and
    `parser-gallery/src/index.ts:255-258` reset their "inside" flag only at
    the container's close token, which is at the end of the document. Speaker
    and gallery-item syntax applies after the `exit`.
17. `grammar-section/src/index.ts:52-85` closes by id wherever the block is
    in the stack. Crossed exits misnest, and with `spread` or `gallery` on
    web and reader the output is malformed.
18. `grammar-section/src/index.ts:132` writes 0-based line numbers into the
    `START` comments, while the errors use 1-based numbers
    (`parser-section/src/index.ts:35`). For example,
    `kitchen-sink-chapter-01.md:11` in the golden output is line 12.

**Evidence: the validator's anchors.** Re-run against the built package:

| Input | Construct at | Reported at |
| ----- | ------------ | ----------- |
| `# Title\n\n::: chapter:a\n\nBody\n\nMore\n` (unclosed) | 3:1 | 2:1, "End of string" |
| `# Title\n\nText\n\n::: exit:zzz\n` (stray exit) | 5:1 | 4:1, "End of string" |
| `::: chapter:a\n\n::: exit:a\n` (first line, valid) | (none) | 2:1, "End of string" |
| `x\n\n::: chapter:ab\n\n::: exit:a\n` (wrong exit) | 5:1 | 6:1, at the end of the text |
| `# T\n\nx\n\n::: figure:f source:a.png bogus\n` | 5:27 | 5:27, "End of line" (right place, wrong message) |
| `# T\n\n::: chaptr:a\n\n::: exit:a\n` | 3:5 | 3:5, "Valid directive name" |

The same table with `oneOf` patched to keep the furthest failure gives
identical positions (bug 1).

**Evidence: the renderer.** Selected results:
- `::: exit:zzz` with nothing open: `TypeError` (bug 6).
- `::: chapter:a` … `exit:a` … `::: chapter:a` … `exit:a`:
  `Duplicate [id] [a] … probe.md:9` (bug 5).
- `::: chapter:a classes:foo`: `epub:type=" chapter"` (bug 8).
- `::: chapter:a title:"<b>&"`: `title="<b>&"` (bug 9).
- `::: pullquote:p` unclosed: `<section …>` with no close.
- `::: abstract:a`: `<p>::: abstract:a</p>` (row 21).
- `::: credits:a`: `class="credits backmatter chapter"`, with the draft
  warning.
- `media` for `pdf` with no `pdf` key: `Missing build type [pdf] in media.yml
  for the ID [m]`.

**`media.yml` shape**, from `State.ts:33-40,136-137` and
`grammar-media/src/index.ts:31`: `{ [id]: { [target]: { type, caption?,
...attrs } } }`. The pre-pass emits `::: <type>[-inline]:<id> key:"value" …`,
then `:: <caption>` and `::` when there is a caption.

### 2026-11-25: the decisions, checked against the GitLab projects

**Method.** Shallow clones of all 290 non-empty repos in the canopycanopycanopy
GitLab group, in `gitlab-projects/` beside the b-ber checkout. 262 of them are
b-ber projects (a `config.yml` and a `_markdown` directory). A read-only
survey (`gitlab-projects/_survey/survey.js`, results in `survey.json`) scans
every Markdown file's directive lines, skipping fenced code, using the name
lists from `b-ber-shapes-directives`. Three books were then built with the
current CLI (`bber build reader`) to see what today's build does.

| Check | Result |
| ----- | ------ |
| `key "value"` attributes | 0 |
| single-line `epigraph` (no id) | 0 |
| draft-only or deprecated-only names | 0 |
| ids outside `[A-Za-z0-9_-]` | 0 |
| missing ids | 0 |
| duplicate block id within a file | 0 |
| page figure id reused in the book | 1, in `the-devil-in-connecticut-p-o-c` (`figure:one` in chapters 1 and 3) |
| inline figure id reused across files | 64 in 30 projects: harmless, no page |
| inline figure id reused within a file | 1, in a test project |
| unknown names | 5, in 2 test projects (`image`, `soundcloud`) |
| crossed exits (an outer exit closing blocks still open inside it) | 19 in 17 projects, including 8 i26 title pages, `i29-jeremy-toussaint-baptiste` and `the-world-is-unknown` |
| blocks still open at the end of the file | 3 in 3 projects, one published (`who-belongs-to-the-land`) |
| unmatched exits | 11 in 10 projects |
| `media.yml` entries | 136 in 38 projects: 108 define only `epub`, `mobi`, `reader`; 18 use `<<` merges. 61 `media.yml` files are empty |

**Builds today** (`bber build reader`, current `main`):
- `the-world-is-unknown` builds. Its unmatched `exit:affirmations-pullquotes`
  (a typo for `affirmations-pullquote`) is consumed by `grammar-pullquote`,
  which closes the open blockquote.
- `listening` (i26) builds. Its unclosed `spread-contents` is closed by the
  outer exit.
- `international-art-english-e-book` **fails**: `Cannot destructure property
  'id' of 'pullquoteIndices[(pullquoteIndices.length - 1)]'`, on the unmatched
  `exit:iae-about`. This is bug 6 above, on a published book.

So unmatched and crossed exits, and unclosed blocks, have to be warnings. The
forms no project uses are dropped rather than specified.
