# TASK-110: Reader chrome theming API (scope chrome CSS + custom-property surface)

**Status:** not started (design-gated — **out of scope for now**, see TASK-076)
**Feature:** React 19 (reader-react)
**Phase:** Modernization — Phase 6 (follow-on to TASK-076)
**Priority:** low
**Origin:** TASK-076 audit + the 2026-06-19 chrome-conflict review. This is
"Option 2" from that decision; the team chose Option 1 (keep chrome global) for
now and deferred this.

## Why this exists

TASK-076 set out to move the reader's styles to CSS Modules. The audit found the
reader's **chrome** classes (`.bber-controls`, `.bber-nav`, `.bber-li`,
`.bber-a`, `.bber-button`, `.bber-nav__button`, `.bber-controls__header/footer/
sidebar*`) are **not** component-private styles — they are a **shared, partly
user-facing vocabulary**:

1. `Controls` renders `<div className="bber-controls">` and slots either the
   **default** `NavigationHeader`/`NavigationFooter`/sidebars **or a
   consumer-supplied component** (the public override props
   `NavigationHeader`/`NavigationFooter`/`SidebarChapters`/`SidebarDownloads`/
   `SidebarMetadata` — see `index.d.ts`) directly inside that wrapper, with no
   per-slot wrapper class.
2. The global rule `.bber-controls *` is a **universal reset** (margin/padding/
   box-sizing/font-smoothing/touch-action) that therefore applies to **every**
   slotted component, including consumer-provided ones.
3. The detailed chrome classes are owned by the **default** components but form a
   vocabulary a consumer could reasonably reuse to match the default look.

Because of (1)–(3), a naive per-component CSS-Modules migration of the chrome
would risk breaking consumer overrides (any consumer reusing `.bber-*` chrome
classes would lose styling) and cannot cleanly express the intentional
slotted-component reset. So scoping the chrome is **blocked on designing a real
theming contract** — this task.

## Current state of theming (as of 2026-06-19)

- **Override API exists but is undocumented.** `index.d.ts` exposes
  `NavigationHeader`/`NavigationFooter`/`SidebarChapters`/`SidebarDownloads`/
  `SidebarMetadata` override props (typed as `React.Component<T> | ((props:T)=>JSX)`),
  each receiving a defined props contract (navigation callbacks, `spine`,
  `metadata`, `downloads`, `uiOptions`, `showSidebar`, …). The README is stale
  (webpack-era) and documents none of this. No example or test exercises the
  overrides.
- **No CSS custom-property surface.** Reader chrome tokens live as Sass variables
  in `src/styles/_variables.scss` (colors, spacing, fonts, `$spinner-size`) and
  vanish at compile time. There is no documented way to re-theme the chrome other
  than overriding `.bber-*` selectors with higher-specificity CSS.
- **Chrome ships global** (TASK-076 Option 1): `_controls.scss` etc. compile into
  the single global stylesheet; `.bber-*` is effectively the public override
  vocabulary. Only private leaf styles were scoped (Spinner — TASK-076).

## Goal

Make the chrome **safely scopable** by replacing the implicit `.bber-*`
vocabulary with an explicit, documented, versioned theming contract:

1. **Document the slot contract** — which structural/positional styles the reader
   guarantees on slotted chrome (e.g., the fixed-position header/footer placement,
   the `.bber-controls` reset), and which are the default component's own look.
   Decide whether the universal `.bber-controls *` reset should keep applying to
   consumer components or be narrowed to the defaults.
2. **Expose CSS custom properties** as the supported theming surface
   (`--bber-control-fg`, `--bber-control-bg`, `--bber-nav-button-size`, spacing,
   fonts, etc.) on the reader root, so consumers re-theme without depending on
   internal class names.
3. **Allow a small documented CSS hook** — a minimal, stable set of base styles
   (mainly positioning) plus the custom properties, so a consumer can drop in a
   bit of CSS and have it work across reader versions.
4. **Then** scope the default chrome (`Controls`/`Navigation*`/`Sidebar*`) into
   CSS Modules, keeping only the documented contract global. Tests for those
   components move to `data-testid` (the strategy chosen in TASK-076).

## Subtasks (high-level — refine during design)

- [ ] Inventory real consumers and confirm whether any reuse `.bber-*` chrome
      classes in custom components (coordinate with 3rd parties who embed the app).
- [ ] Define the slot/positioning contract the reader guarantees for chrome.
- [ ] Decide the `.bber-controls *` reset's fate (keep for slots vs. narrow to defaults).
- [ ] Design the CSS custom-property token set + naming + defaults.
- [ ] Write the public docs for the override API + theming (replace the stale README).
- [ ] Version the contract (semver impact; migration notes for consumers).
- [ ] Implement: scope default chrome to CSS Modules; expose tokens; keep contract global.
- [ ] Migrate affected chrome tests to `data-testid`.
- [ ] Manual QA: default look unchanged; a sample re-theme via custom properties works;
      a sample consumer override component still renders/styles correctly.

## Notes

- **Out of scope right now** (team decision 2026-06-19). This needs strict
  planning, semver/versioning discipline, and coordination with 3rd-party
  consumers of the reader before any code lands. Do not start implementation
  without that design sign-off.
- Depends on TASK-076 (the leaf-level CSS-Modules wiring — Jest `moduleNameMapper`
  proxy, typed `*.module.*` shims, the global-vs-scopable audit — is already in
  place and is the foundation this builds on).
- Branch when it starts: a dedicated `feat/reader-chrome-theming` feature branch
  (build/output + public-API change).
