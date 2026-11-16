# TASK-155: Refresh the reader golden snapshot for react-player's Preview chunk

**Epic:** E2E testing
**GitHub Issue:** #786 — https://github.com/triplecanopy/b-ber/issues/786
**Scope:** testing

## Description

`main` has failed `e2e` since #783 (Renovate: React 19.3.1, react-player
2.11.0 → 2.16.1) merged. Every PR's `e2e` job now fails the same way,
because CI tests each PR merged with `main`.

The failure is the golden-output test (TASK-152) for the reader build: its
list of output files has one more entry, `assets/Preview-{hash}.js`.
react-player 2.16 lazy-loads its light-mode `Preview` component
(`lib/ReactPlayer.js`: `lazy(() => import('./Preview'))`), and Vite puts the
dynamic import in its own chunk. The reader tests in Chromium pass against
that build, so the output change is expected, and the snapshot is what is out
of date.

#783 merged with `e2e` red because `e2e` is not a required check.

## Subtasks

- [x] Confirm the new file comes from the dependency update, not a defect
- [x] Regenerate `tests/cli/__golden__/reader/FILES.txt`
- [x] The golden-output test passes for epub, web, reader and sample
- [x] Make `e2e` a required check, and say so in the AGENTS.md files

## Notes

- `e2e` was made a required check on `main` on 2026-11-16, alongside
  `build-and-test`, in the "Base Rules" ruleset, so a Renovate PR cannot
  merge with it red again. The root AGENTS.md records it.
