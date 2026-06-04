# TASK-057: Simplify root build script using Lerna topological sort

**Status:** not started
**Scope:** monorepo
**Priority:** medium
**GitHub Issue:** (add after creating the issue)

## Description

TASK-054 established that Lerna 8.2.4 sorts builds topologically by default and
that the `file:../b-ber-reader-react` devDependency in `b-ber-reader` already
encodes the graph edge Lerna needs to sequence the builds correctly. The root
`build` script can be collapsed to a single `lerna run build` call, and the
`reader:shim` step can be removed entirely.

## Subtasks

- [ ] Replace the `build` script in root `package.json` with `lerna run build`
- [ ] Remove `&& npm run reader:shim` from the `bootstrap:clean` script in root
      `package.json`
- [ ] Optionally: remove the `reader:shim` script itself (or keep as maintenance
      utility — note either decision)
- [ ] Run `npm run build` from the monorepo root and verify that reader-react
      builds before reader (check the log output order)
- [ ] If reader builds before reader-react (Lerna not sorting devDependencies),
      move `@canopycanopycanopy/b-ber-reader-react` from devDependencies →
      dependencies in `packages/b-ber-reader/package.json` and re-run
- [ ] Run `npm run bootstrap:clean` and verify clean install + build succeeds
- [ ] Run `npm test` — confirm no regressions

## Acceptance Criteria

- `npm run build` produces `packages/b-ber-reader/dist/` without manual
  intervention or a separate shim step
- `npm run bootstrap:clean` works end-to-end from a clean state
- `npm test` passes

## Notes

Recommended change to root `package.json`:

```diff
-"build": "npm run lerna run build -- --scope=@canopycanopycanopy/b-ber-reader-react && npm run reader:shim && npm run lerna run build -- --scope=\"@canopycanopycanopy/{$(echo `ls packages` | sed 's/ /,/g' | sed -E 's/b-ber-reader-react,?//')}\"",
+"build": "lerna run build",
-"bootstrap:clean": "lerna clean --yes && npm install && npm run reader:shim && npm run build",
+"bootstrap:clean": "lerna clean --yes && npm install && npm run build",
```

See TASK-054 for the full research notes and risk analysis.
