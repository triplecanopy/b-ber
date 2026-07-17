# TASK-093: Consolidate the reader-react PLAN.md into the root PLAN.md

**Status:** complete
**Feature:** React 19 (reader-react)
**Scope:** b-ber-reader-react
**Priority:** medium
**GitHub Issue:** (none)

## Description

`packages/b-ber-reader-react/PLAN.md` is a second, parallel planning document
(~132 lines: status, modernization phases 1–5, known issues, dev setup). Now
that all reader-react tasks have been flattened into the root `tasks/` dir
(TASK-060–091) and the root PLAN.md is organized by feature, this second plan is
a split source of truth. Fold its still-relevant content into the root PLAN.md
and remove the package-level copy so there is one plan.

## Subtasks

- [x] **Remap task numbers.** Old local `TASK-001..032` refs translated to root
      IDs when folding content (e.g. Phase 1 → TASK-068, Phase 4 TS → TASK-032,
      Phase 5 Redux → TASK-073).
- [x] **Merge the Modernization Phases narrative** — superseded by a fresh,
      accurate migration plan in the root PLAN's "⚛️ React 19 (reader-react)"
      section (the old phase plan was both stale, Phase 4/TS done, and
      undercounted the remaining class→functional/HOC surface).
- [x] **Triage "Known Issues (not yet tasked)."** Folded into the root PLAN React
      section as a "Known issues / tech debt" subsection; none lost.
- [x] **Relocate package-only content.** "What This Is" / "Development" already
      lived in `packages/b-ber-reader-react/AGENTS.md`; no move needed. Updated
      AGENTS.md to point at the root PLAN/tasks and corrected stale `.jsx`→`.tsx`
      key-file paths + the test count.
- [x] **Delete** `packages/b-ber-reader-react/PLAN.md`; grepped repo — no
      lingering links remain.
- [x] **Verify** the root PLAN reconciles and reads as a single coherent plan.

## Notes

Branch: `feat/upgrades`. Completed 2026-06-13.

Continued the task-system flatten (2026-06-11) that moved `packages/*/tasks/`
into root and reorganized PLAN.md by feature. This was the last split planning
artifact — the monorepo now has exactly one plan (root `PLAN.md`).

Related: [[TASK-032]] (reader-react TS, canonical), [[TASK-073]] (Redux),
[[TASK-068]] (Phase 1 housekeeping).
