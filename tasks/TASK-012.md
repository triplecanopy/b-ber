# TASK-012: Convert b-ber-lib to TypeScript

**Status:** complete
**Feature:** Migrate JS→TS
**Scope:** lib
**Priority:** high
**GitHub Issue:** #497 — https://github.com/triplecanopy/b-ber/issues/497

## Description

Convert `b-ber-lib` to TypeScript. This is the most important Stage 1
conversion: `b-ber-lib` exports the model classes (`State`, `SpineItem`,
`Config`, `Theme`, `Url`, `Yaml`, etc.) that the entire build pipeline depends
on. Once converted, every downstream package (tasks, parsers, grammars, cli)
gains types from their most common dependency.

**Depends on TASK-008. Should be done after TASK-009–TASK-011 so that
`b-ber-shapes-*` and `b-ber-logger` already have `.d.ts` files when tsc
processes `b-ber-lib`'s imports.**

## Branch

`feat/ts-stage-1`.

## Subtasks

- [x] Audit `packages/b-ber-lib/src/` — document every public export and its
      approximate shape. Key classes: `State`, `SpineItem`, `GuideItem`, `Spine`,
      `Config`, `Theme`, `Url`, `Yaml`, `YamlAdaptor`, `HtmlToXml`, `Template`,
      `ManifestItemProperties`, `EbookConvert`. Also audit `src/utils/index.js`.
- [x] Install TypeScript and any needed `@types/*` packages:
  - `@types/fs-extra` (for the fs-extra import)
  - `@types/lodash` (lodash is used in several files)
  - `@types/node` (for Node built-ins)
  - `@types/js-yaml@3.x` (matching js-yaml v3 API)
  - `@types/mime-types`, `@types/vinyl` (other untyped deps)
- [x] Add `tsconfig.json` and `tsconfig.build.json` using the base template.
- [x] Rename `src/*.js` and `src/utils/*.js` to `.ts` one file at a time.
- [x] For each file conversion:
  - Add type annotations to public method signatures
  - Use explicit `any` for hard cases with `// TODO: type this` comment
  - Do not change behavior — type-annotation pass only
- [x] Add `build` script; update `"main"` and `"types"` in `package.json`.
- [x] Run `tsc` and fix all type errors. Keep the error count moving down —
      do not leave broken intermediate states in the branch.
- [x] Remove or re-evaluate the `!**/b-ber-lib/*.js` and
      `!**/b-ber-lib/utils/*.js` coverage exclusions from the root `jest.config.js`
      (these patterns were never present; covered by existing `!**/dist/**` rule).
- [x] Run `npm test` from the monorepo root — all suites must pass.
- [x] Commit: `feat(lib): convert to TypeScript`

## Notes

- `State` singleton: exported as `export default new State()`. Class type also
  exported as `StateClass` via `export type { State as StateClass }` for consumers
  who need the class type reference.
- `Config` constructor returns a plain object via `defaultsDeep` (POJO pattern).
  `ConfigOptions` interface exported; constructor uses `as unknown as Config` cast.
  `State.config` typed as `ConfigOptions`.
- Ambient module declarations added in `src/declarations.d.ts` for untyped deps:
  `yawn-yaml/cjs`, `layouts`, `command-exists`.
- `@types/js-yaml@3.x` installed (not v4) to match js-yaml v3 `safeLoad`/`safeDump` API.
- `tar` removed from runtime deps (was unused).
- `@babel/runtime-corejs3` and all Babel devDeps removed.
- `yawn-yaml/cjs` initial stub data: `{ yaml: '', json: () => ({}) }` — `json`
  must be a function before `load()` is called; tests assert this.
- Root `tsconfig.json` updated to reference `packages/b-ber-lib`.
- Committed as (TBD). All 187 package tests pass; monorepo baseline unchanged.
- After this task, Stage 1 is complete and Stage 2 (parsers, grammars,
  markdown-renderer, templates) can begin on a new branch `feat/ts-stage-2`.
- See TASK-002 for full migration sequence and risks.
