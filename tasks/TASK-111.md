# TASK-111: Replace the Material Icons font with inline SVGs

**Status:** complete
**Feature:** React 19 (reader-react)
**Phase:** Modernization — assets / dependency removal
**Priority:** medium
**Model:** Sonnet 4.6 — mechanical icon swaps guarded by the test/snapshot
suite; the only judgment call is sourcing/matching the SVG paths.

> Read [`MIGRATION-CONVENTIONS.md`](../packages/b-ber-reader-react/MIGRATION-CONVENTIONS.md)
> first — behavior-preservation (§1) and scope discipline (§5) apply. Snapshots
> **will** change for the swapped buttons (ligature text → `<svg>`); regenerate
> intentionally and eyeball each diff.

## Description

Drop the `material-icons` webfont dependency and render every icon as an inline
SVG instead. Today icons are drawn by loading the full Material Icons filled
webfont (`import 'material-icons/iconfont/filled.css'`) and emitting the glyph
**ligature name as text** inside an element carrying the `material-icons` class
(e.g. `<button class="material-icons">play_arrow</button>`). This ships an entire
icon font to render ~7 glyphs, adds a render-blocking font load + FOUT, and is a
third-party dep we don't need.

### Structure — do NOT copy the `Navigation/Icon.tsx` pattern

The package has an existing inline-SVG file,
[`src/components/Navigation/Icon.tsx`](../packages/b-ber-reader-react/src/components/Navigation/Icon.tsx),
which crams many named exports (`Home`, `Download`, `Close`, `Info`, `Menu`,
`PageNext/Previous`, `ChapterNext/Previous`) into a single file. **Do not extend
or imitate that file.** Instead:

- Create a new **`src/components/Icons/`** directory (a sibling of `Navigation/`,
  **not** inside it).
- **One icon per file**, named for the icon: `Icons/PlayArrow.tsx`,
  `Icons/Pause.tsx`, `Icons/VolumeUp.tsx`, `Icons/Repeat.tsx`,
  `Icons/FileDownload.tsx`, `Icons/Forward30.tsx`, `Icons/Replay30.tsx`. Each
  file exports exactly one SVG component.
- An optional `Icons/index.ts` barrel may re-export them for ergonomic imports,
  but the components themselves stay one-per-file.
- **Leave `Navigation/Icon.tsx` untouched** — migrating its icons into the new
  structure is out of scope for this task. Where a glyph below matches an icon
  already drawn there (e.g. `file_download` ≈ `Download`), **lift the SVG path
  data into a new self-contained `Icons/<Name>.tsx` file** — copy the path, do
  not `import` from `Navigation/Icon.tsx`. The minor duplication is intentional;
  it keeps the new convention clean and avoids coupling `Icons/` to `Navigation/`.

Source any glyphs without an existing equivalent from the official Material
Symbols set (Apache-2.0, so we can vendor the path data inline) matching the same
glyph names, or trace from the currently rendered icons — whichever yields a
cleaner path. Keep each icon visually equivalent to what ships today.

(The `b-ber-tasks` web chrome is plain emitted HTML, not React — the `Icons/`
convention applies to reader-react only; inline the `<svg>` markup directly there.)

## Icon inventory

### `b-ber-reader-react` — Media controls (the primary surface)

| Glyph (ligature) | Button file | New `Icons/` file | Path-data source |
| ---------------- | ----------- | ----------------- | ---------------- |
| `play_arrow` | `components/Media/Controls/MediaButtonPlayPause.tsx` | `Icons/PlayArrow.tsx` | source new |
| `pause` | `components/Media/Controls/MediaButtonPlayPause.tsx` | `Icons/Pause.tsx` | source new |
| `volume_up` | `components/Media/Controls/MediaButtonVolume.tsx` | `Icons/VolumeUp.tsx` | source new |
| `repeat` | `components/Media/Controls/MediaButtonLoop.tsx` | `Icons/Repeat.tsx` | source new |
| `file_download` | `components/Media/Controls/MediaButtonDownload.tsx` | `Icons/FileDownload.tsx` | lift path from `Navigation/Icon.tsx` `Download` |
| `forward_30` | `components/Media/Controls/MediaButtonSeek.tsx` | `Icons/Forward30.tsx` | source new |
| `replay_30` | `components/Media/Controls/MediaButtonSeek.tsx` | `Icons/Replay30.tsx` | source new |

