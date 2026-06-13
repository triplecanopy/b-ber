# TASK-091: Upgrade react-player from v2 to v3 (ESM)

**Status:** not started
**Feature:** React 19 (reader-react)
**Phase:** Dependencies
**Priority:** low
**Model:** Sonnet 4.6 — contained dependency upgrade; verify media playback in
the browser after.

> Read [`MIGRATION-CONVENTIONS.md`](../packages/b-ber-reader-react/MIGRATION-CONVENTIONS.md)
> first — the verification gate (§1) applies.
**Created:** 2026-06-10

## Description

`react-player@2.11.0` and its dependency `react-fast-compare@3.2.0` are CJS-only
and call `require('react')` internally. In the externalized-React ESM lib build,
those compile to rolldown `require()` shims — most of the 8 shimmed
`require("react")` call sites in `dist/index.js` come from react-player. We
mitigated the runtime failure with a `require` banner in `vite.config.lib.js`
(see [[project-reader-react-require-shim]]), but the underlying CJS deps remain.

`react-player@3.x` (current latest 3.4.0) is a full ESM rewrite. Upgrading would
let the bundler resolve react via ESM `import` instead of a CJS `require`,
removing the react-player and react-fast-compare shim call sites.

This does **not** remove the banner entirely: `react-redux@9` still depends on
the CJS-only `use-sync-external-store`, which also does `require('react')`. So at
least one shimmed require remains regardless, and the banner stays. This task is
a reduction/modernization, not a fix — react-player v2 works today via the banner.

## Subtasks

- [ ] Review react-player v3 breaking changes (API/props/component structure
      changed — this is **not** a drop-in upgrade)
- [ ] Update usage sites in `src/` to the v3 API
- [ ] Bump `react-player` to `^3` (drops the transitive `react-fast-compare`)
- [ ] Rebuild the lib; confirm react-player/react-fast-compare `x("react")` shim
      call sites are gone from `dist/index.js`
- [ ] Confirm the remaining `use-sync-external-store` require still resolves via
      the banner (it must — keep the banner)
- [ ] `npm test`; verify audio/video playback in the reader; commit; update
      `PLAN.md`; remove `.open`

## Notes

- Weigh the v3 migration effort against the benefit: it's a cleanup, not a
  correctness fix. The banner already makes the current build robust.
- Verify against a project that exercises media embeds (audio/video directives)
  when confirming the upgrade.
