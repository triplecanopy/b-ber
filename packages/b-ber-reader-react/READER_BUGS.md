# Reader Spread Rendering — Bug Report

Code review of `b-ber-reader-react` focused on the **spread** rendering pipeline
(full-screen full-bleed panels laid out across a CSS 2-column layout). Scope: the
reader-react commits from `52bb5d86` to `HEAD` (the webpack→Vite migration,
class→hooks conversion, and the polling→observer rewrites).

**Reported symptoms:** blank/empty "pages", content overlapping inside spreads,
misplaced full-bleed figures — intermittent, often only at certain window widths.

---

## Implementation status (this branch)

| Bug | Status | Notes |
| --- | --- | --- |
| BUG 1 — Spread never re-measures after settle | **Fixed** | Re-measures on `view.loaded`/`view.ultimateOffsetLeft`; guards added |
| BUG 2 — Ultimate settles too eagerly | **Fixed** | Requires 3 consecutive stable reads; re-arms on `document.fonts.ready`; `MAX_WAIT_MS` 1500→2500 |
| BUG 3 — page count measured mid-reflow | **Fixed** | `withLastSpreadIndex` re-measures on the settled signal |
| BUG 4 — divergent page-width formulas | **Partially fixed** | New `Viewport.getPageWidth` used by `Spread` + `getTranslateX`; `with-node-position` left as-is |
| BUG 5 — `view.loaded` never reset / `unload()` dead | **Deferred** | Behavior is intentional per migration notes; BUG 1/3 now key off `ultimateOffsetLeft`, which is reliable. Documented follow-up |
| BUG 6 — FF/Edge sentinel not re-measured | **Improved** | BUG 3's settle re-measure now covers it; UA-sniffing remains |
| BUG 7 — redundant derived state | **Fixed** | `verso`/`multiplier` derived inline; dead `left` state + layout effect removed |
| BUG 8 — `'0px'` string default → NaN | **Fixed** | Default now numeric `0` |
| BUG 9 — Ultimate polling vs "No polling" standard | **Deferred** | offsetLeft polling is the pragmatic detector for column reflow; documented follow-up |
| BUG 10 — unguarded divide by `pageWidth` | **Fixed** | `Number.isFinite` / non-zero guard |

Tests: `npm test` (18 suites) passes; `Ultimate.smoke.test.jsx` updated for the
new stability criterion.

---

## How spreads work (so the bugs make sense)

1. Chapter HTML is rendered into `#content`, which sits inside `#layout`. `#layout`
   is the CSS **multi-column** container (`columns: 2`). Content flows left→right
   into columns; each "spread" (one screen) = one full page width.
2. Page turns translate `#layout` left by one page width
   (`getTranslateX` in `Reader/index.jsx`).
3. A full-bleed `<Spread>` renders an invisible **height spacer**
   (`height = frameHeight × multiplier`, `multiplier` = **2** for verso /
   **3** for recto). That spacer forces the column engine to push the
   `<SpreadFigure>` to the start of the correct page.
4. `multiplier`/`verso` are derived from `offset`, which is computed from the
   spread element's `offsetLeft` (its column position).
5. `<Ultimate>` is a sentinel span at the end of each chapter. It waits for the
   columns layout to *settle* (`offsetLeft` stops moving), then dispatches
   `view.load()` + `updateUltimateNodePosition`, which hides the spinner and
   signals downstream consumers that positions are now trustworthy.
6. `withLastSpreadIndex` measures total content size to compute how many spreads
   (pages) the chapter has — used by the nav controls and backward navigation.

The recurring theme below: **the CSS columns layout takes several frames to
settle, and several pieces of this pipeline now read positions before it has,
with no reliable mechanism to re-read them afterward.**

---

## Critical

### BUG 1 — `Spread` never re-measures its column position after the layout settles

**File:** `src/components/Spread.jsx` (`useEffect`, ~lines 56–96)
**Severity:** Critical — this is the most likely root cause of the QA report.

The old code polled `updatePosition` on a `setInterval(…, 1000)`. The rewrite
replaced that with a `ResizeObserver` on the spread node:

```js
const resizeObserver = new ResizeObserver(updatePosition)
if (node.current) resizeObserver.observe(node.current)
updatePosition()
return () => resizeObserver.disconnect()
}, [
  props.viewerSettings.paddingLeft,
  props.viewerSettings.paddingRight,
  props.viewerSettings.columnGap,
])
```

`offset` (and therefore `verso`/`multiplier`/`SpreadContext.left`) is derived
from `node.offsetLeft` — a **position**. But:

- **`ResizeObserver` only fires on box-*size* changes.** When the columns engine
  reflows and the spread lands in a different column, its `offsetLeft` changes
  while its width/height do **not**. The observer never fires.