### `b-ber-tasks` — static-website chrome (`src/web/Template.ts`)

Required to fully remove the **root** `material-icons` dep. These are emitted
into generated website HTML, not React:

| Glyph | Existing reader SVG equivalent |
| ----- | ------------------------------ |
| `view_list` | ≈ `Menu` |
| `search` | source new |
| `close` | ≈ `Close` |
| `info` | ≈ `Info` |
| `arrow_back` | ≈ `ChapterPrevious`/`PagePrevious` (or source new) |
| `arrow_forward` | ≈ `ChapterNext`/`PageNext` (or source new) |

> The website is plain emitted HTML (no React), so inline the `<svg>` markup
> directly in `Template.ts` (or a small shared SVG-string helper). It cannot
> import the reader's `Icon.tsx` components.

## Subtasks

- [x] **reader-react:** create `src/components/Icons/` with one component per
      file (see Structure section) for the 7 Media-control glyphs; do **not**
      extend `Navigation/Icon.tsx`.
- [x] Swap each Media-control ligature for its `Icons/<Name>` component; keep
      sizing/positioning that `_media.scss` currently applies via `font-size`
      (translate to SVG `width`/`height` or a wrapper class).
- [x] Remove the `material-icons` class from those elements and any now-dead
      `font-size`-on-glyph rules in `styles/_media.scss`.
- [x] Remove `import 'material-icons/iconfont/filled.css'` from `src/index.tsx`
      and the stale comment in `styles/_icons.scss` (delete the partial if it's
      now empty).
- [x] **b-ber-tasks:** replace the 6 `material-icons` glyphs in
      `src/web/Template.ts` with inline `<svg>` markup; remove the
      `material-icons` class usages.
- [x] Confirm no other `material-icons` references remain anywhere (grep
      `material-icons` repo-wide excluding `node_modules`/`dist`/`builds`,
      incl. `b-ber-reader` which re-uses reader-react styles).
- [x] Remove the `material-icons` dependency from
      `packages/b-ber-reader-react/package.json`, the **root** `package.json`,
      and refresh `package-lock.json` (`npm install`).
- [x] Drop the now-unneeded `material-icons` CSS stub handling in
      `__tests__/helpers/styleStub.js` if nothing else relies on it.
- [x] `npm test` green in both affected packages; regenerate + review the
      reader-react snapshots (ligature → `<svg>` is an expected diff); verify the
      static-website build still renders icons (e.g. a `b-ber` web build of a
      fixture).
- [x] Manual QA: media controls (play/pause/seek/volume/loop/download) render &
      function; website chrome (toc/search/close/info/prev/next) renders.
- [x] Commit per package; update `PLAN.md`; remove `.open`.

## Notes

- **Cross-package scope is deliberate:** the dep can't leave the root
  `package.json` while `b-ber-tasks` still emits `material-icons` HTML, so both
  surfaces are in scope. If the website portion turns out to need design review,
  split it into a follow-up and keep the dep until then — but the reader-react
  swap is self-contained and can land independently.
- Filed under **React 19 (reader-react)** because that's the primary surface and
  the SVG-component pattern lives there; the `b-ber-tasks` web template is the
  coupled second half.
- Aligns with the standing preference for fewer third-party deps.
- Related: TASK-076 (CSS Modules — styling audit), TASK-068 (housekeeping).

### Implementation notes (2026-06-21)

- Created `src/components/Icons/` with one component per file (`PlayArrow`,
  `Pause`, `VolumeUp`, `Repeat`, `FileDownload`, `Forward30`, `Replay30`) plus
  an `index.ts` barrel for ergonomic imports. `Navigation/Icon.tsx` is
  untouched. All path data is Material Symbols "filled" variant (Apache-2.0),
  `viewBox="0 -960 960 960"`.
- `FileDownload.tsx` deliberately copies the path data and hardcoded
  `fill="#000000"` from `Navigation/Icon.tsx`'s `Download` verbatim (per the
  "lift, don't import" instruction) rather than using `currentColor` like the
  other six icons. This means `MediaButtonDownload`'s hover-color rule
  (`.bber-button.bber-hover`/`:hover { color: $success }`) does not visually
  affect this one icon's fill, matching the existing `Download` precedent it
  was copied from — not a new inconsistency introduced by this task.
  All other six icons use `fill="currentColor"` so the existing
  `.bber-hover`/`:hover` color rules keep working unchanged.
