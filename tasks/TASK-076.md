# TASK-076: Migrate from SCSS to CSS Modules

**Status:** complete (2026-06-19) — merged to `feat/upgrades` (merge `b03d6399`);
dev QA passed. Realized scope: `@import`→`@use` cleanup, Spinner CSS-Module POC
(+ Jest/TS wiring), dev viewport-label removal, and the monorepo styling audit.
Chrome scoping was intentionally **narrowed out** and deferred to
[`TASK-110`](./TASK-110.open.md) — the chrome `.bber-*` classes are a shared,
partly user-facing vocabulary (consumer override API), so they stay global. The
original goal ("migrate *all* reader styles to CSS Modules") is **superseded** by
this narrower outcome — see the 2026-06-19 decision below.
**Feature:** React 19 (reader-react)
**Phase:** Modernization — Phase 6
**Priority:** low
**Findings:** [`TASK-076-findings.md`](./TASK-076-findings.md) — monorepo-wide
styling audit (reader chrome vs. project content vs. themes), system diagrams,
and recommendations for the reader migration, the project/theme SCSS toolchain,
and theme alternatives.

## Description

Replace the current global SCSS stylesheet (`src/index.scss` + imported partials) with
CSS Modules so that component styles are co-located with their components, scoped by
default, and no longer rely on global class-name conventions.

This eliminates the risk of style bleed between the reader and the host application,
makes unused styles tree-shakeable, and aligns with the direction of the rest of the
React ecosystem.

## Subtasks

- [x] Audit current SCSS structure — identify global resets/variables that must stay
      global vs. component-scoped styles. **Done — expanded into a monorepo-wide styling
      audit; see [`TASK-076-findings.md`](./TASK-076-findings.md).** Key results: the
      reader's own SCSS (subsystem A) is small/self-contained and low-risk to migrate;
      book-content isolation is a runtime css-tree selector rewrite (subsystem B), NOT
      SCSS, so this task does not touch it; project/theme SCSS (B + C) is a public
      authoring API to keep, but its compile path (legacy dart-sass `render`, custom `~`
      importer, `@import`) should be modernized in a separate Upgrade-tooling task.
- [x] **Migrate `@import` → `@use`/`@forward`** (Sass module system). **Done**
      (commit `ec50b654`, branch `feat/reader-react-css-modules`). `index.scss` and
      all partials now use `@use … as *`; each partial `@use`s `variables`/`mixins`
      explicitly. Compiled CSS verified **byte-identical** (`npx sass src/index.scss`
      before/after); deprecation warnings gone; 62 suites / 9 snapshots pass.
      Original note retained below for context.
      `@import`s its 10 partials with the legacy `@import` rule, which Dart Sass
      deprecates (removed in Dart Sass 3.0) and warns about on every `npm start`.
      Partials are cleanly layered (`_variables` → `_mixins` → the rest;
      `_mixins.scss` already uses `@use 'sass:list'`), so this is ~8 files of
      one-line `@use '…' as *` additions. **Verify the compiled CSS is
      byte-identical** (`npx sass src/index.scss` before/after). If the CSS
      Modules pass lands first and rewrites these files anyway, do it there; if
      not, this is worth doing on its own to clear the warnings. (Surfaced
      2026-06-17 via dev-server deprecation warnings — they are our own SCSS, not
      a third-party lib; `sass` is already current.)
- [x] Evaluate whether to keep SCSS syntax (`*.module.scss`) or migrate to plain CSS
      (`*.module.css`). **Decided: plain `*.module.css`** — the Spinner needed no Sass
      features once the few token values were inlined; aligns with the findings (tokens
      → global custom properties) and the fewer-deps preference. Revisit per-component
      if a chrome partial leans on Sass math/mixins that don't port cleanly.
- [x] Enable CSS Modules in the build config (**Vite**). **Done — no Vite config needed**
      (native for `*.module.css`). Jest required wiring: `moduleNameMapper` resolves
      `*.module.{css,scss}` via a local identity proxy (`__tests__/helpers/cssModuleProxy.js`,
      no new dep) and side-effect stylesheets via an empty stub; typed `*.module.*`
      shims added. Lib build verified to scope the class (`_spinner_<hash>`) into
      `dist/styles.css`. (Readable names kept in tests via the proxy; chose **data-testid**
      for future chrome tests that query classes — see reassessment.)
- [x] Migrate leaf components first (Spinner) as a proof-of-concept. **Done**
      (commit `904c3988`, branch `feat/reader-react-css-modules`). `Spinner.module.css`
      colocated; `_spinner.scss` + its `@use` removed; snapshot updated to scoped names;
      62 suites pass; lib build + global-CSS checks green. (NavigationFooter button
      styles deferred to the chrome pass below.)
