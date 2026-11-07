# TASK-147: Replace EPUBCheck with a native TypeScript EPUB validator

**Epic:** EPUB spec compliance
**GitHub Issue:** #723 — https://github.com/triplecanopy/b-ber/issues/723
**Scope:** tasks

## Description

`bber build epub` packages and validates through
[`epub-zipper`](https://github.com/msimmer/epub-zipper) (`b-ber-tasks/src/epub/index.ts`).
That one dependency does two jobs, both by shelling out:

- **zipping** runs the system `zip` binary three times (`mimetype` stored,
  `META-INF` and `OPS` deflated);
- **validating** runs `java -jar vendor/epubcheck.jar -e` on the result.

The vendored EPUBCheck is **v4.2.2**. The current release is **v5.4.0**
(2026-09-15), which checks against EPUB 3.4. The package is 10.6 MB unpacked, almost all of it
JARs (Saxon-HE 5.0 MB, Guava 2.6 MB, EPUBCheck 1.3 MB, Jing 0.8 MB, …), and
every user needs a JRE on `PATH`.

#541 proposes upgrading to a current EPUBCheck. This task proposes the other
route: **drop the JVM entirely and validate in TypeScript**, so that a b-ber
install has no Java, no `zip` binary and no vendored JARs. A new, maintained
piece of code is an acceptable price; a large opaque binary is not.

The goal is not a general-purpose EPUBCheck clone. It is a validator good
enough that b-ber's own output can be trusted to pass the real EPUBCheck (and
retail ingestion, which runs it). That means catching what b-ber and its
authors can actually get wrong.

## Findings (initial feasibility research, 2026-11-07)

### There is a spec, and there is something better than the spec

The prose specs are all online:

