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
| `epub` | yes | compare the unzipped OPS tree, not the `.epub` (zip timestamps) |
| `web`, `reader`, `xml`, `sample` | yes | |
| `mobi`, `pdf` | no | need Calibre and wkhtmltopdf, which CI does not have |

### Known nondeterminism to normalize

Found while reading the code for TASK-148/149; the first run will find more.

- `dcterms:modified` in the OPF (build time) and the `generator` version
- footnote reference ids: `Counter.setRef` appends `crypto.randomBytes(8)`
- the reader build's directory name, derived from the book identifier
- anything carrying an absolute path of the temp fixture copy

Normalize these in one place, and keep the list in this file, so a
reviewer can see exactly what the snapshot ignores.

## Subtasks

- [ ] Build each in-scope format from a fresh fixture copy with the built CLI
      (`tests/cli/helpers.ts` already does the copy and the run)
- [ ] Normalizer for the cases above, with a unit test of its own
- [ ] Snapshot layout: one text file per output file, so a diff names the file
- [ ] `UPDATE_GOLDEN=1` to rewrite the snapshot; document it in
      b-ber-testing's AGENTS.md and the root AGENTS.md
- [ ] Run twice in a row and confirm no diff (catches missed nondeterminism)
- [ ] Runs in CI's `e2e` job

## Notes

- Related: TASK-153 (b-ber-tasks unit coverage), TASK-134 (types for the
  refactor), TASK-140/141 (manual output comparisons).
