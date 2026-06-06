# TASK-027: Reset view.loaded reliably and remove the dead unload path

**Status:** not started
**Phase:** Bug Fixes
**Priority:** medium
**Created:** 2026-06-06

## Description

`view.loaded` is never reset to `false` on chapter navigation, and the
`unload()` action is now effectively dead. See `READER_BUGS.md` (BUG 5).

### Background

The old `freeze()` dispatched `viewActions.unload()` (`view.loaded → false`) at
the start of every chapter load. The hooks rewrite removed it from `freeze()`
because, on chapter change, dispatching `unload()` restarted the *outgoing*
chapter's still-mounted `Ultimate`, which then fired `onStable()` early and hid
the spinner before the new chapter had loaded. Restart on chapter change now
happens implicitly when `BookContent` remounts (`key={spineItemURL}`) and a fresh
`Ultimate` runs `startWatching` on mount.

Consequences of `view.loaded` being stuck `true`:

- `Ultimate`'s `loaded` true→false restart effect can never fire (dead code; the
  remount is the only restart path — an implicit, fragile dependency).
- `Reader`'s backward-navigation effect is gated on `view.loaded` but now only
  re-fires on `lastSpreadIndex` transitions.
- `helpers/media.js` gates playback on `view.loaded`; permanently true means the
  guard no longer blocks during subsequent chapter loads.
- TASK-026 had to dispatch `unload()` on the resize path specifically to re-arm
  the watch — a symptom of there being no clean, shared "loading" signal.

### Proposed fix

Introduce a single, well-defined signal for "a new chapter / layout is loading"
that is independent of any one `Ultimate` instance's stability watch, and have
all consumers (spinner, backward-nav, resize, `Spread`/`withLastSpreadIndex`
re-measurement) key off it. Then either:

- remove the dead `unload` action and `Ultimate`'s dead restart effect, and
  document the remount as the chapter-change restart mechanism; or
- restore a non-racy `loading → loaded` edge so chapter change, resize, and
  fullscreen all share one mechanism (superseding the TASK-026 workaround).

## Subtasks

- [ ] Decide the approach (explicit loading flag vs. document-the-remount)
- [ ] Implement; ensure chapter change does NOT hide the spinner prematurely
- [ ] Fold the TASK-026 resize workaround into the shared mechanism if applicable
- [ ] Audit `media.js` / backward-nav consumers of `view.loaded`
- [ ] Verify chapter nav (fwd/back), resize, and fullscreen across browsers
- [ ] `npm test`; commit; update `PLAN.md`; remove `.open`

## Notes

- Related: TASK-026 (resize spinner workaround), TASK-022/024 (consume the
  settle signal). A clean signal here would simplify all of them.
- Files likely involved: `src/components/Reader/index.jsx` (`freeze`),
  `src/components/Reader/resize.js`, `src/components/Ultimate.jsx`,
  `src/actions/view.js`, `src/reducers/view.js`, `src/helpers/media.js`.