- `_media.scss`: translated three `font-size`-based glyph-sizing rules to
  `svg { width / height }` at the same pixel sizes the webfont rendered
  (24px play/pause, 17px volume/download, 18px forward/replay). The loop
  button has no button-specific sizing class and previously inherited
  `font-size: $font-size-sans` from `.bber-media__controls`; added a
  `svg { width: 1em; height: 1em; fill: currentColor }` fallback on the
  shared `.bber-a, .bber-button` selector so it keeps resolving relative to
  the inherited font-size context instead of needing a new CSS class.
- `_icons.scss` contained only a stale comment (no real CSS) — deleted the
  file outright and dropped its `@use 'styles/icons';` import in
  `index.scss`, rather than leaving an empty partial around.
- `b-ber-tasks/src/web/Template.ts`: added a module-level `Svg` map of raw
  `<svg>` strings (Material Symbols filled, same `0 -960 960 960` viewBox
  convention) and interpolated them into the existing template-literal HTML
  in `header()`, `prev()`, and `next()`, removing all six `material-icons`
  class/element usages. This file emits plain HTML (not React), so the
  `Icons/` component convention does not apply here, per spec. No test
  coverage existed for `Template.ts` before or after this change.
- Also added SVG sizing rules (24px, matching the old ligature default) to
  `packages/b-ber-theme-serif/layout/_web.scss`'s web-build conditional block
  (`.header__item__toggle svg`, `.publication__search__button svg`,
  `.publication__nav__link svg`) with `fill: currentColor`, since the
  pre-existing `button:hover { color: $success }` / `.publication__nav__link
  :hover { color: $success }` rules need an SVG `fill` to key off of. This
  was not explicitly called out in the subtask list but is required for the
  website chrome icons to render at a reasonable size and keep their hover
  color behavior — `b-ber-theme-sans` has no separate `_web.scss` (it builds
  on theme-serif's layout), so no parallel edit was needed there.
- Fixed two stale `MediaButtons.test.jsx` assertions
  (`button.textContent).toBe('play_arrow'/'pause')`) that asserted literal
  ligature text; replaced with `button.querySelector('svg')).not.toBeNull()`.
  These are not snapshot-based, so `-u` alone would not have caught them —
  they had to be fixed in the test source.
- Only one Jest snapshot changed (`MediaButtonDownload`), and the diff is
  exactly the expected swap: `material-icons` class removed, ligature text
  replaced by the `FileDownload` SVG markup. Reviewed and regenerated via
  `npx jest -u` in `b-ber-reader-react`.
- `b-ber-tasks`'s test suite initially showed 3 unrelated failures
  (`container.test.js`, `opf.test.js`, `inject.test.js`) due to
  `@canopycanopycanopy/b-ber-templates` not having a built `dist/` in this
  fresh worktree (its subpath exports like `./Xml` resolve to `dist/Xml/...`).
  This was a worktree environment-setup gap unrelated to this task; running
  `npm run build` in `packages/b-ber-templates` resolved it and all 7 suites
  (44 tests) pass.
- Updated a stale comment in `packages/b-ber-reader/src/index.jsx` (line 1)
  that mentioned material-icons as a styles source — `b-ber-reader` bundles
  `b-ber-reader-react` from source via a Vite alias, so it inherits the icon
  swap automatically with no functional change, only the comment needed
  fixing.
- Final repo-wide grep for `material-icons` (excluding node_modules/dist/
  builds) turns up only: historical references in `PLAN.md`/`tasks/TASK-006.md`/
  `tasks/TASK-076*.md` (left alone — historical record, not code) and this
  task file's own description of the old behavior, plus my own explanatory
  comments in `_media.scss` that reference the old webfont by name for
  context (not a live `.material-icons` selector). No functional/CSS-selector
  references remain.
- Quality gates: `npm test` green in both `b-ber-reader-react` (62 suites /
  407 passed, 1 pre-existing skip) and `b-ber-tasks` (7 suites / 44 passed);
  `npx tsc --noEmit` clean in `b-ber-reader-react`; `biome check .` from repo
  root shows 0 errors (18 pre-existing warnings in unrelated files, not
  touched by this task).
