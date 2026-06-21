# TASK-111: Replace the Material Icons font with inline SVGs

**Status:** not started
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

- [ ] **reader-react:** create `src/components/Icons/` with one component per
      file (see Structure section) for the 7 Media-control glyphs; do **not**
      extend `Navigation/Icon.tsx`.
- [ ] Swap each Media-control ligature for its `Icons/<Name>` component; keep
      sizing/positioning that `_media.scss` currently applies via `font-size`
      (translate to SVG `width`/`height` or a wrapper class).
- [ ] Remove the `material-icons` class from those elements and any now-dead
      `font-size`-on-glyph rules in `styles/_media.scss`.
- [ ] Remove `import 'material-icons/iconfont/filled.css'` from `src/index.tsx`
      and the stale comment in `styles/_icons.scss` (delete the partial if it's
      now empty).
- [ ] **b-ber-tasks:** replace the 6 `material-icons` glyphs in
      `src/web/Template.ts` with inline `<svg>` markup; remove the
      `material-icons` class usages.
- [ ] Confirm no other `material-icons` references remain anywhere (grep
      `material-icons` repo-wide excluding `node_modules`/`dist`/`builds`,
      incl. `b-ber-reader` which re-uses reader-react styles).
- [ ] Remove the `material-icons` dependency from
      `packages/b-ber-reader-react/package.json`, the **root** `package.json`,
      and refresh `package-lock.json` (`npm install`).
- [ ] Drop the now-unneeded `material-icons` CSS stub handling in
      `__tests__/helpers/styleStub.js` if nothing else relies on it.
- [ ] `npm test` green in both affected packages; regenerate + review the
      reader-react snapshots (ligature → `<svg>` is an expected diff); verify the
      static-website build still renders icons (e.g. a `b-ber` web build of a
      fixture).
- [ ] Manual QA: media controls (play/pause/seek/volume/loop/download) render &
      function; website chrome (toc/search/close/info/prev/next) renders.
- [ ] Commit per package; update `PLAN.md`; remove `.open`.

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
