# TASK-145: Fix or retire the standalone `epigraph` directive

**Epic:** EPUB spec compliance
**GitHub Issue:** #720 — https://github.com/triplecanopy/b-ber/issues/720
**Scope:** grammar-epigraph, markdown-renderer

## Description

The standalone form of the epigraph directive renders as literal text. Both
of its forms are affected:

```
::: epigraph caption "First | Second" citation "First citation | Second"
::: epigraph image "file.jpg" caption "A caption"
```

The kitchen-sink fixture's chapter one uses the first form, and every build
emits it as:

```html
<p>::: epigraph caption &quot;The beginning is the most important part of the work.&quot; citation &quot;Plato&quot;</p>
```

So the `<section epub:type="epigraph">` the directive exists to produce never
appears.

**Cause.** `b-ber-grammar-epigraph` is never registered. `b-ber-markdown-renderer`
`use`s twelve grammar packages and this is not one of them, and no manifest
depends on it. Its history shows no registration in the current renderer.
The docs diagrams (`docs/diagrams/02-package-dependencies.md`,
`04-markdown-rendering-layer.md`, `pkg/b-ber-markdown-renderer.md`) draw it
as if it were registered.

**It would throw if registered.** `render()` starts with
`const { escapeHtml } = instance.escapeHtml`. `instance` is the markdown-it
instance, which has no `escapeHtml` property on any version (the function is
`md.utils.escapeHtml`), so destructuring `undefined` throws on the first
epigraph. The package's tests pass only because they mock `instance` as
`{ escapeHtml: { escapeHtml } }`, the same wrong shape.

**The block form works.** `epigraph` is also in `FRONTMATTER_DIRECTIVES`, so
`::: epigraph:id … ::: exit:id` goes through `grammar-section` and renders
`<section id="…" epub:type="frontmatter epigraph" class="frontmatter epigraph">`.
Confirmed on markdown-it 8 and 15 (TASK-144). Only the standalone form is
dead.

**Its syntax doesn't match the other directives.** The standalone form takes
`key "value"` (`attrsRe` in the package). Every other directive takes
`key:value` or `key:"value"`. `b-ber-shapes-directives` lists `epigraph`'s
supported attributes as `alt` and `source`, which matches neither form.

Found in TASK-144, which compared real builds on markdown-it 8 and 15. This
is filed under EPUB spec compliance because the directive's job is to emit the
EPUB 3 structural semantic `epub:type="epigraph"`. A parser/renderer epic
would be a better home if one is raised.

## Decision needed

**Decided 2026-11-25: option 2, retire it.** TASK-161's directive syntax drops
the `key "value"` attribute form, and the standalone epigraph is its only
user. None of the 262 b-ber projects in the canopycanopycanopy GitLab group
uses either form; only the kitchen-sink fixture did (TASK-161 Findings,
2026-11-25).

Two ways to resolve it. Pick one before starting:

1. **Register and fix it.** Add the package to the renderer, use
   `md.utils.escapeHtml`, and correct the tests' mock. The image form also
   needs its image to go through the same path handling as `figure` (it
   writes `../images/<name>` directly), and the attribute shapes need to match
   the syntax. Decide whether to keep `key "value"` or move to `key:"value"`
   like the other directives. Moving breaks no book, since the form has never
   worked.
2. **Retire it.** The block form already produces the EPUB semantics, and a
   pull quote inside it gives the caption/citation layout. Deprecate and stop
   publishing the package, change the kitchen-sink fixture to the block form,
   and correct the diagrams. A standalone `::: epigraph …` line could also log
   a warning that names the block form, rather than silently becoming text.

Option 2 removes code that has never run. Option 1 keeps a one-line shorthand
authors might want.

## Subtasks

- [x] Decide between the two options above: option 2
- Option 1 (not taken): register the plugin; fix `escapeHtml`; fix the
  tests' mock so it matches markdown-it's real shape; reconcile the attribute
  shapes; route the image form through the figure path handling
- [x] Option 2: deprecate `b-ber-grammar-epigraph`; move the kitchen sink to
      the block form; correct the three diagrams; warn on the standalone
      form. The package is removed from the workspace, so it is no longer
      built or published; the npm deprecation is a maintainer step (Notes).
      The warning is left to TASK-161 (Notes)
- [x] Either way: add an epigraph to the output snapshot in
      `b-ber-markdown-renderer/__tests__` and to the e2e directive checks, so
      a directive that renders as text fails a test. An explicit test rather
      than a snapshot change (it asserts `epub:type="frontmatter epigraph"`),
      plus `epigraph` in `directives.spec.ts`, which fails on the old form

## Notes

- Reproduce: build the kitchen-sink fixture and look at
  `OPS/text/kitchen-sink-chapter-01.xhtml`.
- Related: TASK-144 (where this was found), TASK-146 (the other renderer bug
  found there).
- **npm deprecation** needs the maintainer's npm credentials, so it is not
  in the PR. After merging:
  `npm deprecate @canopycanopycanopy/b-ber-grammar-epigraph "Never registered with the renderer. Use the block form: ::: epigraph:<id> … ::: exit:<id>"`
- **No warning on the standalone form in the current renderer.** TASK-161's
  parser reports `::: epigraph …` with no id as `missing-id`, and a
  `key "value"` attribute as `attribute-form`. A warning added to today's
  renderer would be deleted by that rewrite. Until then the line renders as
  literal text, as it always has.
- **Output change:** the kitchen-sink's chapter one gains its epigraph section
  (`<section id="ch-01-epigraph" epub:type="frontmatter epigraph">`) in place
  of the literal `<p>::: epigraph caption …</p>`. The golden snapshot is
  regenerated with it. The only other differences are the source line
  numbers in comments, which shift by the six lines the block form adds.

