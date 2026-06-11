# TASK-060: Reader/index.jsx — class to functional component migration

**Status:** complete
**Feature:** React 19 (reader-react)
**Phase:** Modernization — Phase 3
**Created:** 2026-04-04
**GitHub Issue:** #461 — https://github.com/triplecanopy/b-ber/issues/461

## Description

Convert `src/components/Reader/index.jsx` from a class component to a functional
component. This is the central orchestrator of the reader and the largest class
component remaining after the initial codebase audit.

## Approach

Use a `selfRef` / `stateRef` / `propsRef` shim so the external modules
(`navigation.js`, `loader.js`, `resize.js`) can continue using `this.state` and
`this.props` without being rewritten in this step. This keeps the diff minimal
while eliminating the deprecated lifecycle methods.

Lifecycle replacements:

- `UNSAFE_componentWillMount` → `useEffect` (empty deps, guarded by `hasInitialized` ref)
- `componentDidMount` → `useEffect` (empty deps)
- `componentWillUnmount` → `useEffect` cleanup
- `UNSAFE_componentWillReceiveProps` → two targeted `useEffect` hooks

## Subtasks

- [x] Convert Reader to functional component with `useState` + `useEffect`
- [x] Build `selfRef` shim so `navigation.js`, `loader.js`, `resize.js` still work
- [x] Replace `UNSAFE_componentWillMount` with guarded `useEffect`
- [x] Replace `componentDidMount` / `componentWillUnmount` with `useEffect`
- [x] Replace `UNSAFE_componentWillReceiveProps` with `useEffect` + `useRef` prev-value tracking
- [x] Memoize `ReaderContext.Provider` value (fixes IMPROVEMENT_PLAN H5)
- [x] Show spinner at init before OPF fetch (fixes IMPROVEMENT_PLAN C5)

## Notes

- The `selfRef` pattern is explicitly temporary. In a later phase (`navigation.js`,
  `loader.js`, `resize.js` will be extracted into custom hooks and the shim removed.
- Initial migration introduced several bugs fixed in subsequent tasks (TASK-061, TASK-062).
- Commit: `69b394ec`
