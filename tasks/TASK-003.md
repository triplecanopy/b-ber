# TASK-003: Research type consolidation strategy across the monorepo

**Status:** complete
**Scope:** monorepo
**Priority:** medium
**GitHub Issue:** #458 — https://github.com/triplecanopy/b-ber/issues/458

## Description

As the monorepo moves toward TypeScript (TASK-002), shared types and interfaces
that currently exist as JSDoc comments, implicit shapes, or duplicated objects
across packages will need a home. This task researches where types currently
live, identifies what is shared or duplicated, and produces a recommendation
for how to organize types going forward.

## Subtasks

- [x] Audit existing type-adjacent code across all packages.
- [x] Identify types that are duplicated or closely mirrored across packages.
- [x] Evaluate placement options (A–D).
- [x] Decide whether types need to be published.
- [x] Write recommendation with rationale (see Research Findings below).
- [x] Open implementation tasks: covered by TASK-009 (shapes-directives first).

## Research Findings

### What type-adjacent information exists and where

**`b-ber-shapes-directives`**: Pure data — runtime constants and `Set`
collections defining every directive name and its allowed attributes. No JSDoc
annotations. **Consumed by 16 packages** (every grammar-_ and parser-_,
b-ber-lib, b-ber-validator). The most widely shared "shape" in the codebase.

**`b-ber-shapes-dublin-core`**: Pure data — two arrays of DCMI metadata term
strings. Consumed only by `b-ber-lib`.

**`b-ber-shapes-sequences`**: Pure data — build task sequence arrays per output
format plus a `createBuildSequence` helper. Consumed by `b-ber-lib`, `b-ber-cli`,
and `b-ber-tasks`.

**`b-ber-validator`** (`src/typings/`): The only TypeScript package. Has
hand-written `.d.ts` for its own types (`Parser<T>`, `Context`, `Result<T>`)
and a **partial ambient declaration for `b-ber-shapes-directives`** (only 5 of
~15 exported Sets are declared). These typings are local to the validator — not
published or re-exported. Converting `b-ber-shapes-directives` to TypeScript
would **eliminate this hand-maintained stub entirely**.

**`b-ber-reader-react`** (`index.d.ts`): A substantial hand-written `.d.ts`
covering the public API: `BberReaderProps`, `SpineItem`, `Spine`, `Metadata`,
all sidebar and navigation prop interfaces, enums (`Layout`, `SidebarName`).
This is the most complete type surface in the repo. It exists because the
reader is published and consumed externally. There is a `Download` interface
duplicated within the same file.

**`b-ber-lib`** (`src/`): Class-based model objects (`SpineItem`, `GuideItem`,
`Config`, `State`, `Spine`, etc.) that are the de facto shared data shapes for
the entire build pipeline. **No JSDoc type annotations exist** — zero
`@typedef`/`@param`/`@returns` in `b-ber-lib` or `b-ber-tasks`. Shapes are
implicit in class constructors.

### How much is shared vs package-local

- `b-ber-shapes-directives` constants/Sets: genuinely shared across 16 packages
- `b-ber-lib` model classes: implicitly shared across all build tasks via import
- `b-ber-reader-react` public API interfaces: package-local (external consumers)
- `b-ber-validator` typings: package-local
- Dublin Core and sequence data: narrow sharing (1–3 consumers each)

**There is no type duplication today — because there are essentially no types
yet.** The problem space is: implicit shapes encoded as class constructors in
`b-ber-lib` that every downstream package relies on structurally.

### Recommendation: Option D — convert shapes packages to TypeScript

**Convert `b-ber-shapes-directives` to TypeScript with `declaration: true` first.**

Rationale:

- It is the most widely consumed shapes package (16 dependents).
- The validator's `src/typings/b-ber-shapes-directives/index.d.ts` can be
  deleted immediately — a concrete reduction in maintenance surface.
- The package is pure data with no logic, making the TS migration trivial:
  rename `.js` → `.ts`, add explicit `Set<string>` annotations, add a tsconfig.
- It de-risks the TS migration approach for the other shapes packages and
  serves as a template for Stage 1 of TASK-002.

After `b-ber-shapes-directives`: repeat for `b-ber-shapes-dublin-core` and
`b-ber-shapes-sequences`.

**For `b-ber-lib` model classes:** address these as part of the TASK-002
incremental migration (Stage 1), not as a separate types exercise. Once the
classes are TypeScript, their inferred types are exported automatically via
`declaration: true` — no separate type home needed.

**No dedicated `b-ber-types` package needed** (Option A is premature — there
is no duplicated type surface to consolidate yet).

**No root `types/` directory needed** (Option C) — the shapes packages already
exist as the natural boundary and are already imported by the right consumers.

External publication of types is not a current requirement. `b-ber-reader-react/index.d.ts`
is the only externally consumed type surface and already exists.

## Notes

- TASK-002 and TASK-003 are now both in-progress with consistent conclusions:
  convert `b-ber-shapes-directives` first, let types flow from there.
- Do not create any new packages or move any files in this task.
