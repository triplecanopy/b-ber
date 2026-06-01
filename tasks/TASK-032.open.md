# TASK-032: Convert b-ber-reader-react to TypeScript (Stage 4)

**Status:** not started
**Scope:** b-ber-reader-react
**Priority:** low
**GitHub Issue:** #487 — https://github.com/triplecanopy/b-ber/issues/487

## Description

Stage 4 of the TypeScript migration: convert `b-ber-reader-react` to
TypeScript and TSX. This is the browser-side React + Redux EPUB reader — the
largest and most complex package in the monorepo.

**This task is blocked until TASK-006 (Vite migration) is complete.** The
current webpack build is being replaced with Vite; TypeScript support in
`b-ber-reader-react` is Vite-native and should not be attempted with the
webpack setup. Once Vite is in place, TS/TSX is first-class and free.

Do not start this task until `feat/vite-migration` has been merged into
`feat/upgrades`.

## Subtasks

- [ ] Confirm TASK-006 (Vite migration) is merged before starting
- [ ] Audit current test setup: the reader-react jest config uses a custom
      `jest-transform-upward.js` shim for the root Babel config. When adding
      TypeScript, update the jest config to use `ts-jest` for `.tsx?` files
      and update `testMatch` to include `tsx?` patterns.
- [ ] Audit component files: all new components since TASK-002 planning should
      be functional (no class components). Verify before converting.
- [ ] Convert `.js`/`.jsx` → `.ts`/`.tsx`; add type annotations
- [ ] Type Redux store: add types for actions, reducers, and store state shape
- [ ] Add `tsconfig.json` extending `../../tsconfig.base.json` with JSX support:
      `"jsx": "react"` (or `"react-jsx"` if React 17+ automatic transform is in use)
- [ ] Update `vite.config` to handle TSX (should be automatic with
      `@vitejs/plugin-react`)
- [ ] Run `npm test` from root; verify reader-react suite passes
- [ ] Update TASK-029 subtask checklist (or open a Stage 4 parent task at that time)

## Notes

Branch: TBD — likely `feat/ts-stage-4` off `feat/upgrades`, or as part of a
follow-on to `feat/vite-migration`.

`b-ber-reader` (the legacy non-React reader) is intentionally excluded from
the TypeScript migration. It is a thin deployment shell with no active
development; leave it as JavaScript indefinitely.

This task is created now to document intent and blockers, not to start work.
Re-evaluate scope and approach once TASK-006 is underway and the Vite build
shape is known.

Related: [[TASK-006]] (Vite migration, must complete first),
[[TASK-002]] (migration strategy), [[TASK-029]] (Stage 3 parent).
