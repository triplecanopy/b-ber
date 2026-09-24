# TASK-113: Discovery — does `watch` mode still support core build functionality?

**Epic:** Upgrade tooling
**GitHub Issue:** #588 — https://github.com/triplecanopy/b-ber/issues/588
**Scope:** monorepo

## Description

Discovery/debug task. TASK-112 found that `b-ber-tasks`'s build has two steps —
`tsdown` (bundle) then `copy.sh` (non-JS assets) — but its **watch script only
runs the first**:

```json
"build": "tsdown && npm run copy",
"watch": "tsdown --watch",
```

`tsdown.config.ts` also sets `clean: true`, and a build run reports
`Cleaning 10 files`. So starting watch mode wipes `dist/` — including the font
and the four browser scripts that `copy.sh` placed there — and never restores
them, because `copy.sh` is not part of the watch path. Anyone developing against
watch mode has a `dist/` that is missing exactly the assets TASK-112 just fixed,
until they remember to run a full `npm run build`.

This is the same design weakness TASK-112 patched from the other end: the copy
step is a bolt-on that the bundler does not know about, so it can silently fall
out of sync with the bundle (wrong destination — TASK-112) or not run at all
(watch — this task).

The watch scripts were standardised across build-producing packages in TASK-038
(from TASK-047's research), so the gap may not be limited to `b-ber-tasks`.

### What this task should establish

1. **Confirm the failure mode.** Run `npm run watch` in `b-ber-tasks` and check
   whether `dist/` is left without the copied assets, and what a build driven
   from that state actually does (likely the same ENOENT as TASK-112).
2. **Survey the other packages.** `b-ber-tasks` is the only package with a
   `copy.sh`, but check every build-producing package for a `build` script that
   does more than its `watch` script does. Do the watch scripts standardised in
   TASK-038 all produce a `dist/` equivalent to `npm run build`?
3. **Decide the fix.** tsdown exposes both a `hooks` config option
   (`'build:prepare' | 'build:before' | 'build:done'`, typed in
   `tsdown/dist/types-*.d.mts`) and a built-in `copy` feature (`CopyOptions` /
   `CopyEntry`). Either would tie asset copying to the build itself so it runs
   on every rebuild including watch, and would let `copy.sh` be retired. The
   uglify step for the four browser scripts needs somewhere to live under that
   approach — evaluate whether a `build:done` hook shelling out, a small rolldown
   plugin, or keeping a script invoked from the hook is cleanest.
4. **Check whether watch mode is actually used.** If nobody develops
   `b-ber-tasks` in watch mode, the priority drops to "fix it because it's a
   trap", not "fix it because it's blocking someone". Worth asking before
   investing in a plugin.

## Subtasks

- [ ] Reproduce: `npm run watch` in `b-ber-tasks`, inspect `dist/`, attempt a
      project build against it
- [ ] Audit every build-producing package for `build`/`watch` script asymmetry
- [ ] Evaluate tsdown `hooks['build:done']` vs. the built-in `copy` option vs.
      keeping `copy.sh` (note where the uglify step lands in each)
- [ ] Confirm whether `clean: true` should stay on in watch mode
- [ ] Recommend and, if the fix is small and low-risk, implement it — otherwise
      open an implementation task
- [ ] If implemented: verify `npm run watch` yields a `dist/` equivalent to
      `npm run build`, and that a real project build works against it

## Notes

- Split out of TASK-112 (the `__dirname`/flat-bundle asset fix) to keep that
  patch release tight. TASK-112 fixed *where* assets go; this task asks whether
  the copy step should exist as a separate script at all.
- The guard added to `copy.sh` in TASK-112 does **not** cover this case: it
  verifies assets after a copy runs, and under watch the copy never runs.
- Deliberately scoped as discovery. It may conclude that no further change is
  needed beyond documenting "run `npm run build` before testing a real build",
  which is a legitimate outcome — record it and close.
- Related: TASK-112 (the asset-path fix), TASK-038 (applied the watch scripts),
  TASK-047 (watch-mode research), TASK-030 (introduced the tsdown build for
  `b-ber-tasks`).
