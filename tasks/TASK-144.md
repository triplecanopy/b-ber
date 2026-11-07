# TASK-144: Upgrade markdown-it 8 → 15 (CVE-2022-21670 and four others)

**Epic:** Dependency health
**GitHub Issue:** #718 — https://github.com/triplecanopy/b-ber/issues/718
**Scope:** markdown-renderer

## Description

Renovate PR #699 is a `[security]` update of `markdown-it` from `^8.4.1` to
`^15.0.0`, seven majors, in `b-ber-markdown-renderer`. The lockfile had
**8.4.2**. Five advisories are listed against it:

| Advisory                             | Issue                                                      | Applies to b-ber? |
| ------------------------------------ | ---------------------------------------------------------- | ----------------- |
| CVE-2022-21670 / GHSA-6vfc-qv3f-vr6c | slow parse of long whitespace runs (newline rule)          | yes, any options  |
| CVE-2026-48988 / GHSA-6v5v-wf23-fmfq | quadratic smartquotes                                      | no, `typographer` is off |
| GHSA-253c-mchw-3w2r                  | two quadratic paths in linkify                             | no, `linkify` is off |
| CVE-2026-111759 / GHSA-r7fv-28h4-cvq7 | quadratic smartquotes, unmatched closers                  | no, `typographer` is off |
| inline HTML (15.0.3)                 | quadratic parse of unclosed inline comments, `<?`, `<!X`, CDATA | yes, `html: true` |

Every input is an author's own Markdown, so as with TASK-139 and TASK-140 the
exposure is narrow. 8.x is seven majors behind and receives no fixes.

This is the "kind 3" path in
[`docs/dependency-update-policy.md`](../docs/dependency-update-policy.md).

The question going in was whether this fits as a dependency bump or has to
wait for a rewrite of the parser/renderer. The answer is that it fits: see
Approach.

### Where markdown-it is used

One instance, in `b-ber-markdown-renderer/src/index.ts`:
`{ html: true, xhtmlOut: true, breaks: false, linkify: false }`, `typographer`
left at its default of off, and highlight.js for fences. Thirteen plugins are
registered on it. Seven reach into parser internals rather than the public API:

| Package | Adapted from | Internals it uses |
| ------- | ------------ | ----------------- |
| `parser-section`, `parser-dialogue`, `parser-gallery` | markdown-it-container 2.0.0 | `StateBlock` line arrays (`bMarks`, `eMarks`, `tShift`, `sCount`), `blkIndent`, `lineMax`, `parentType`, `md.block.tokenize`, `block.ruler.before('fence')`; dialogue and gallery push plain objects into `inline` tokens' `children` |
| `parser-figure` | markdown-it-container | the same line arrays; stores the caption string in `token.children` |
| `parser-footnotes` | markdown-it-footnote 3.0.1 | `md.helpers.parseLinkLabel`, `md.utils.isSpace`, `state.Token`, `md.inline.parse`, block, inline and core rules; its renderer pushes plain objects into the next token's `children` |
| `grammar-footnotes` | — | `md.renderer.render` on a hand-built token array |
| `markdown-it-front-matter` 0.1.2 | — | the same line arrays, `skipSpaces`, `block.ruler.before('table')` |

The grammar packages use only `md.renderInline` and `md.parseInline` beyond
that.

### What changed between 8 and 15 that could reach us

From the changelog, 9.0.0 to 15.0.3:

- **Parser internals that the plugins use did not change.** `StateBlock`'s line
  arrays, `parentType`, `lineMax`, `md.block.tokenize`, the rulers,
  `helpers.parseLinkLabel`, `utils.isSpace`, `state.Token` and `parseInline`
  all exist with the same signatures. The only removal is
  `StateBlock#ddIndent` (15.0.0), which nothing here uses.
  `StateInline.delimiters[].jump` (12.3.0) is also unused.
- **13.0.2 throws when a block rule doesn't advance `state.line`.** Every
  plugin here sets `state.line` past its match. Builds and tests confirm none
  throws.
- **CommonMark 0.28 → 0.31.2** (9.0, 12.1, 14.1) plus the GFM table rewrite
  (12.0). These change rendering in edge cases; see Verification.
