# TASK-104: Accessibility (a11y) baseline

**Status:** not started
**Feature:** React 19 (reader-react)
**Phase:** Modernization — quality
**Priority:** medium
**Model:** Sonnet 4.6 for the mechanical ARIA/labels/semantics; escalate focus
management and the reduced-motion/transition interaction to Opus if it gets
subtle.

> Read [`MIGRATION-CONVENTIONS.md`](../packages/b-ber-reader-react/MIGRATION-CONVENTIONS.md)
> §1. a11y additions are behavior-additive; keep existing behavior intact and
> verify snapshots only change where new ARIA attributes are deliberately added.

## Description

The reader has working keyboard page/chapter navigation but no deliberate
accessibility layer. Establish a baseline so the reader is usable with a keyboard
and screen reader and respects motion preferences. This is a new quality track
for reader-react (extends the React 19 epic into a11y).

## Subtasks

- [ ] **Semantics & ARIA**: label the nav controls (prev/next page, prev/next
      chapter, sidebar toggles) with accessible names; correct roles on the
      header/footer/sidebar; mark the reading region appropriately.
- [ ] **Focus management**: move/restore focus on chapter change and on
      sidebar open/close; ensure the sidebar is fully keyboard-operable and
      traps/returns focus correctly; visible focus indicators.
- [ ] **Reduced motion**: respect `prefers-reduced-motion` for the page-turn
      `translateX` transition and any leaf animations (coordinate with the
      transition logic in `Layout`/`transition-styles`).
- [ ] **Media & figures**: ensure alt text / labels pass through for figures and
      media controls; the custom `MediaControls` are keyboard-operable and
      labelled.
- [ ] **Live regions**: announce chapter/page changes politely (e.g. an
      `aria-live` status) so SR users get navigation feedback.
- [ ] Add a smoke/RTL test pass for the key roles/labels; consider an
      `axe`-based check in the test setup (evaluate as part of the task).
- [ ] 9 snapshots reviewed (intentional ARIA additions only); tests pass;
      `tsc --noEmit` clean
- [ ] **Manual QA**: keyboard-only navigation end to end; a screen-reader spot
      check (VoiceOver/NVDA); reduced-motion on.
- [ ] Commit; update `PLAN.md`; remove `.open`

## Notes

- Scope is a **baseline**, not full WCAG certification — get the high-value
  basics right (names, focus, reduced motion, live region) and document gaps.
- Coordinate with [[TASK-076]] (CSS Modules) for focus-indicator styles and with
  [[TASK-078]] (leaf flicker) / transition work for the reduced-motion piece.
- Best scheduled after the structure/state churn settles so ARIA isn't rewritten
  twice, but it's independent enough to start anytime.
