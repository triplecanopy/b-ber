# TASK-072: TypeScript adoption

**Status:** not started
**Phase:** Modernization — Phase 4
**Priority:** low

## Description

Migrate the codebase from JavaScript to TypeScript. This is IMPROVEMENT_PLAN Phase 4.

TypeScript adoption should proceed bottom-up: leaf modules first, then HOCs, then
orchestrators.

## Migration order

1. **Helpers** — `Url`, `Storage`, `Request`, `Viewport`, `Asset`, `Types`, `utils`
2. **Models** — `SpineItem`, `GuideItem`, `BookMetadata`, `ViewerSettings`, `MediaStyleSheet`, `Script`
3. **Constants** — all constant definition files
4. **Actions and reducers** — type the Redux action shapes and state
5. **Leaf components** — `Spinner`, `Spread`, `SpreadFigure`, `Link`, `Marker`, `Footnote`
6. **Media components** — `Audio`, `Video`, `Vimeo`, `Iframe`, and their sub-components
7. **HOCs and lib** — `withDimensions`, `withLastSpreadIndex`, `withNodePosition`, contexts
8. **Layout and Frame** — `Layout.jsx`, `Frame.jsx`
9. **Navigation and Sidebar** — `NavigationHeader`, `NavigationFooter`, Sidebar components
10. **Reader** — `Reader/index.jsx`, `navigation.js`, `loader.js`, `resize.js`
11. **App** — `App.jsx`, `src/index.jsx`
12. **Replace `index.d.ts`** — remove manual declarations, generate from source

## Subtasks

- [ ] Add `tsconfig.json`
- [ ] Configure Webpack to handle `.ts` / `.tsx` files
- [ ] Migrate helpers (step 1 above)
- [ ] Migrate models (step 2 above)
- [ ] Continue migration bottom-up through remaining steps
- [ ] Remove `index.d.ts` manual declarations once all types are generated from source
- [ ] Run `npm test` at each step; add type-checking script to `package.json`
- [ ] Update `PLAN.md`

## Notes

- This is a large task. Consider splitting into separate sub-tasks per phase once
  the tsconfig is in place.
- Migrate the external modules (`navigation.js`, `loader.js`, `resize.js`) to proper
  custom hooks as part of the Reader migration (see TASK-060 notes on `selfRef` pattern).
- The `index.d.ts` file at the package root is used by downstream consumers. Ensure
  the generated types are compatible before removing the manual declarations.