- **15.0.0 packaging:** prebuilt CJS and ESM in `dist/`, bundled TypeScript
  declarations, subpath exports removed. Nothing imports `markdown-it/lib/*`.
  The bundled types export the instance type as `MarkdownIt.MarkdownIt`.
- **Dependency majors:** `linkify-it` 6, `entities` 8, `mdurl` 2, `uc.micro` 3,
  `punycode.js`. Only `entities` is reached with our options, through entity
  decoding (see the numeric entity difference below).
- **The 3rd `highlight` argument** (12.0) is extra; our callback ignores it.
- markdown-it-footnote 3.0.2 and 3.0.3 fixed linkify inside inline notes and a
  crash on nested notes. Our fork predates both. Neither matters here: linkify
  is off, and the nested-note crash exists on 8 as well.

## Approach

**Take 15.0.3 as is: no compatibility code, and no plugin changes.**

The plugins are the risk in this upgrade, and the internals they rely on are
unchanged. markdown-it's own rendering changes are CommonMark corrections that
none of the repo's Markdown triggers. A real-build comparison (Verification)
shows byte-identical output across every build type. So the parser/renderer
refactor this could have been folded into is not needed for the security fix.

`markdown-it-front-matter` stays at 0.1.2. It is not in an advisory, works
unchanged on 15, and 0.2.x is a separate change.

## Changes

- `b-ber-markdown-renderer`: `markdown-it ^8.4.2` → `^15.0.3`;
  `@types/markdown-it` removed (15 bundles its own). `markdownIt` is typed
  `MarkdownIt.MarkdownIt`, the instance type in the bundled declarations.
- `package-lock.json`: the markdown-it tree only (`linkify-it` 6.1.0, `mdurl`
  2.1.0, `uc.micro` 3.0.0, `punycode.js` 2.3.1, and markdown-it's own
  `entities` 8.1.0 and `argparse` 3.0.4).
- `b-ber-markdown-renderer/__tests__`: an output test. A fixture document
  (front matter, sections, pull quote, blockquote, dialogue, every footnote
  form, lists, code, tables, raw HTML, entities, escapes) goes through the whole
  plugin stack, and the XHTML and the collected footnotes are snapshotted. A
  second block pins the five CommonMark changes an author could plausibly hit.
- `b-ber-markdown-renderer/AGENTS.md`: says what the snapshot guarantees.

## Subtasks

- [x] Inventory every markdown-it call site and the internals each plugin uses
- [x] Read the 9.0.0 to 15.0.3 changelog, and markdown-it-footnote's since 3.0.1
- [x] Library comparison of 8.4.2 and 15.0.3 on the repo's Markdown and both
      CommonMark specs
- [x] Real-build comparison against an 8.4.2 baseline, every build type
- [x] Advisory payloads timed on both versions
- [x] Bump, drop `@types/markdown-it`, fix the one type error
- [x] Output snapshot and change tests, checked against 8.4.2 as well as 15
- [x] `npm test`, typecheck, `check:circular`, Playwright (all projects),
      `npm audit`
- [ ] Merge; confirm Renovate closes #699 as superseded

## Verification

**Library comparison**, bare markdown-it 8.4.2 against 15.0.3 with b-ber's
options. Inputs were the 13 Markdown files in the kitchen-sink fixture, `demos/basic` and
the templates, plus every example from the CommonMark 0.28 and 0.31.2 specs
(681 distinct):

- **All 13 real files render identically.**
- **28 spec examples differ.** All are spec corrections in edge cases:
  - code spans keep runs of spaces, line-break spacing and a lone leading or
    trailing space instead of collapsing or trimming them (11);
  - inline HTML comments containing `--`, or opening `<!-->`, pass through
    raw (4). Block-level comments already did on 8.
  - a list marker indented four or more spaces past its parent becomes
    continuation text or code, not a new item (3);
  - intraword `***`, and `*£*`-style flanking (3);
  - out-of-range numeric entities stay text instead of U+FFFD (2);
  - `[x](</a b>)`, and a reference definition with `<url>` on its own line,
    are links (2);
  - one each: a `~~~` info string containing backticks, `<textarea>` as an
    HTML block, and `ẞ`/`SS` label folding.

