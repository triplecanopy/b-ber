# TASK-019: Fix leaf element flickering

**Status:** not started
**Phase:** Bug Fixes
**Priority:** high

## Description

The `bber-leaf--left` and `bber-leaf--right` overlay elements flicker visibly
during page turns. The previous fix (commit `b6d8428b`) stripped CSS transitions
from the leaves but did not address the root cause: the leaves and the layout
container update from different timing sources, so they are briefly out of sync
on every navigation.

### Root cause

`#layout` has a `translateX` CSS transform applied (from `Layout` component's
local `state.transform`). The leaves are children of `#layout`, so they move
with it. To stay visually fixed at the viewport edges, they apply a
counter-transform derived from `readerContext.getTranslateX()` (read during
render, from `stateRef.current.spreadIndex` in `Reader`).

The race condition:

1. User navigates → Redux dispatches new `spreadIndex` → Reader state updates →
   `stateRef.current.spreadIndex` is immediately the new value.
2. `Layout` re-renders. `translateX = getTranslateX()` reads the new spreadIndex
   → leaves jump to their new counter-transform position.
3. But `Layout`'s own `state.transform` (which drives `#layout`'s CSS transform)
   hasn't updated yet — it updates in a `useEffect([props.spreadIndex])` that
   runs _after paint_.
4. For one frame: `#layout` is at the old position, leaves are at the new
   position → visible flicker/jump.

A secondary problem: Firefox uses `left`/`right` properties instead of
`transform` for the leaves, so any fix must preserve that branch.

### Proposed fix: move leaves outside the layout container

The fundamental problem is that leaves are inside a transformed container and
must counter-transform to stay put. Moving them outside `#layout` eliminates the
need for counter-transforms entirely:

- Render `<Leaves>` as a sibling to `#layout` (inside the `Frame` container, or
  absolutely positioned over the viewport), not as a child.
- Position them with `position: fixed` (or `position: absolute` on the Frame
  container, which is not transformed).
- Width is `paddingLeft` / `paddingRight` — no transform logic needed.
- Remove all `getLeafStyles` / counter-transform code.

This makes the leaf position depend only on `paddingLeft`/`paddingRight`
(viewport-relative), which only changes on resize — not on every page turn.

### Alternative fix (lower risk, narrower scope)

If moving leaves outside the container is infeasible (z-index or stacking
context issues), the synchronization race can be eliminated by storing the
numeric `translateX` value in `Layout`'s own state and passing it to `Leaves`:

```js
// In updateTransform:
const nextTranslateX = readerContext.getTranslateX(nextSpreadIndex)
const transform = `translateX(${nextTranslateX}px) translate3d(0, 0, 0)`
setState(prev => ({ ...prev, transform, translateX: nextTranslateX }))

// In Leaves: use state.translateX (from Layout state), not getTranslateX()
```

Both the layout transform and the leaf counter-transform then derive from the
same `setState` call and are guaranteed to be in sync.

## Subtasks

- [ ] Reproduce the flicker with the dev server and confirm it is still present
- [ ] Audit `Layout.jsx`, `Frame.jsx`, and the CSS to determine if leaves can
      be repositioned outside `#layout` without z-index regressions
- [ ] Implement the chosen fix (preferred: leaves-outside approach; fallback:
      sync via Layout state)
- [ ] Verify fix in Chrome, Firefox (uses `left`/`right` not `transform`), and
      Safari
- [ ] Remove now-dead `getLeafStyles` code if the leaves-outside approach is
      taken
- [ ] Update `PLAN.md` and mark task complete

## Notes

- The previous fix (`b6d8428b`) removed CSS transitions from the leaves by
  injecting `transition: 'none'` when `!enableTransitions`. Transitions are
  already commented out in `getLeafStyles` (lines 89, 100). This is safe to
  clean up as part of this task.
- `getLeafStyles` has dead code: the `transitionSpeed` param is accepted but
  never used (commented out lines 69, 89, 100). Clean up during this fix.
- Firefox branch in `getLeafStyles` uses `left`/`right` CSS properties. If
  leaves are moved outside the container, the Firefox branch may no longer need
  to exist at all (fixed/absolute positioning doesn't require transform countering
  in either browser).
