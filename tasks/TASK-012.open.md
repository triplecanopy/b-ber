# TASK-012: Convert b-ber-lib to TypeScript

**Status:** not started
**Scope:** lib
**Priority:** high

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

- [ ] Audit `packages/b-ber-lib/src/` — document every public export and its
      approximate shape. Key classes: `State`, `SpineItem`, `GuideItem`, `Spine`,
      `Config`, `Theme`, `Url`, `Yaml`, `YamlAdaptor`, `HtmlToXml`, `Template`,
      `ManifestItemProperties`, `EbookConvert`. Also audit `src/utils/index.js`.
- [ ] Install TypeScript and any needed `@types/*` packages:
  - `@types/fs-extra` (for the fs-extra import)
  - `@types/lodash` (lodash is used in several files)
  - `@types/node` (for Node built-ins)
- [ ] Add `tsconfig.json` and `tsconfig.build.json` using the base template.
- [ ] Rename `src/*.js` and `src/utils/*.js` to `.ts` one file at a time.
      Suggested order (least dependencies first):
  1. `Url.js`, `Yaml.js`, `YamlAdaptor.js` — utility classes, few deps
  2. `GuideItem.js`, `SpineItem.js` — data classes
  3. `ManifestItemProperties.js`
  4. `Spine.js` (depends on SpineItem)
  5. `Config.js`, `Theme.js`
  6. `HtmlToXml.js`, `Html.js`
  7. `Template.js`, `EbookConvert.js`
  8. `State.js` (depends on many of the above)
  9. `utils/index.js`
  10. `index.js` (re-exports)
- [ ] For each file conversion:
  - Add type annotations to public method signatures
  - Use explicit `any` for hard cases with `// TODO: type this` comment
  - Do not change behavior — type-annotation pass only
- [ ] Add `build` script; update `"main"` and `"types"` in `package.json`.
- [ ] Run `tsc` and fix all type errors. Keep the error count moving down —
      do not leave broken intermediate states in the branch.
- [ ] Remove or re-evaluate the `!**/b-ber-lib/*.js` and
      `!**/b-ber-lib/utils/*.js` coverage exclusions from the root `jest.config.js`
      (these were added to suppress missing-coverage noise; with types in place the
      package will have tests from TASK-001 in b-ber-lib's task directory).
- [ ] Run `npm test` from the monorepo root — all suites must pass.
- [ ] Commit: `chore(lib): convert to TypeScript`

## Notes

- `State` is a singleton exported as an instance, not a class. Its type needs
  careful handling — export both the class type and the singleton type so
  consumers can reference `typeof state` in their own types.
- The coverage exclusions for `b-ber-lib` in the root jest config were added
  because the tests were incomplete. Removing them as part of this task gives
  an honest picture of what still needs coverage (see b-ber-lib TASK-001).
- `b-ber-lib` uses `fs-extra` throughout. `fs-extra` has `@types/fs-extra`;
  no need to switch to `node:fs` in this task (that is TASK-013 work).
- After this task, Stage 1 is complete and Stage 2 (parsers, grammars,
  markdown-renderer, templates) can begin on a new branch `feat/ts-stage-2`.
- See TASK-002 for full migration sequence and risks.
