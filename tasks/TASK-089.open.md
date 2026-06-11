# TASK-089: Deep-linking to a spreadIndex does not navigate to that spread

**Status:** not started
**Feature:** React 19 (reader-react)
**Phase:** Bug Fixes
**Priority:** medium
**Created:** 2026-06-06

## Description

Loading a URL with a `spreadIndex` query param (e.g.
`?currentSpineItemIndex=2&spreadIndex=11&slug=chapter-2`) loads the correct
chapter but always starts at spread 0 — the `#layout` transform stays at
`translateX(0)` instead of translating to the requested spread.

Discovered while reproducing TASK-088: deep-linking to `spreadIndex=11` rendered
with `translateX=0`, while navigating to the same screen via ArrowRight applied
`translateX(-14960px)` correctly.

### Root cause

In `Reader/index.jsx`, the initialization effect (replacing
`UNSAFE_componentWillMount`) reads `currentSpineItemIndex` from the URL but
hardcodes the spread:

```js
const currentSpineItem = spine[currentSpineItemIndex]
const spreadIndex = 0   // ← ignores the spreadIndex search param
```

So the initial render and transform are always for spread 0. The `spreadIndex`
search param is only honored on subsequent search-param changes
(`prevSlug !== slug` path and the same-chapter branch), not on first load.

### Proposed fix

Read `spreadIndex` from the URL search params in the init effect (as the
search-param-change effect already does) and pass it into the initial
`setState({ currentSpineItem, currentSpineItemIndex, spreadIndex })`. Ensure the
transform is applied after the chapter loads and layout settles (it may need to
wait for `view.loaded`, similar to the backward-navigation effect).

## Subtasks

- [ ] Honor the `spreadIndex` search param on initial load
- [ ] Apply the transform after layout settle so the deep-linked spread is shown
- [ ] Verify deep links across chapters and spread indices
- [ ] `npm test`; commit; update `PLAN.md`; remove `.open`

## Notes

- Independent of the spread layout bugs (TASK-088) but commonly hit together when
  testing specific spreads via URL.
- File: `src/components/Reader/index.jsx` (initialization effect).
