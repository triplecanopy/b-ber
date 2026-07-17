# TASK-094: Establish React 19 migration conventions

**Status:** complete
**Feature:** React 19 (reader-react)
**Scope:** b-ber-reader-react
**Phase:** Modernization — Step 0 (foundation for Steps 1–2)
**Priority:** high
**Model:** Opus — sets the patterns every other wave task follows; high-judgment.

## Description

Define the single, consistent set of conventions for the React 19 modernization
so the many small wave tasks (TASK-095–100 + state-management work) don't each
re-derive how to convert a class to a function, an HOC to a hook, or how to keep
behavior identical. This is the foundation task — every wave task references it.

**Deliverable:** [`packages/b-ber-reader-react/MIGRATION-CONVENTIONS.md`](../packages/b-ber-reader-react/MIGRATION-CONVENTIONS.md).

It codifies:

- The golden rule (behavior preserved exactly; these are conversions, not redesigns).
- The verification gate per commit: `npm test` (no regression), **9 snapshots
  unchanged** (a changed snapshot = a bug, never re-record), `tsc --noEmit`
  clean, targeted browser QA only where layout/media is touched.
- Commit discipline: one conversion per commit.
- The class→functional mechanical mapping (incl. the `UNSAFE_componentWillMount`
  ordering caveat and "keep `connect()` for now").
- The HOC→hook pattern (convert consumers to functional first; one HOC + its
  consumers per commit; dissolve TASK-032's injected-prop `any` clusters).
- Scope discipline (no spread/polling bug fixes, no state-arch changes, no reorg).
- Conversion order + the rationale (components before HOCs).
- Model guidance (Sonnet for mechanical, Opus for high-judgment).

## Subtasks

- [x] Write `MIGRATION-CONVENTIONS.md` covering the above
- [x] Verify the conversion order against the real consumer graph
      (with-node-position ← Marker/Media/Vimeo/Iframe; with-iframe-position ←
      Vimeo/Iframe; with-dimensions ← Layout; with-navigation-actions ← Controls)
- [x] **User review** of the conventions doc (2026-06-13)
- [x] Incorporate review feedback round 1: added **§3c — state updates and
      automatic batching across the React 16.2–19 peer range** (the one place a
      literal `setState`→setter translation can diverge at runtime); noted
      snapshots don't catch it; flagged TASK-096/100 as the batching-sensitive
      conversions. Confirmed React 19.1 installed; no `flushSync` in use today.
- [x] User confirms the §3c wording reads right (2026-06-13); marked complete

## Notes

- This is documentation only — no source changes.
- The doc lives in the package (next to `AGENTS.md` / `READER_BUGS.md`) so it
  travels with the code; the root `PLAN.md` React section links the migration.
- Related: [[TASK-032]] (TS type-debt notes — the `any` clusters this migration
  dissolves), [[TASK-073]] (state research), [[TASK-095]]–[[TASK-100]] (the waves).