- The effect's dependency array is only `[paddingLeft, paddingRight, columnGap]`,
  so it does **not** re-run on chapter change, content reflow, or layout settle.
- The single synchronous `updatePosition()` runs in `useEffect` (after paint of
  the *initial, unsettled* layout). That is exactly the moment `<Ultimate>`
  exists to wait past — so `offsetLeft` is frequently read too early.

Net result: `offset` is captured once, before the layout has settled, and is
never corrected. A spread misclassified verso↔recto gets the wrong `multiplier`
(2 vs 3) → wrong spacer height → the figure is pushed to the wrong column →
**overlap, blank page, or off-screen figure**, with no self-correction. The old
1 s poll masked this by re-reading every second.

> Note: the only reason the spread isn't *always* wrong is an incidental feedback
> loop — when `multiplier` changes, the node's height changes, which *does* fire
> the `ResizeObserver` once. But that only helps when the first (premature)
> reading happens to differ from the settled one in a way that flips the
> multiplier; pure horizontal reflow and same-class re-positioning are missed.

**Suggested fix:** Drive re-measurement off the *layout-settled* signal that
already exists, instead of (or in addition to) the `ResizeObserver`. `<Ultimate>`
dispatches `view.updateUltimateNodePosition` once the layout is stable;
`with-node-position.jsx` already re-measures when `view.ultimateOffsetLeft`
changes. Subscribe `Spread` to `view` and re-run `updatePosition` when
`view.loaded` / `view.ultimateOffsetLeft` changes:

```js
function Spread(props) { /* … */ }
export default connect(
  ({ readerSettings, viewerSettings, view }) => ({ readerSettings, viewerSettings, view }),
  () => ({})
)(Spread)
// add props.view.ultimateOffsetLeft (and props.view.loaded) to the effect deps
```

This re-reads `offsetLeft` exactly when positions become trustworthy and after
any reflow that re-fires the sentinel.

---

### BUG 2 — `Ultimate` declares the layout "settled" far too eagerly

**File:** `src/components/Ultimate.jsx` (`scheduleCheck`, ~lines 107–135)
**Severity:** Critical — premature settle poisons every downstream measurement.

The previous implementation required **`maxChecks = 100`** consecutive stable
`requestAnimationFrame` readings (~1.6 s of no movement) before declaring the
layout stable. The rewrite declares it stable after just **two** matching
`offsetLeft` samples taken `STABILITY_CHECK_INTERVAL_MS` (100 ms) apart:

```js
if (currentOffsetLeft === lastOffsetLeftRef.current) {
  onStable()           // ← fires after a single 100ms quiet interval
} else {
  lastOffsetLeftRef.current = currentOffsetLeft
  scheduleCheck()
}
```

CSS columns reflow commonly *plateaus* briefly (e.g. text laid out, then a web
font finishes loading and shifts everything; or images decode). A single 100 ms
plateau now satisfies the stability test, so `onStable()` fires mid-reflow:
`view.load()` hides the spinner and `updateUltimateNodePosition` publishes a
**premature** `offsetLeft`. Everything that keys off "layout is ready" then reads
positions that are still moving — and BUG 1 means `Spread` never re-reads them.

**Suggested fix:** Require several consecutive stable samples (restore something
closer to the old confidence, e.g. N=3–5 unchanged reads) **and/or** key
stability off a quiet *period* with no DOM mutations rather than two raw
`offsetLeft` reads. Also re-arm the watch when web fonts resolve
(`document.fonts.ready`) since font loads are the classic late reflow. Keep
`MAX_WAIT_MS` as the safety valve.

---

## High

### BUG 3 — `lastSpreadIndex` (page count) is measured mid-reflow and from stale spread heights

**File:** `src/lib/with-last-spread-index.jsx` (observer effect + compute effect,
~lines 100–185)
**Severity:** High — produces phantom blank trailing pages / unreachable last spread.

`lastSpreadIndex` is computed as
`ceil(contentDimensions / frameHeight / 2) - 1`, where `contentDimensions` is the
content's `scrollHeight`. Two problems compound:

1. **Timing.** Measurement is triggered by a `MutationObserver` + `ResizeObserver`
   with a 100 ms debounce — it is **not** gated on the layout-settled signal. It
   can fire while columns are still reflowing.
2. **Stale inputs.** Each `<Spread>` contributes `frameHeight × multiplier` to the
   linear content height. If any spread's `multiplier` is wrong (BUG 1), the
   measured `scrollHeight` is off by a whole column, so the page count rounds to
   one too many or one too few. Too many → navigation allows turning to a
   non-existent final spread (**blank trailing page**); too few → the real last
   spread is **unreachable**.

