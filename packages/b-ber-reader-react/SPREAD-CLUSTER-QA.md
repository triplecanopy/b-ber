# Spread / layout cluster — browser QA checklist

Consolidated manual-verification checklist for the spread/layout-stability fixes
(**TASK-081, 082, 083, 084, 085**). All five are **implemented, typed, merged**
into `feat/upgrades` and pass the unit suite (458 tests / 9 snapshots). The only
thing blocking close-out is manual reader QA — automated tests can't cover
column-reflow correctness across real browsers and window widths.

Full root-cause analysis for each item lives in [`READER_BUGS.md`](./READER_BUGS.md)
(referenced as BUG 1–10). This file is the **test plan**; that file is the
**why**.

## How to run

```bash
cd packages/b-ber-reader-react
npm start            # Vite dev server
```

Edit `dev/index.jsx` to point `<Reader manifestURL=… />` at the project under
test (URLs are already listed there, commented). Recommended projects:

- **`spreads-testing-nov-2024`** — dense full-bleed spreads (primary spread test)
- **`i29-roundup`** — default project, good for resize/spinner
- **`i30-ibrahim`, `i30-keogh`, `i29-weist`** — multi-spread chapters for page-count

Test in **Chrome, Firefox, and Safari** where a row calls for it (the
Firefox/Edge `offsetLeft` path differs — BUG 6).

---

## TASK-082 — Ultimate layout-stability detection (spinner timing)

Foundation for the others: the `view.loaded` / `view.ultimateOffsetLeft` signal
must be trustworthy.

- [ ] Load a chapter: spinner hides **only after** layout settles (no content
      visibly reflowing/jumping after the spinner disappears).
- [ ] A chapter with a custom web font / large images: spinner does **not** hide
      mid-reflow when the font finishes loading (re-arm on `document.fonts.ready`).
- [ ] No chapter hangs on the spinner indefinitely on normal load (hard timeout
      `MAX_WAIT_MS = 2500ms` is the safety valve, should rarely be hit).

## TASK-081 — Stale full-bleed spread column position (verso/recto)

The headline bug: blank/empty pages, overlapping content, misplaced figures.

- [ ] `spreads-testing-nov-2024`: every full-bleed spread renders on the correct
      page with **no blank/empty page** beside it and **no overlap**.
- [ ] Repeat at an **odd window width (~1425px)** where `paddingLeft` is
      fractional — the original failure mode. No misplaced figures.
- [ ] Resize slowly through a range of widths: spreads re-settle to correct
      columns without oscillation (the bounded convergence loop, max 30 frames).
- [ ] A text-heavy project (not just the spreads fixture): spreads still correct.
- [ ] **Chrome, Firefox, Safari.**

## TASK-083 — lastSpreadIndex re-measured after settle (page count)

- [ ] Multi-spread chapter (`i30-ibrahim` / `i30-keogh`): navigate to the **last
      spread** — it is reachable (not cut off).
- [ ] No **blank trailing page** after the last spread.
- [ ] Page-count / nav controls show the right total.
- [ ] **Firefox** specifically (the `offsetLeft` sentinel path, BUG 6) — last
      spread reachable there too.

## TASK-084 — Viewport.getPageWidth (spread positioning vs. page-turn)

The `getPageWidth` change feeds both spread positioning and the page-turn
transform; correctness shows up in the TASK-081 spread tests above plus:

- [ ] Page turns advance by exactly one page (figures don't drift half a page
      off after several turns).
- [ ] Verify at a width where the scrollbar/device-pixel rounding makes
      `viewerSettings.width ≠ window.innerWidth` (e.g. with a visible scrollbar).

> Note: the `with-node-position` migration to this helper is **out of scope here**
> — it's folded into the HOC→hooks migration (React 19 Step 2). 084 closes on the
> spread/page-turn QA above.

## TASK-085 — Infinite spinner on window resize

- [ ] `i29-roundup`: resize the window — spinner hides and the reader returns
      (does **not** spin forever).
- [ ] Resize **repeatedly** in quick succession — recovers every time.
- [ ] Toggle **fullscreen** — same recovery.
- [ ] After resize, the reader lands on the **correct spread** (not reset/blank).
- [ ] Chapter navigation still works normally after a resize (no regression to
      the premature-hide bug — BUG 5).

---

## Sign-off

When a task's boxes all pass, tell the agent and it will: check the remaining
subtasks in the task file, mark it `complete`, drop `.open`, update `PLAN.md`,
and close any GitHub issue. Report any failures with the project + window width
+ browser so the fix can be reopened.
