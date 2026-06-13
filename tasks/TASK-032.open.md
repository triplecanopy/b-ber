# TASK-032: Convert b-ber-reader-react to TypeScript (Stage 4)

**Status:** in progress
**Feature:** Migrate JS→TS
**Scope:** b-ber-reader-react
**Priority:** low
**GitHub Issue:** #487 — https://github.com/triplecanopy/b-ber/issues/487
**Branch:** `feat/ts-stage-4` (off `feat/upgrades`)

> Absorbs the former reader-react TS task ([[TASK-072]], now superseded), which
> documents a bottom-up migration order (leaf modules → HOCs → orchestrators)
> worth following here.

## Description

Stage 4 of the TypeScript migration: convert `b-ber-reader-react` to
TypeScript and TSX. This is the browser-side React + Redux EPUB reader — the
largest and most complex package in the monorepo (~120 source files).

**Blocker cleared.** This task was originally blocked on the Vite migration.
[[TASK-020]] / [[TASK-006]] are complete and merged — the package now builds
with Vite and TS/TSX is first-class. The toolchain is already TypeScript-ready
(see "Toolchain reality" below); this task is the source conversion itself.

## Toolchain reality (audited 2026-06-13 — supersedes the original plan)

The original PRD predates the Vite + Biome work and assumed a Babel/webpack
setup. The current state is different and **most toolchain subtasks are already
done**:

- **Test transform:** `jest.config.js` already uses `@swc/jest` configured with
  `parser: { syntax: 'typescript', tsx: true }`. It transforms `.ts`/`.tsx`
  today. **Do not add `ts-jest`** (the original PRD's suggestion is obsolete).
- **`testMatch`:** Jest's default `moduleFileExtensions` already includes
  `ts`/`tsx`, so extensionless imports resolve to converted source with no
  change. Test files stay `.js`/`.jsx` (see "Test preservation") so `testMatch`
  does **not** need updating.
- **Vite:** `vite.config.lib.js` / `vite.config.js` use
  `@vitejs/plugin-react({ include: /\.(jsx?|tsx?)$/ })` — TSX is already matched.
  No bundler change required.
- **Public types:** a curated hand-written `index.d.ts` describes the public API
  (`BberReader`, `Reader`, `Spine`, `SpineItem`, `Metadata`, prop interfaces,
  etc.). Keep it as the published type surface — reuse these types from source
  rather than regenerating `.d.ts` from the implementation.

What remains for the toolchain: add `tsconfig.json`, a `typecheck` script, and
the `@types/*` devDependencies (below).

## tsconfig spec

`b-ber-reader-react` is a **typecheck-only, Vite-bundled leaf** with no
first-party (`@canopycanopycanopy/*`) dependencies, so it needs no project
references. It cannot reuse the Node-oriented `tsconfig.base.json` settings
verbatim (that base is `module: commonjs`, `lib: ["es2022"]`, no DOM, and
`composite: true`). Override for a browser/bundler target:

```jsonc
// packages/b-ber-reader-react/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "esnext",
    "moduleResolution": "bundler",
    "lib": ["es2022", "dom", "dom.iterable"],
    "jsx": "react",            // classic runtime — all files import React
    "noEmit": true,            // Vite emits the bundle; tsc only typechecks
    "composite": false,        // not a referenced project; noEmit leaf
    "declaration": false,
    "declarationMap": false,
    "sourceMap": false,
    "allowJs": true,           // TEMPORARY — see note
    "resolveJsonModule": true
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["**/__tests__/**", "**/__mocks__/**", "dist"]
}
```

- `jsx: "react"` (classic) over `"react-jsx"`: every existing file imports
  `React`, and classic keeps that import "used." Runtime JSX is handled by Vite
  (automatic runtime); tsc is noEmit so the setting only affects typechecking.
- `allowJs: true` is a **migration-only** convenience so the package typechecks
  while it contains a mix of `.js`/`.jsx` and `.ts`/`.tsx`. The goal is to
  convert the package as a unit; **remove `allowJs` in the final cleanup commit**
  once no `.js`/`.jsx` source remains (test files are excluded from `include`,
  so they don't block this).
- Add `"typecheck": "tsc --noEmit"` to `package.json` scripts so
  `lerna run typecheck` from root picks it up.

## @types to add (devDependencies)

Audited against installed packages (only `@types/lodash` present at root):

- `@types/react`, `@types/react-dom` (pin to a React 18-compatible major; the
  peer range is `>=16.2.0 <=19`)
- `@types/css-tree`, `@types/html-to-react`, `@types/history`,
  `@types/prop-types`
- Ship their own types (no `@types` needed): `classnames`, `detect-browser`,
  `react-redux`, `redux`, `redux-thunk`, `react-player`.
- No types available (declare a local ambient `*.d.ts` shim or type as
  `unknown`/`any` with a `// TODO: type this` comment): `react-attr-converter`,
  `js-string-escape`, `quote`, `xml-js` (verify), `url-search-params-polyfill`,
  `object-fit-images`.

## Conversion order (bottom-up, dependency-first)

Mirrors [[TASK-072]]'s leaf→orchestrator order. Lower groups are foundation for
upper groups; type the shared data layer first so component conversions import
real types instead of inventing conflicting ones.

1. **Foundation / data layer (do first, single-threaded):**
   `src/constants/*` → `src/models/*` → `src/actions/*` + `src/reducers/*` →
   define the Redux **`RootState`**, **action**, and **thunk/dispatch** types in
   one place (`src/store/types.ts` or similar). Everything downstream imports
   these.
2. **Utilities:** `src/helpers/*`, `src/lib/*` (non-JSX first, then the `.jsx`
   HOCs/`with-*` files), `src/hooks/*`, `src/config.js`.
3. **Leaf components:** self-contained subtrees — `components/Media/**`,
   `components/Sidebar/**`, `components/Navigation/**`, plus simple leaves
   (`Spinner`, `Marker`, `Link`, `Footnote`, `SpreadFigure`).
4. **HOCs + mid components:** `Frame`, `Layout`, `Spread`, `Ultimate`,
   `with-dimensions`, `with-last-spread-index`, `with-*`.
5. **Orchestrators:** `components/Reader/**` (`index.jsx`, `loader.js`,
   `navigation.js`, `resize.js`), `components/Controls`, `components/App`.
6. **Entry:** `src/index.jsx` → `src/index.tsx`. Reconcile its exported types
   with the hand-written `index.d.ts`.

## Scope discipline — TS conversion only

This task converts source to TS and adds types. It is **not** a refactor:

- **Keep class components as classes** (typed). Do **not** convert to functional
  components — that is [[TASK-060]] / React 19 work.
- Do **not** touch the `selfRef` shim, `book.content` global, the `Ultimate`
  polling loop, or other known-issue patterns. Those have dedicated tasks
  (TASK-062, 073, 082, 087, etc.). Type them as-is.
- **Dead code:** removing *truly* dead code encountered during conversion is in
  scope — unused vars, unreferenced interfaces, unused imports, unreachable
  branches. Only remove what is provably unreferenced (Biome's
  `noUnusedVariables`/`noUnusedImports` + grep confirm). When in doubt, leave it
  and type it. Deeper cuts happen in the React 19 / class→functional pass.
- `strict` mode from day one (inherited from base). Use explicit `any` with a
  `// TODO: type this` comment for genuinely hard cases (e.g. `html-to-react`
  processing-instruction shapes); do not relax strict settings.

## Test preservation

The suite is the regression guard for this conversion (71 suites, 458 passing,
9 snapshots — baseline captured 2026-06-13).

- **Test files stay `.js`/`.jsx`.** They are transformed by `@swc/jest` and
  excluded from `tsconfig` `include`, so they keep running unchanged and don't
  need to typecheck. Converting them is out of scope.
- Run `npm test` (or `npx jest`) after each conversion group; the count must not
  regress. Snapshots must not change — if a snapshot changes, the conversion
  altered render output and must be fixed, not re-recorded.
- Watch the mock-based tests: some suites mock modules (`b-ber-logger`, etc.);
  changing a real module's shape can require updating its mock.

## Subtasks

- [ ] Create `feat/ts-stage-4` off `feat/upgrades`
- [ ] Add `@types/*` devDependencies; add `tsconfig.json`; add `typecheck`
      script to `package.json`
- [ ] Foundation: convert `constants/`, `models/`, `actions/`, `reducers/`;
      define `RootState`/action/thunk types
- [ ] Utilities: convert `helpers/`, `lib/`, `hooks/`, `config`
- [ ] Leaf components: `Media/**`, `Sidebar/**`, `Navigation/**`, simple leaves
- [ ] HOCs + mid components
- [ ] Orchestrators: `Reader/**`, `Controls`, `App`
- [ ] Entry: `index.jsx` → `index.tsx`; reconcile with `index.d.ts`
- [ ] `npx tsc --noEmit` passes clean (strict); remove `allowJs`
- [ ] `npm test` passes from root; suite count and snapshots unchanged
- [ ] Update [[TASK-019]] Stage 4 checkbox + `PLAN.md`; close TASK-019 if this
      is the last package
- [ ] Merge `feat/ts-stage-4` → `feat/upgrades`

## Orchestration

Foundation + utilities are converted single-threaded (they define the shared
types everything else imports) to avoid conflicting type definitions. Once the
data layer and utilities typecheck, the self-contained component subtrees
(`Media/**`, `Sidebar/**`, `Navigation/**`) are good candidates for parallel
subagents — one agent per subtree, each given the foundation types and a "keep
tests green, strict mode, no refactors" brief. The entangled top-level
components and orchestrators are converted single-threaded last.

## Notes

`b-ber-reader` (the legacy non-React reader) is intentionally excluded from the
TypeScript migration — a thin deployment shell, no active development, stays JS.

Related: [[TASK-006]]/[[TASK-020]] (Vite migration, complete — unblocked this),
[[TASK-019]] (TS epic tracking doc — closes when this lands), [[TASK-002]]
(migration strategy), [[TASK-029]] (Stage 3 parent), [[TASK-072]] (superseded;
conversion order).
