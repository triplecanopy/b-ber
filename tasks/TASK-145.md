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

- [ ] Decide between the two options above
- [ ] Option 1: register the plugin; fix `escapeHtml`; fix the tests' mock
      so it matches markdown-it's real shape; reconcile the attribute shapes;
      route the image form through the figure path handling
- [ ] Option 2: deprecate `b-ber-grammar-epigraph`; move the kitchen sink to
      the block form; correct the three diagrams; warn on the standalone
      form
- [ ] Either way: add an epigraph to the output snapshot in
      `b-ber-markdown-renderer/__tests__` and to the e2e directive checks, so
      a directive that renders as text fails a test

## Notes

- Reproduce: build the kitchen-sink fixture and look at
  `OPS/text/kitchen-sink-chapter-01.xhtml`.
- Related: TASK-144 (where this was found), TASK-146 (the other renderer bug
  found there).
