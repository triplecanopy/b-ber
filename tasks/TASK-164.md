# TASK-164: Define targets with feature flags instead of state.build checks

**Epic:** Build pipeline & directive redesign
**GitHub Issue:** #827 — https://github.com/triplecanopy/b-ber/issues/827
**Scope:** b-ber-tasks, b-ber-templates, grammar packages, b-ber-lib

## Description

Plan step 2 of [TASK-160](./TASK-160.md).

37 places branch on `state.build`. 28 of them are behaviour, and become six
`TargetFeatures` flags plus a figure-template table that each target owns.
The other 9 use the name as an identifier and become `ctx.target.name`.
[TASK-160](./TASK-160.md)'s Findings list every site with file and line.

```ts
interface TargetFeatures {
  liveEmbeds: boolean              // web, reader
  fullbleedContainers: boolean     // web, reader
  figuresOn: 'page' | 'titlepage'  // reader: 'titlepage'
  readerRuntime: boolean           // reader
  nonLinearSpine: boolean          // false for mobi
  coverPage: boolean               // false for pdf
}
```

Render code branches on features, never on the name. A check fails on a
`target.name` comparison in grammar, parser or template code. pdf, sample
and xml name the epub figure templates explicitly, ending today's silent
fallback.

## Subtasks

- [ ] `Target` definitions for the seven targets, with `features` and `figureTemplates`
- [ ] Replace the 28 behaviour branches, one group per commit, with no output change
- [ ] The check against `target.name` comparisons in render code
- [ ] Fix `SpineItem.absolutePath`'s hardcoded `project-<build>` (#757), which also fixes `bber build xml` (#766)
- [ ] Fix serve's `src`/`dist`; flip TASK-153's defect tests

## Notes

- Design: [TASK-160](./TASK-160.md), "The pieces", "What a target exposes to a project", and
  Findings, "every `state.build` branch, grouped".
- Depends on TASK-163.
