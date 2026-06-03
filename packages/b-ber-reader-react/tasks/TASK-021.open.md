# TASK-021: Fix font-face flash on page load

**Status:** not started
**Phase:** Bug Fixes
**Priority:** low

## Description

The reader flashes unstyled/fallback text briefly on page load before the
custom fonts (Crimson Pro) finish loading. This is a standard FOUT (Flash of
Unstyled Text) caused by the browser rendering text before `@font-face` sources
have been fetched.

Fix with CSS `font-display: optional` or `font-display: block` on the
`@font-face` declarations in `src/styles/_fonts.scss`. `optional` tells the
browser not to swap in the custom font if it isn't ready during the initial
render — no swap, no flash. `block` gives a brief invisible period then swaps;
use if the custom font must always appear even at the cost of a short blank
flash.

## Subtasks

- [ ] Set `font-display: optional` on all `@font-face` rules in `src/styles/_fonts.scss`
- [ ] Verify the flash no longer appears on hard reload in the dev server
- [ ] If `optional` causes the font to never load on slow connections, try `block` instead

## Notes

Source file: `src/styles/_fonts.scss`. Currently has two `@font-face` blocks
(CrimsonPro-Regular and CrimsonPro-SemiBold) — both need the `font-display`
descriptor added.