| Version | Spec |
| ------- | ---- |
| EPUB 3.3 (W3C Recommendation, 2023) | <https://www.w3.org/TR/epub-33/>, plus [Reading Systems 3.3](https://www.w3.org/TR/epub-rs-33/) and [Accessibility 1.1](https://www.w3.org/TR/epub-a11y-11/) |
| EPUB 3.4 (Candidate Recommendation, 2026-07-21; comments closed 2026-10-19) | <https://www.w3.org/TR/epub-34/> |
| EPUB 2.0.1 (IDPF, 2010; obsolete, unmaintained) | [OPF 2.0.1](https://idpf.org/epub/20/spec/OPF_2.0_latest.htm), [OPS 2.0.1](https://idpf.org/epub/20/spec/OPS_2.0_latest.htm), OCF 2.0.1 (`idpf.org/epub/20/spec/OCF_2.0.1_draft.doc`) |

Prose cannot be executed, though. The more useful find is that
**[EPUBCheck](https://github.com/w3c/epubcheck) is BSD-3-Clause and its
spec-as-data is all in the repo**:

- **Schemas** under `src/main/resources/com/adobe/epubcheck/schema/`:
  RELAX NG (`.rnc`/`.rng`), Schematron (`.sch`) and NVDL for every document type,
  for both EPUB 2 (`20/`) and EPUB 3 (`30/`). The EPUB 3 core is small:
  `package-30.rnc` 133 lines, `package-30.sch` 48 rules, `epub-nav-30.rnc` 42
  lines + 8 rules, `ocf-container-30.rnc` 37 lines, `epub-xhtml-30.sch` 31
  rules. The large piece is the HTML5 grammar in `30/mod/html5/` (~247 KB of
  RNC across 31 files, MIT-licensed, derived from the Nu Html Checker).
- **A conformance suite**: 50 Gherkin `.feature` files, organised by spec
  section, each scenario naming a fixture and the exact message IDs expected
  (`Then error RSC-005 is reported 2 times`). There are ~1,450 fixture files
  under `epub3/` alone, plus a separate `epub2/` set.
- **A message catalogue**: 246 message IDs (`OPF-003`, `RSC-012`, …) with
  severities in `MessageBundle.properties`.

So the feature files are an executable spec, already mapped to spec sections.
Our validator can be tested against the same scenarios EPUBCheck is, and
emitting the same message IDs means its output can be compared with the real
tool directly.

### The rest of EPUBCheck is Java code

Not everything is in a schema. About 200 Java classes implement the
cross-document checks: every manifest item exists and every referenced
resource is in the manifest (`RSC-007`, `OPF-003`), fragment identifiers
resolve (`RSC-012`, which TASK-146 hit), spine/nav consistency, the `mimetype`
entry being first and stored, filename rules, fallback chains, CSS `url()`
and `@font-face` references, and media-type sniffing. These have to be
written by hand, but they are the most clearly specified parts and the
feature files cover them.

### Prior art in JS

| Project | Approach | Install size | Notes |
| ------- | -------- | ------------ | ----- |
| [`@likecoin/epubcheck-ts`](https://github.com/likecoin/epubcheck-ts) 0.7.0, BSD-3 | hand-written TS port | 4.4 MB, plus `libxml2-wasm` 1.2 MB, `css-tree`, `fflate` | started 2026-01, 6 stars. Its own measurement against 5.4.0: **95.9 %** valid/invalid agreement over 763 fixtures, 87.5 % on message IDs. **Schema validation ~55 %: XHTML/SVG RELAX NG is disabled** because libxml2's RELAX NG cannot handle the HTML5 grammar's custom datatypes. |
| [`epubcheck-standalone`](https://github.com/jlarmstrongiv/epubcheck-standalone), BSD-3 | real EPUBCheck compiled to JS with TeaVM | **22 MB** | started 2026-09, 1 star. Exact parity, but it is a bigger opaque blob than the JARs, so it does not meet the goal. |

`epubcheck-ts` is the useful reference. It shows that a hand-written port
reaches high agreement, and it shows where the hard part is. Its
`PROJECT_STATUS.md` explains how it measures parity: Java EPUBCheck's answers
are cached by fixture hash, so CI compares against Java without needing a JVM.

### What b-ber actually emits narrows the job a lot

`b-ber-templates` writes `version="3.0"` packages with an NCX for older
reading systems. b-ber produces no EPUB 2 publications, no media overlays,
encryption, signatures, dictionaries, indexes, EDUPUB, previews or multiple
renditions. The feature files for those profiles (about a third of the
suite) can be skipped without missing anything b-ber produces.

What can go wrong in b-ber output is mostly what the open bugs in this epic
already show: OPF metadata (#543, #544), XHTML content model (#542, TASK-056's
iframe attributes), broken internal links (TASK-146), manifest/spine coverage,
and author-supplied HTML, SVG, images and CSS.

### Dependencies

The existing tree already covers most of what a validator needs:

- **ZIP read/write**: `node:zlib` (`deflateRawSync`, `crc32`; the
  engines floor `^22.23.4` has both). A writer that puts `mimetype` first and
  stored is ~150 lines, which also removes the system `zip` call.
- **XML**: `htmlparser2` (already a dependency) in `xmlMode`, giving positions
  for line numbers. Needs a namespace-resolution layer and a well-formedness
  pass (EPUBCheck's `RSC-016`), which htmlparser2's error-tolerant parser does not do.
- **CSS**: `css-tree` and `postcss` are already dependencies.
- **RELAX NG**: no acceptable JS engine. `libxml2-wasm` fails the HTML5
  grammar (see above), `salve` is MPL-2.0 and needs its own schema
  conversion step. The recommended route is a **small RELAX NG validator
  written here**, using the derivative algorithm (James Clark,
  [*An algorithm for RELAX NG validation*](https://relaxng.org/jclark/derivative.html)),
  that loads EPUBCheck's grammars as data. The `.rnc` files can be converted
  to `.rng`/JSON once, at vendoring time, so no compact-syntax parser ships.
  The Nu-validator datatypes (`datetime`, `language`, `iri`, MIME types, …)
  are implemented as plain TS functions. **This is the biggest single piece
  of work and the main risk.**
- **Schematron**: the ~90 relevant EPUB 3 rules are hand-ported to TS rather
  than run through an XSLT engine. Saxon is the 5 MB JAR we are removing.

Net result: **zero new runtime dependencies**, one removed (`epub-zipper`),
plus vendored BSD/MIT schema files with their licence notices kept.

## Recommendation

Feasible, and worth doing as a phased build. The suggested phases below each
deliver something on their own, so the work can stop at any phase and still
have been useful.

1. **Native packaging.** Replace `epub-zipper`'s zip half with a `node:zlib`
   writer. Keep validation available as an *optional* external EPUBCheck
   (detected on `PATH`, current release), so nothing regresses while the
   native validator is incomplete. This alone removes the vendored JARs and
   the stale 4.2.2.
2. **Structural validator.** OCF + package document + NCX + nav +
   cross-references + fragment resolution, hand-coded, with no RELAX NG yet. This covers the open bugs in this epic.
3. **RELAX NG engine + HTML5 grammar.** XHTML/SVG content-model validation,
   the part `epubcheck-ts` gave up on.
4. **CSS and remaining checks**, driven by whatever the feature-suite diff
   still shows.

Throughout: a test harness that runs the in-scope EPUBCheck feature files
against the vendored fixtures, plus a parity script that compares message IDs
with cached Java EPUBCheck 5.4.0 output.

## Subtasks

- [x] Find an existing ticket. None exists; #541 is the closest, proposing an
      EPUBCheck upgrade rather than a replacement
- [x] Locate the specs (EPUB 3.3, 3.4 CR, 2.0.1) and machine-readable sources
      (EPUBCheck schemas, feature suite, message catalogue)
- [x] Survey JS prior art (`epubcheck-ts`, `epubcheck-standalone`)
- [ ] Decide EPUB 2 scope (see Open questions)
- [ ] Decide package placement (see Open questions)
- [ ] Spike: RELAX NG derivative engine against `package-30.rng` and
      `epub-nav-30.rng`, then against the HTML5 grammar. Measure speed on the
      kitchen-sink fixture
- [ ] Spike: list the in-scope feature files and count scenarios, to size
      phases 2–4
- [ ] Spike: `node:zlib` OCF writer; confirm the output passes EPUBCheck 5.4.0
      byte-for-byte on `mimetype` handling
- [ ] Split phases 1–4 into child tasks under this one once the spikes report

## Open questions

- **EPUB 2.** b-ber never produces EPUB 2, only an NCX inside an EPUB 3. EPUB
  2 is obsolete per the IDPF. Supporting it would add the OPF 2.0.1 grammar
  and the XHTML 1.1 DTD-derived OPS schema for no output b-ber makes.
  Recommendation: EPUB 3 + NCX only, and revisit if validating third-party
  EPUBs becomes a goal.
- **Package placement.** `b-ber-validator` already exists, but it is the
  *Markdown syntax* validator, not an EPUB one (AGENTS.md's inventory
  describes it as validating OPF/NCX/spine, which is wrong). A new package,
  e.g. `b-ber-epub-validator`, avoids overloading that name.
- **Interim for #541.** If phase 1 lands first, #541's "validate against a
  current EPUBCheck" is met by the optional external EPUBCheck, without
  vendoring it. Decide whether #541 closes then or stays open until phase 2.
- **Which spec revision is the target**: 3.3 (Recommendation) or 3.4 (CR,
  likely Recommendation in 2027). EPUBCheck 5.4.0's feature files already
  cite 3.4, so following them means following 3.4.

## Notes

- Licences: EPUBCheck schemas and fixtures BSD-3-Clause, HTML5 grammar MIT;
  both compatible with b-ber's GPL-3.0-or-later when vendored with notices.
- `epubcheck-ts`'s `PROJECT_STATUS.md` explains how to measure parity and lists
  its corpus pitfalls (stub images, basename addressing, version
  auto-detection). Read it before building the harness.
- `TASK-042`/`TASK-044` (E2E) plan an optional `java -jar epubcheck.jar`
  assertion; once phase 2 lands they should use this validator instead.
