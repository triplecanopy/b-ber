# TASK-152: Golden-output test for every build format

**Epic:** E2E testing
**GitHub Issue:** #763 — https://github.com/triplecanopy/b-ber/issues/763
**Scope:** testing

## Description

A safety net for the coming refactor, which has no plan yet but will land in
`b-ber-tasks` and `b-ber-cli` first (TASK-134). Types now catch a broken
signature. Nothing catches changed output: the e2e suite asserts that builds
exit 0 and that a few files exist, and b-ber-tasks has 13% unit coverage
(TASK-153).

The test builds `fixtures/kitchen-sink`, which exercises every directive, with
the **built** CLI for each deterministic format, normalizes the output, and
compares it with a committed snapshot. A refactor that changes no behaviour
leaves the snapshot alone. One that does shows the exact files and lines, and
updating the snapshot is a reviewed change in the PR.

It runs against the built CLI, not `src/`, on purpose. 4.0.0 shipped broken
because tsdown's bundle broke `__dirname` asset reads (TASK-112), which a test
of the source would have passed. It also means this does not raise Jest's
coverage number; that is TASK-153.

TASK-140 and TASK-141 proved "no behaviour change" this way by hand, and
TASK-143's notes proposed it as a job.

### Scope

| Format | In | Why |
| ------ | -- | --- |
| `epub` | yes | the unzipped `_builds-epub/` tree, not the `.epub` (zip timestamps). The build exits 1 after writing everything, when EPUBCheck rejects the iframe figure (TASK-056), so its exit code is not asserted |
| `web`, `reader`, `sample` | yes | |
| `xml` | no | broken on `main`: it reads `project-xml/`, but output is in `_builds-xml/` (#766) |
| `mobi`, `pdf` | no | need Calibre and wkhtmltopdf, which CI does not have |

### What the snapshot ignores

Each rule is in `tests/cli/golden/normalize.ts` and pinned by
`tests/cli/normalize.spec.ts`. Everything else is compared exactly.

| Rule | Why |
| ---- | --- |
| The fixture copy's absolute path → `{fixture}` | a temp directory; the reader manifest embeds it |
| ISO date-times → `{timestamp}` | `dcterms:modified`, the manifests' `modified` |
| `b-ber@x.y.z` → `b-ber@{version}` | the OPF's generator meta |
| Random 16-hex ids → `{id:N}`, numbered across the build | OPF metadata ids and their `refines`; footnote ids (`Counter.setRef`) and their links. Consistent numbering keeps every link checkable |
| Vite's content hash in `assets/` names → `{hash}`; those files are listed, not compared | b-ber-reader-react's own bundle, which changes with every reader change and has the reader e2e suite |
| OPF `<manifest>` items sorted | written in async directory-walk order, which varies between runs |
| `manifest.json` `resources` sorted (`readingOrder` untouched) | the same walk |
| `search-index.json` sorted by URL, `id` dropped | written and numbered in chapter completion order |
| OPF one element per line | readability only: the OPF is one 4,800-character line |
| Binaries and text over 64 KB compared by SHA-256 | images, media, fonts, vendored `lunr.js` |

The three ordering rules mean b-ber's builds are not byte-reproducible today.
Sorting at the source would make those rules unnecessary; that is a behaviour
change and left for later.

## Subtasks

- [x] Build each in-scope format from a fresh fixture copy with the built CLI
      (`tests/cli/helpers.ts` already does the copy and the run)
- [x] Normalizer for the cases above, with a unit test of its own
- [x] Snapshot layout: one text file per output file, so a diff names the file,
      plus `FILES.txt` per format listing every file (hashes for binaries)
- [x] Regenerating: Playwright's own `--update-snapshots`, rather than an
      `UPDATE_GOLDEN` variable; documented in b-ber-testing's AGENTS.md and the
      root AGENTS.md
- [x] Run repeatedly and confirm no diff (catches missed nondeterminism)
- [x] Fails when output changes: a one-word edit to the footnote parser's
      output failed all four formats, naming the one changed file in each
- [ ] Runs in CI's `e2e` job, on Linux, against the snapshot made on macOS

## Notes

- Related: TASK-153 (b-ber-tasks unit coverage), TASK-134 (types for the
  refactor), TASK-140/141 (manual output comparisons).
