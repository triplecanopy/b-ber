# TASK-057: Simplify root build script using Lerna topological sort

**Status:** complete
**Scope:** monorepo
**Priority:** medium
**GitHub Issue:** (add after creating the issue)

## Description

TASK-054 established that Lerna 8.2.4 sorts builds topologically by default and
that the `file:../b-ber-reader-react` devDependency in `b-ber-reader` already
encodes the graph edge Lerna needs to sequence the builds correctly. The root
`build` script can be collapsed to a single `lerna run build` call, and the
`reader:shim` step can be removed entirely.

The `file:../b-ber-reader-react` specifier is also an artifact from before
workspaces were fully in place. Since `b-ber-reader-react` is a workspace member,
npm resolves it by name — a plain semver specifier (`"*"`) is cleaner and removes
the only path-coupled reference in reader's `package.json`. Lerna matches the
graph edge by package name regardless of specifier type, so the build order is
unaffected.

## Subtasks

- [x] Replace the `build` script in root `package.json` with `lerna run build`
- [x] Remove `&& npm run reader:shim` from the `bootstrap:clean` script in root
      `package.json`
- [x] Remove the `reader:shim` script itself
- [x] Change `"@canopycanopycanopy/b-ber-reader-react": "file:../b-ber-reader-react"`
      to `"@canopycanopycanopy/b-ber-reader-react": "*"` in
      `packages/b-ber-reader/package.json` devDependencies
- [x] Run `npm run build` — reader-react builds before reader (confirmed via log order)
- [x] Lerna v8 sorts devDependencies correctly; no need to move to dependencies
- [x] Run `npm test` — 84 suites, 649 tests, all pass

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