**Real builds**, run with the built CLI on 8.4.2 (`main`) and again on 15.0.3.
The kitchen sink was extended, in a scratch copy only, with a chapter covering
what it lacks:
- the directives `figure-inline`, `blockquote`, `audio-inline`,
  `video-inline`, `vimeo-inline`, `iframe-inline`, `media` and `media-inline`
  (with a `media.yml`);
- figure and gallery captions, and interlocutors;
- footnotes in every form;
- raw HTML, entities and code fences.

It was built as `epub`, `web`, `reader`, `xml`, `sample`, `mobi` and `pdf`, and
`demos/basic` as `epub` and `web`.

- **All 273 output files are identical** once per-build randomness is
  normalized. That includes the EPUBCheck report: the same 7 errors on both,
  6 from the fixture's iframe and 1 from the footnote links below.
- Two 8.4.2 runs were compared first to set the noise floor. The only
  run-to-run differences are the `xml` build log (it names the work directory)
  and the reader's `manifest.json` (see Findings). Both vary the same way
  between two runs on 8.
- `mobi` and `pdf` stop at the same point on both: `pdf` for want of Calibre,
  `mobi` on a fixture bug (Findings).

**Advisory payloads**, one render each, b-ber's options:

| Payload | 8.4.2 | 15.0.3 |
| ------- | ----: | -----: |
| CVE-2022-21670 whitespace run | 6441 ms | 3 ms |
| unclosed `<!X` declarations ×20k | 1465 ms | 10 ms |
| unclosed CDATA ×20k | 728 ms | 177 ms |
| unclosed `<?` ×20k | 582 ms | 8 ms |
| pathological `***` (12.3.0) | 80 ms | 12 ms |

The smartquotes and linkify payloads do not reach b-ber, since both options
are off.

**Tests:** the output snapshot was recorded on 15 and passes **unchanged** on
8.4.2 (run with `markdown-it` mapped to an 8.4.2 copy). The five change tests
fail on 8.4.2, as they should.

**Gates:**

- `npm test`: 131/131 suites, 1149 tests. The parser packages' own suites
  import the hoisted `markdown-it` and so now run against 15.
- Typecheck: `b-ber-markdown-renderer` gained no errors; its one remaining
  error, the untyped `markdown-it-front-matter`, is on `main` too.
- `check:circular`: clean.
- Playwright: 35 passed, 6 skipped (all 6 are `test.skip` in the specs).
- `npm audit`: no advisories against markdown-it or its dependencies.

## Findings

None of these come from the upgrade; each reproduces on 8.4.2.

- **The standalone `epigraph` directive is never registered** (TASK-145).
  `b-ber-grammar-epigraph` exists, but `b-ber-markdown-renderer` does not
  `use` it, so `::: epigraph caption "…"` renders as a literal paragraph. The
  kitchen sink's epigraph comes out as `<p>::: epigraph caption &quot;…</p>`.
  The plugin would also throw if registered: it destructures
  `instance.escapeHtml`, which no markdown-it version has. Its tests mock that
  shape, which hides the bug. The block form `::: epigraph:id … ::: exit:id`
  goes through `grammar-section` and is not affected.
- **A footnote referenced twice breaks every later footnote link in the
  chapter** (TASK-146). `parser-footnotes` pairs refs with notes by queue order,
  one ref per note. A second `[^label]` takes the next note's id, every later
  ref shifts by one, and the last links to `notes.xhtml#fnundefined`. That
  link is the RSC-012 error in the EPUBCheck report. Inline `^[…]` notes also
  get `undefined` in their ids, since they have no label.
- **The kitchen sink's `mobi` build fails in render:** "Could not read image
  dimensions _project/_images: EISDIR". An image path resolves to the images
  directory itself, apparently a media directive's `mobi` fallback with no
  image.
- **The reader's `manifest.json` lists a different set of files on each run.**
  `writeWebpubManifest` scans the output while other steps are still moving
  files into it, and does not wait for its own `writeJson`.
- **The parser packages' tests use `markdown-it` without declaring it.** They
  pick up the hoisted copy, which is why they moved to 15 here without a
  manifest change.
- **Pathological input to b-ber's own container plugins is untested.** The
  upgrade fixes markdown-it's quadratic paths, not any in the plugins, which
  scan forward for a closing marker from every opening one.

## Notes

- Renovate PR: #699. Related: TASK-139 and TASK-140 (the same kind-3 path),
  TASK-122 (the specifier policy this follows).
