# TASK-102: Remove legacy-browser (Chrome 81) workarounds

**Status:** not started
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

- [ ] Delete `useIframePosition` and its consumers' usage; remove the
      `iframePlaceholder*` / `iframeStyleBlock` / `innerRef` props and the
      `iframePositioningEnabled` branches from `Vimeo` and `Iframe` (the embeds
      render inline in the normal column flow, the non-Chrome-81 path).
- [ ] Remove the `isBrowser('chrome', 'eq', 81)` call sites; if `isBrowser` is
      then unused, remove it too (verify with grep + Biome `noUnusedExports`).
- [ ] Update `Vimeo.test.jsx` / `Iframe.test.jsx` — drop the
      `use-iframe-position` mock and the "positioning enabled" describe blocks.
- [ ] Audit for any other `eq`-versioned legacy-browser branches and a stale
      `browser` (`detect-browser`) usage that only existed for this.
- [ ] 9 snapshots unchanged (or re-justify if a Vimeo/Iframe snapshot legitimately
      simplifies); tests pass; `tsc --noEmit` clean
- [ ] **Browser QA**: Vimeo + iframe embeds load and play, inline and full-bleed,
      in a current browser.
- [ ] Commit; update `PLAN.md`; remove `.open`

## Notes

- This deletes the `useIframePosition` hook created in [[TASK-099]]/[[TASK-100]]
  — expected; the conversion preserved the workaround faithfully, and removing it
  now is the correct end state.
- Keep `react-player`'s own browser handling intact — this task only removes the
  b-ber Chrome-81 placeholder machinery, not legitimate cross-browser code.
- Distinct from [[TASK-058]] (Node.js polyfills in the browser bundle), which is
  about build-time polyfills, not runtime browser-version branches.
- Related: [[TASK-068]] (housekeeping), [[TASK-096]] (Media subtree).
