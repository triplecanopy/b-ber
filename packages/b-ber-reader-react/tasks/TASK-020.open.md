# TASK-020: Loading state for TOC/sidebar buttons during initial load

**Status:** not started
**Phase:** Bug Fixes
**Priority:** low

## Description

During the brief window between component mount and `createStateFromOPF`
completing (OPF/NCX network fetch), `spine` is an empty array `[]`. If the
user clicks the TOC button before the spine is populated, the chapters sidebar
opens but renders no items. The user may perceive this as "the button didn't
work" and click again, causing a confusing toggle-open/toggle-closed cycle.

The primary cause of the multi-click symptom was the state-clobbering bug
fixed in `index.jsx` (TASK-019 / commit that fixed `handleSidebarButtonClick`
not spreading `prev`). This task addresses the remaining edge case: the
sidebar opens correctly but appears empty.

### Acceptance criteria

- The TOC button (`.bber-li-toc > .bber-nav__button`) is visually disabled or
  shows a loading indicator while `spine.length === 0` (book not yet loaded).
- Once the spine is populated, the button becomes active with no layout shift.
- Other header buttons (downloads, metadata, settings) should follow the same
  pattern if their data is also not yet available at mount.

### Approach options

**Option A — Disable the button while spine is empty**

Pass a `spineLoaded` prop (or derive from `spine.length > 0`) to
`NavigationHeader`. Add `disabled` attribute and a muted CSS class to the TOC
button when not yet loaded.

Pros: simple, clear affordance.  
Cons: "disabled" may look broken to users who haven't seen the loading spinner.

**Option B — Show a spinner/skeleton inside the button icon**

Replace the `<Menu />` icon with a small spinner when `spine.length === 0`.

Pros: consistent with the existing full-page spinner pattern.  
Cons: slightly more complex, spinner in a small icon may not be legible.

**Option C — Defer button render until spine is populated**

`NavigationHeader` already returns `null` when `uiOptions` is missing. Extend
this guard to also return null (or a stub) when `spine.length === 0`.

Pros: zero chance of an empty-state UX problem.  
Cons: layout may shift when the header suddenly appears.

Recommendation: **Option A** — disable with a CSS class. Simple, no layout
shift, and consistent with how the footer nav buttons are already conditionally
shown based on spine length.

## Subtasks

- [ ] Decide on option (A / B / C) and update this PRD
- [ ] Pass `spineLoaded` (or `spine.length > 0`) from Controls → NavigationHeader
- [ ] Apply `disabled` attribute + CSS to TOC button when `!spineLoaded`
- [ ] Verify no layout shift and that button activates correctly after load
- [ ] Update `PLAN.md`, mark task complete

## Notes

- `spine` starts as `[]` (initial state in `Reader/index.jsx`). It is populated
  by `createStateFromOPF` after the OPF/NCX network fetch completes.
- `handleEvents` is also `false` during this window, but it does not gate
  `handleSidebarButtonClick` — the TOC button's `onClick` fires regardless.
  This is intentional: the sidebar should be openable before the first page
  finishes loading (e.g., to see metadata). The guard only needs to apply
  when there is literally nothing to show (spine is empty).
- `NavigationFooter` already handles `spine?.length ?? 0` for its button
  visibility logic — see the `show` object in that component for reference.