- [x] **REASSESS — decided 2026-06-19: keep chrome global (Option 1).** Verifying the
      consumer override API (`NavigationHeader`/`NavigationFooter`/`Sidebar*` props in
      `index.d.ts`) showed the chrome `.bber-*` classes are a **shared, partly user-facing
      vocabulary**, not component-private styles: `Controls` slots consumer-supplied
      components inside `<div className="bber-controls">`, whose universal `.bber-controls *`
      reset applies to them, and a consumer could reuse `.bber-nav__button` etc. to match
      the default look. Naively scoping the chrome would risk those overrides. **Decision:
      treat the chrome as a public override vocabulary and keep it global** (like the
      footnote/media theme contract). Real chrome scoping + a documented theming surface is
      deferred to **[`TASK-110`](./TASK-110.open.md)** (needs versioning + 3rd-party
      coordination; out of scope here).
- [x] **Remove the dev `body::before` viewport label** from the shipped CSS (commit
      `4fe26837`) — Findings Risk 1; the one global-stylesheet cleanup in scope.
- [~] ~~Migrate Controls / Sidebar / Navigation + Layout chrome to CSS Modules~~
      **Deferred to [`TASK-110`](./TASK-110.open.md)** (chrome stays global by decision above).
- [~] ~~Migrate HOCs (withDimensions, withLastSpreadIndex)~~ — N/A (measurement HOCs carry no styles).
- [~] ~~Remove global `src/index.scss` import~~ — **not done by design**: the global stylesheet
      stays (it holds the chrome vocabulary + footnote/media/print/font contracts + tokens).
- [x] Run `npm test` — 62 suites / 9 snapshots green after each commit.
- [x] Manually verify in dev environment (columns/scroll/spreads/mobile) — **QA passed
      2026-06-19**: Spinner renders/hides correctly via the CSS Module; chrome unchanged;
      no deprecation warnings; dev viewport-label gone.
- [x] Update `PLAN.md`.

## Audit: global vs. scopable (TASK-076-findings + 2026-06-19 deep audit)

The reader's SCSS is **not** cleanly separable chrome. A meaningful subset styles
class names that are a **global contract** shared with the theme packages and
book content (verified: `b-ber-theme-serif`/`b-ber-theme-sans` also style
`.footnote__body`, `.footnote__content`, `.footnote__number`). Those classes
arrive on the DOM either from parsed book XHTML (html-to-react) or from theme CSS
the reader does not control — CSS Modules **cannot** hash them without coordinated
breaking changes across the theme packages. The split:

**Must stay GLOBAL** (a single `src/styles/global.css`, imported once):
- `_variables.scss` → promote to CSS custom properties (also becomes the reader's
  override surface).
- `_fonts.scss` (`@font-face`) and `_icons.scss` (material-icons).
- `_footnote.scss` — **theme contract** (`.footnote__*` shared with themes/content).
- `_media.scss` — media-control classes are injected into book content and the
  themes ship `layout/_media-controls.scss`; treat as a shared contract until
  proven otherwise.
- `_print.scss` — print rules targeting content + chrome.
- the `body::before` debug viewport label and `.bber-spread` block in `index.scss`
  (remove the debug label — Findings Risk 1).

**Safely SCOPABLE to CSS Modules** (pure chrome, class set only via React
`className`, no theme/content overlap):
- `_spinner.scss` → `Spinner` (cleanest leaf; the POC).
- `_controls.scss` → `Controls` / `Sidebar*` / `Navigation*` chrome.
- the `.bber-leaf` / `#layout` bits in `_layout.scss` → `Layout` (verify `#layout`
  / `#frame` ID hooks; some are referenced by `DocumentProcessor`/print and must
  stay global).

> **Net:** the migration scopes the chrome, not the contract classes. The
> headline "eliminates style bleed" benefit applies to reader-chrome → host, not
> to footnote/media (which must remain global by design). This narrows the
> remaining subtasks below — they should be re-scoped to the chrome set only.

## Notes

- The current `src/index.scss` imports partials from `src/styles/`. These partials mix
  component styles with global resets and CSS custom properties. The global tokens
  (custom properties, font-face declarations, resets) should remain in a single
  `src/styles/global.css` imported once at the app entry point.
- Class names in tests (`container.querySelector('.bber-controls__footer')`) will break
  if CSS Modules generates hashed names. Use `composes` or configure Vite's
  `css.modules.generateScopedName` to preserve readable names in test/dev, or update
  tests to use `data-testid` attributes.
- Do not proceed until TASK-067 (active bugs) is resolved — migrating styles on top of
  a broken navigation path makes regression detection harder.
- **Build tool is Vite now** (`vite.config.js` for dev, `vite.config.lib.js` for the
  library build) — the earlier webpack/rsbuild references in this task are stale. Vite
  handles CSS Modules natively, so no loader config is needed; this lowers the cost of
  the migration.
