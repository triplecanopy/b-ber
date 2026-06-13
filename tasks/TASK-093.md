# TASK-093: Consolidate the reader-react PLAN.md into the root PLAN.md

**Status:** not started
**Feature:** React 19 (reader-react)
**Scope:** b-ber-reader-react
**Priority:** medium
**GitHub Issue:** (add after running /sync-task-issues)

## Description

`packages/b-ber-reader-react/PLAN.md` is a second, parallel planning document
(~132 lines: status, modernization phases 1–5, known issues, dev setup). Now
that all reader-react tasks have been flattened into the root `tasks/` dir
(TASK-060–091) and the root PLAN.md is organized by feature, this second plan is
a split source of truth. Fold its still-relevant content into the root PLAN.md
and remove the package-level copy so there is one plan.

## Subtasks

- [ ] **Remap task numbers.** The reader-react PLAN references the old local
      numbering `TASK-001..032`; these were renumbered `+59` to root
      `TASK-060..091`. Translate every reference when merging (e.g. the doc's
      "Phase 1 (TASK-009)" → TASK-068; "Phase 4 TypeScript (TASK-013)" → the
      superseded TASK-072, now tracked as root TASK-032; "Phase 5 Redux
      (TASK-014)" → TASK-073).
- [ ] **Merge the Modernization Phases narrative** into the root PLAN's
      "⚛️ React 19 (reader-react)" feature section (or a linked appendix) — the
      phase framing (housekeeping → observers → deprecated-pattern removal → TS →
      Redux) is useful context the root PLAN currently lacks.
- [ ] **Triage "Known Issues (not yet tasked)."** For each, either open a root
      task (Feature: React 19) or fold it into an existing reader-react task;
      don't lose them in the merge.
- [ ] **Relocate package-only content.** The "What This Is" and "Development"
      (local dev setup) sections are package documentation, not project planning
      — move them into `packages/b-ber-reader-react/AGENTS.md` rather than the
      root PLAN.
- [ ] **Delete** `packages/b-ber-reader-react/PLAN.md` and grep the repo for any
      links to it; update or remove them.
- [ ] **Verify** the root PLAN still reconciles (every referenced TASK-NNN
      exists) and reads as a single coherent plan.

## Notes

Branch: `feat/upgrades`

Continues the task-system flatten (2026-06-11) that moved
`packages/*/tasks/` into root and reorganized PLAN.md by feature. This is the
last split planning artifact.

Related: [[TASK-032]] (reader-react TS, canonical), [[TASK-073]] (Redux),
[[TASK-068]] (Phase 1 housekeeping).
