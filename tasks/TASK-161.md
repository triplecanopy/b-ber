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
::: epigraph caption "The beginning…" citation "Plato"   no id; key "value" pairs
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
  in). It accepts both `key:value` and `key "value"`, because both are in use.

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
- [ ] Specify the directive syntax precisely (names, id rules, both attribute
      forms, nesting, what `exit` may close), from the shapes, the
      validator's combinators and the current parsers. Today it exists only
      as the union of those three
- [ ] Decide which differences from today's output are intended, and list
      them
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
