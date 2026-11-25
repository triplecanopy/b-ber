# TASK-165: Migrate build tasks to typed functions of the build context

**Epic:** Build pipeline & directive redesign
**GitHub Issue:** #828 — https://github.com/triplecanopy/b-ber/issues/828
**Scope:** b-ber-tasks, b-ber-shapes-sequences

## Description

Plan step 3 of [TASK-160](./TASK-160.md).

Tasks pass data to each other by writing lodash path strings into `State`.
Each becomes `(ctx, inputs) → outputs`, and a target's `build` is a plain
async function that reads top to bottom. `step(ctx, name, fn)` replaces
`serialize`, and emits the logger's start and stop events.

Migrate in data-flow order: render → loi → footnotes → opf → the packagers,
then the rest. Each migrated task stops importing `State`.

The task singletons hold state across `await`s, so they would leak between
concurrent targets: `cover`, `container`, `footnotes` and `generate`, created
at import time, and `web`'s module-level `let`s. They become plain functions
here. That is what makes TASK-166's fan-out safe.

## Subtasks

- [ ] render, loi, footnotes and opf return their outputs, one commit each
- [ ] The packagers (epub, mobi, pdf, web, reader, sample, xml)
- [ ] The rest (clean, container, cover, sass, copy, scripts, inject)
- [ ] No task singleton or module-level mutable state left in `b-ber-tasks`
- [ ] Remove `serialize` and the sequences in `b-ber-shapes-sequences`
- [ ] Golden output unchanged at every commit

## Notes

- Design: [TASK-160](./TASK-160.md), "The pieces", and Findings, "spike", conclusion 4.
- Depends on TASK-163 and TASK-164. TASK-166 needs it complete.