**Suggested fix:** Gate the measurement on the same layout-settled signal as the
fix for BUG 1/BUG 2 (re-measure after `view.loaded`/`ultimateOffsetLeft`), and
ensure spread multipliers are finalized before counting. Fixing BUG 1 and BUG 2
removes most of the input error here; adding the settle gate removes the rest.

### BUG 4 — Three divergent "page width" formulas can desync page-turn from figure positioning

**Files:**
- `src/components/Spread.jsx:71` and `:123` — `window.innerWidth - paddingLeft - paddingRight + columnGap`
- `src/components/Reader/index.jsx` (`getTranslateX`) — `width - paddingLeft - paddingRight + columnGap` (uses `viewerSettings.width`, **not** `window.innerWidth`)
- `src/lib/with-node-position.jsx:~199,~296` — `window.innerWidth - paddingLeft * 2 + columnGap` (assumes `paddingLeft === paddingRight`)

**Severity:** High (correctness + maintainability).

The distance a page turn translates (`getTranslateX`) and the distance used to
classify/position a spread figure (`Spread`) and a node (`with-node-position`)
are computed by three different expressions for the same conceptual quantity.
They agree only when `viewerSettings.width === window.innerWidth` **and**
`paddingLeft === paddingRight`. When they diverge (scrollbar width, fractional
device-pixel rounding, asymmetric padding at a breakpoint), the figure's column
position steps by a different amount than the layout translates → the figure sits
half a page off → **overlap / blank**. Note also a *fourth* variant,
`getFrameWidth()` in `with-dimensions.jsx`, uses `- columnGap` (not `+`), so it is
**not** interchangeable — inviting a wrong-helper bug.

**Suggested fix:** Introduce a single source of truth, e.g.
`Viewport.getPageWidth(viewerSettings)`, and call it from all positioning/translate
sites. Decide deliberately whether it keys off `viewerSettings.width` or
`window.innerWidth` and whether padding is symmetric, then use it everywhere.

---

## Medium

### BUG 5 — `view.loaded` is never reset to `false`; `unload()` is now dead code

**Files:** `src/components/Reader/index.jsx` (`freeze`, ~lines 160–185),
`src/actions/view.js` (`unload`), consumers in
`src/components/Ultimate.jsx:182–192` and `src/helpers/media.js:41`.
**Severity:** Medium (latent fragility; not the primary spread symptom).

The old `freeze()` dispatched `viewActions.unload()` (toggling `view.loaded`
`true → false` at the start of each chapter load). The new `freeze()` deliberately
omits it, and **no code in `src/` dispatches `unload()` anymore** — the action and
reducer branch are dead. Consequences:

- `Ultimate`'s restart effect (`prevLoaded === true && view.loaded === false`) can
  now **never** fire; restart on chapter change survives *only* because
  `<props.BookContent key={spineItemURL}>` remounts the sentinel. That's an
  implicit dependency — if the remount key ever changes, the restart silently
  breaks.
- `Reader`'s backward-navigation effect is gated on `view.loaded` but now only
  re-fires on `lastSpreadIndex` transitions, narrowing its trigger.
- `media.js` gates playback on `view.loaded`; permanently-true means the guard no
  longer blocks during subsequent chapter loads.

**Suggested fix:** Either (a) remove the dead `unload` action, the dead
`Ultimate` restart effect, and rely explicitly on the remount (documented), or
(b) reintroduce a clean "chapter loading" flag distinct from the per-`Ultimate`
stability watch so consumers have a real `loading → loaded` edge to key off,
without the original bug of restarting the *old* sentinel.

### BUG 6 — Firefox / Windows-Edge measurement reads a position the observers don't watch

**File:** `src/lib/with-last-spread-index.jsx` (`measureContentDimensions`, ~lines 85–100)
**Severity:** Medium (browser-specific; also a maintainability smell).

For Firefox and Windows Edge the branch measures `contentDimensions =
lastNode.offsetLeft` (the sentinel's horizontal position). But both observers are
attached to `#content` (`node.current`). The sentinel's `offsetLeft` settling is
**neither a `#content` DOM mutation nor a `#content` resize**, so — exactly as in
BUG 1 — it is read once (mid-reflow) and never re-measured. Page count
under-counts on those browsers → last spread unreachable. The UA-sniffing itself
is fragile (Chromium Edge, future Firefox fixes silently flip the branch).

**Suggested fix:** Tie this measurement to the layout-settled signal too, and
measure the sentinel's position after settle rather than on raw mutation. Prefer
a feature/behavior probe over `browser.name` UA checks.

---

## Low (cleanup / correctness hardening)

### BUG 7 — `verso`/`multiplier` are redundant state derived a render late

**File:** `src/components/Spread.jsx` (`useState`/`useLayoutEffect`, lines 16–19, 95–101)

`verso` and `multiplier` are pure functions of `offset` but are stored as state
and set in a `useLayoutEffect`, forcing an extra render pass and leaving them one
render out of phase with `offset` (the `spreadContextValue` memo can run with new
`offset` + stale `verso`). The transient isn't painted (layout effect runs before
paint), so it's not a visible bug today — but it's unnecessary complexity that
makes BUG 1's symptoms harder to reason about. Also `left` state appears
write-only (set at line ~76, never read), and there is dead commented-out
`opacity` code in `SpreadFigure.jsx:16,30`.

