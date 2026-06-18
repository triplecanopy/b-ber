# TASK-102: Remove legacy-browser (Chrome 81) workarounds

**Status:** in progress (code + tests done; media-embed browser QA pending)
**Feature:** React 19 (reader-react)
**Phase:** Modernization — housekeeping
**Priority:** medium
**Model:** Sonnet 4.6 — largely net deletion + simplification, guarded by the
test suite and a media-playback browser QA pass.

> Read [`MIGRATION-CONVENTIONS.md`](../packages/b-ber-reader-react/MIGRATION-CONVENTIONS.md)
> §1 (verification gate) and §5 (remove only provably-unreferenced code).

## Description

The reader carries a workaround for a **Chrome 81** (2020) bug where iframes on a
different origin fail to load in multi-column layouts. The workaround positions
the iframe absolutely over a statically-positioned placeholder and polls its
geometry. Chrome 81 is five years out of support; the workaround should go.

### Footprint (~17 references)

- `src/hooks/use-iframe-position.ts` — **exists solely** for this workaround
  (placeholder measurement, `iframeStyleBlock`, `innerRef`, setTimeout polling).
- `src/components/Media/Vimeo.tsx` and `src/components/Media/Iframe.tsx` —
  `iframePositioningEnabled = isBrowser('chrome', 'eq', 81)` gates a placeholder
  `<div>`, the absolute-positioning style math, and the `<style>` block.
- `isBrowser('chrome', 'eq', 81)` checks (`src/helpers/utils.ts` `isBrowser`).

## Subtasks

- [x] Delete `useIframePosition` (`src/hooks/use-iframe-position.ts` removed) and
      its consumers' usage; removed the `iframePlaceholder*` / `iframeStyleBlock`
      / `innerRef` props and the `iframePositioningEnabled` branches from `Vimeo`
      and `Iframe` — both now render the embed inline in the normal column flow.
- [x] Remove the `isBrowser('chrome', 'eq', 81)` call sites. `isBrowser` was the
      sole consumer of `browser`, the `comparison` IIFE, and the lodash
      comparators (`eq/gt/gte/lt/lte`) in `utils.ts`, so all of those were
      removed too. (`lib/browser` / `detect-browser` stays — still used by the
      Safari checks in `Spread`/`Layout`/`with-last-spread-index`.)
- [x] Update `Vimeo.test.jsx` / `Iframe.test.jsx` — dropped the
      `use-iframe-position` mock and the "positioning enabled" describe blocks.
      Also removed the now-vestigial `resetModules`/React/ReaderContext/
      useNodePosition singleton scaffolding + dynamic `await import()`s (they
      existed only to toggle the module-level browser check) → plain static
      imports + a simple `useNodePosition` mock.
- [x] Audit for other `eq`-versioned legacy-browser branches / stale
      `detect-browser` usage — none remain (grep clean for `isBrowser`,
      `use-iframe-position`, `iframePositioning*`, `bber-iframe-placeholder`).
- [x] 9 snapshots unchanged; tests pass (62 suites / 407); `tsc --noEmit` clean.
- [ ] **Browser QA**: Vimeo + iframe embeds load and play, inline and full-bleed,
      in a current browser.
- [x] Commit; update `PLAN.md`; remove `.open` (PLAN/`.open` on close after QA)

## Notes (implementation)

- Kept the `aspectRatio` prop/state on `Vimeo` even though only the removed
  Chrome-81 math read it — it's a legitimate media-element property, not
  workaround machinery, and removing the prop is a separate concern. It is
  currently write-only in state; a later genuinely-unused-prop pass can drop it.

## Notes

- This deletes the `useIframePosition` hook created in [[TASK-099]]/[[TASK-100]]
  — expected; the conversion preserved the workaround faithfully, and removing it
  now is the correct end state.
- Keep `react-player`'s own browser handling intact — this task only removes the
  b-ber Chrome-81 placeholder machinery, not legitimate cross-browser code.
- Distinct from [[TASK-058]] (Node.js polyfills in the browser bundle), which is
  about build-time polyfills, not runtime browser-version branches.
- Related: [[TASK-068]] (housekeeping), [[TASK-096]] (Media subtree).
