# AGENTS.md — b-ber-shapes-sequences

## What This Is

A data package that defines the ordered build task sequences for each b-ber output format. It exports a `build` array (the shared base sequence: clean, container, cover, sass, copy, scripts, render, loi, footnotes, inject, opf) and a `sequences` object mapping each format (epub, mobi, pdf, web, sample, reader, xml) to the base sequence extended with format-specific tail tasks. `createBuildSequence` is a helper that filters a caller-supplied list of desired format names against the known sequences and returns the matched keys, defaulting to all formats if none match.

## Key Files

| File                           | Purpose                                                           |
| ------------------------------ | ----------------------------------------------------------------- |
| `src/index.js`                 | Re-exports `sequences` and `createBuildSequence`                  |
| `src/sequences/index.js`       | `build` base array and `sequences` format map                     |
| `src/create-build-sequence.js` | `createBuildSequence` helper function                             |
| `__tests__/index.test.js`      | Tests for `build` array shape and per-format sequence composition |

## Dev Commands

```
npm test   # runs jest; tests verify base array and format-keyed sequences
```

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- Task names in `build` and `sequences` must exactly match the task module names registered in the b-ber CLI
- Adding a new output format requires entries in both `sequences/index.js` and any CLI command that calls `createBuildSequence`
- This package has no runtime side effects; keep it data-only

## Task System

Tasks for this package are tracked in tasks/ using the same PRD format as the
root AGENTS.md. No tasks are currently open. To add a task, create
tasks/TASK-NNN.open.md following the format in the root AGENTS.md.