**Suggested fix:** Derive inline during render and delete the layout effect:

```js
const verso = offset % 1 === 0          // (offset === 0 is already covered)
const multiplier = verso ? 2 : 3
```

Drop the unused `left` state and the commented-out `opacity`.

### BUG 8 — `SpreadContext` default `left` is the string `'0px'` → `Math.floor('0px') === NaN`

**File:** `src/lib/spread-context.js:5`, consumed at `src/components/SpreadFigure.jsx:18`

`SpreadFigure` does `Math.floor(origLeft)`. A real `<Spread>` always provides a
numeric `left`, so the default is currently only reachable if a `SpreadFigure`
ever renders without a `Spread` provider — but if it does, `left` becomes `NaN`,
the `marginLeft` comparisons all go false, and the figure is pushed off-screen.
The `layout: 'columns'` default is likewise shadowed by `layout: undefined` from
the provider (harmless today — no consumer reads `SpreadContext.layout`).

**Suggested fix:** Make the default numeric: `{ left: 0, layout: 'columns' }`.
Either stop providing `layout` from `Spread` (no consumer) or pass it through in
`process-nodes.js` if it's intended to matter.

### BUG 9 — `Ultimate` is a polling loop (violates the package "No polling" standard)

**File:** `src/components/Ultimate.jsx` (`scheduleCheck`)

A self-rescheduling `setTimeout` that reads `node.offsetLeft` every 100 ms is
polling, which `AGENTS.md` explicitly prohibits, and each read forces a synchronous
reflow. It is also one of *three* independent "wait for columns to settle"
implementations (here, `with-last-spread-index`, and `Spread`), each with a
different threshold — so they resolve at different moments and disagree about when
positions are valid (a structural cause of the intermittent symptoms).

**Suggested fix:** Replace polling with a `MutationObserver`/`ResizeObserver`
quiet-period detector (debounce until events stop), and consolidate the three
settle-detectors into a single authoritative "layout settled" signal that
`Spread`, `with-last-spread-index`, and `with-node-position` all consume.

### BUG 10 — Unguarded division when `pageWidth` resolves to 0/NaN

**File:** `src/components/Spread.jsx:71–74` and `:123–127`

`rawOffset = (nextLeft - paddingLeft) / pageWidth`. If `pageWidth`
(`innerWidth - paddingLeft - paddingRight + columnGap`) is ever `0` (degenerate
padding before `viewerSettings` is fully populated), `offset` becomes `±Infinity`
/ `NaN`, which propagates to `multiplier`, the spacer height, and
`SpreadContext.left` — and BUG 1 means it never self-corrects.

**Suggested fix:** Guard `if (!pageWidth) return` (or fall back) before dividing.

---

## Recommended fix order

1. **BUG 2** (stop declaring settle prematurely) and **BUG 1** (re-measure spreads
   on the settled signal) — together these address the bulk of "blank pages /
   overlap." Do them as a pair.
2. **BUG 3** + **BUG 6** (gate page-count measurement on settle) — fixes
   phantom/unreachable last pages.
3. **BUG 4** (single page-width source of truth) — removes the width-desync class
   of misplacement.
4. **BUG 5, 7–10** — hardening and cleanup; safe to batch.

A genuinely durable fix is **BUG 9's** consolidation: one "layout settled" signal
that every position consumer subscribes to, replacing the three ad-hoc detectors
and the structurally-wrong `ResizeObserver`-for-position usages.

---

## Verification notes

- `git show 52bb5d86~1:…/Ultimate.jsx` confirms the old `maxChecks = 100`
  RAF-based stability gate (BUG 2).
- `grep -rn unload src/` confirms `unload()` is dispatched nowhere; the old
  `freeze()` (`52bb5d86~1`) called it at line 257 (BUG 5).
- `process-nodes.js` creates `<Spread>`/`<SpreadFigure>` with `{...attrs, key}`
  only — no `layout` prop (BUG 8); `markers` was already unused in the old
  `Spread` body, so dropping it from `connect` is safe.
- `ResizeObserver` firing semantics (size-only, not position) are the basis for
  BUG 1 and BUG 6 and are confirmed by the in-file comments acknowledging the
  observer "never fires" on pure horizontal resize.
