# AGENTS.md — b-ber-reader-react

Agent working standards for the `b-ber-reader-react` package. This document
describes how to do work here, how tasks are tracked, and what quality gates
must be passed before a task is considered done.

This package is part of the `b-ber` monorepo. The standards in this file are
designed to be portable across other packages in the monorepo — only the
package-specific sections (dev commands, architecture overview) will differ.

---

## What This Is

A side-scrolling EPUB viewer built in React + Redux. Given a `manifestURL`
prop, it fetches an OPF/NCX manifest from S3, parses it into an ordered spine
of HTML chapters, and renders the current chapter into a CSS `columns` layout
that overflow horizontally into "pages." A `translateX` transform on the
layout container simulates page-turning. A secondary scroll layout serves
mobile. The component is designed to be embedded in any React app as a
single `<Reader manifestURL="..." />` element.

### Functional flow

```
User provides manifestURL prop
  → App mounts → Reader/index.jsx initializes state
  → loader.js: fetches OPF/NCX → parses spine (ordered chapter list)
  → Redux: currentSpineItem dispatched
  → BookContent: renders current HTML chapter (via html-to-react)
  → Layout: CSS columns overflow creates horizontal "pages"
  → withDimensions: measures viewport → dispatches viewerSettings
  → withLastSpreadIndex: measures total content width → dispatches lastSpreadIndex
  → Ultimate: polls offsetLeft at 100ms until stable → dispatches spinnerVisible=false
  → UI unlocks: navigation controls become active

Page turn:
  → button click / keydown → navigation.js
  → Redux: currentPage updated
  → Layout translateX updated → CSS transform animates to new page

Chapter change:
  → navigation.js dispatches new spineItemURL
  → spineItemURL key prop on Layout changes → React remounts BookContent
  → loader.js fetches new HTML chapter, updates book.content global
  → stability cycle restarts (view.loaded: false → true) → Ultimate re-polls
```

### Key files

| File                                 | Purpose                                                 |
| ------------------------------------ | ------------------------------------------------------- |
| `../../PLAN.md`                      | Living project plan (root, organized by feature) — read first |
| `../../tasks/`                       | Task PRDs (root) — open tasks have `.open.md` extension  |
| `src/index.tsx`                      | Package entry point                                     |
| `src/components/App.tsx`                     | Redux Provider + Reader mount                           |
| `src/components/Reader/index.tsx`            | Main orchestrator (state, navigation, loading)          |
| `src/components/Layout.tsx`                  | CSS columns layout container                            |
| `src/components/Ultimate.tsx`                | Layout stability sentinel (hides spinner)               |
| `src/components/Spread.tsx`                  | Full-bleed spread image positioning                     |
| `src/lib/with-dimensions.tsx`                | HOC: measures viewport, dispatches viewerSettings       |
| `src/lib/with-last-spread-index.tsx`         | HOC: measures content width, dispatches lastSpreadIndex |
| `src/components/Reader/navigation.ts`        | Page and chapter navigation logic                       |
| `src/components/Reader/loader.ts`            | OPF/NCX fetch, spine parsing, book.content population   |
| `src/components/Reader/resize.ts`            | Window resize handlers                                  |

---

## Reading Before Starting

Before starting any task, read:

1. `../../PLAN.md` — current project state (root plan, organized by feature; the
   reader-react work lives under the "⚛️ React 19 (reader-react)" section)
2. `../../tasks/TASK-NNN.md` (or `.open.md`) — the specific task PRD (root `tasks/`)
3. Any source files named in the task

> **🛑 React 19 migration tasks (TASK-068, 073, 091, 094–100): also read
> [`MIGRATION-CONVENTIONS.md`](./MIGRATION-CONVENTIONS.md) before writing any
> code.** It is the binding spec — behavior-preservation rules, the per-commit
> verification gate, the class→functional / HOC→hook patterns, and the
> cross-version pitfalls snapshots don't catch (batching §3c, effect
> cleanup/StrictMode §3d, render purity §3e). The task's `**Model:**` field says
> which model (Sonnet/Opus) is best suited.

A model starting a new session should be able to read `AGENTS.md` + the root
`PLAN.md` and understand where the project stands without reading all the PRDs.

---

## First, Do No Harm

**The app must continue to function after every change.**

- Run `npm test` before and after any code change.
- Do not report a task complete if the test suite is broken.
- If a change causes a regression, fix the regression before moving on.
- Prefer small, targeted changes over large refactors. One behaviour change per commit.

---

## Commits

Commit work once it is verified (tests pass, behaviour confirmed). Follow the
conventional commit format used throughout this repo:

```
<type>(reader-react): <short imperative description>
```

**Types:** `fix`, `feat`, `chore`, `refactor`, `test`, `docs`

**Examples:**

```
fix(reader-react): removes transition from leaf elements
chore(reader-react): use createRoot
feat(reader-react): add ErrorBoundary to Frame
refactor(reader-react): extract navigation logic into custom hook
test(reader-react): add smoke tests for Ultimate stability detection
docs(reader-react): document verso/recto multiplier rationale
```

Rules:

- Use imperative mood in the description ("removes", "adds", "replaces" — not "removed")
- Keep the subject line under 72 characters
- One logical change per commit; do not bundle unrelated changes

---

## Description

What needs to be done and why.

## Subtasks

- [ ] Discrete step
- [x] Completed step

## Notes

Decisions, blockers, relevant context.
```

### Updating progress

- Set status to `in progress` when starting; `complete` when done.
- Update subtask checkboxes as work progresses — do not batch.
- When complete: remove `.open` from filename, update the root `../../PLAN.md`
  (React 19 feature section).

---

## Quality Gates

Before marking any task complete:

1. `npm test` passes — runs all unit tests AND smoke tests together (71 suites,
   458 tests / 9 snapshots as of the TS conversion); snapshots must not change
2. Root `../../PLAN.md` is updated (React 19 feature section)
3. Changes committed with a conventional commit message (see Commits section)
4. If the task changes how the app is configured, run, or structured: update `README.md`

The smoke tests live in `__tests__/components/*.smoke.test.jsx`. They use real Redux
stores (via `__tests__/helpers/store.js`) and fixture data (via `__tests__/helpers/fixtures.js`).
`ResizeObserver` and `window.matchMedia` are stubbed in `jest.setup.js`.

---

## Code Standards

- **No new class components.** All new components should be functional.
- **No polling.** Use `ResizeObserver`, `MutationObserver`, or event-driven
  approaches instead of `setInterval` / `requestAnimationFrame` loops.
- **No deprecated React lifecycle methods.** Replace with `useEffect` + `useRef`.
- **No `console.log` in production paths.** Remove debug logging before committing.
- **No magic numbers without a comment** explaining why the value is what it is.
- Comments should explain the WHY, not the WHAT. Do not restate the code.
- Do not add error handling for scenarios that cannot happen. Only validate at
  system boundaries.

---

## Architecture Notes

These are facts about the current architecture that inform decision-making.
They are NOT aspirational — they describe what exists today.

**HOC chain:**

```
Reader
  └─ Controls (navigation buttons, sidebar)
       └─ Frame (the scrollable viewport)
            └─ withDimensions (measures window, dispatches viewerSettings)
                 └─ withLastSpreadIndex (measures content, dispatches lastSpreadIndex)
                      └─ Layout (renders BookContent + Ultimate)
                           └─ BookContent (renders book.content)
                                └─ Ultimate (stability sentinel — hides spinner when layout is stable)
```

**selfRef pattern (temporary):**
`Reader/index.jsx` uses a `selfRef` shim so `navigation.js`, `loader.js`, and
`resize.js` can continue using `this.state` / `this.props` / `this.setState`
without being rewritten. This is an intermediate migration pattern. When those
modules are converted to custom hooks (TASK-013 / later), the shim should be removed.

**book.content global:**
`book.content` is a module-level mutable variable in `loader.js`. React does not
track mutations to it. `BookContent` is forced to re-render via the `spineItemURL`
key prop on Layout. This is a known issue to be fixed in the Redux modernization
phase (TASK-014).

**Stability detection:**
`Ultimate.jsx` runs a self-rescheduling `setTimeout` loop that polls `offsetLeft`
at 100ms intervals. When two consecutive readings are identical, layout is declared
stable and the spinner hides. A `MAX_WAIT_MS = 1500` hard timeout ensures the
spinner always hides even if layout never settles.

**Full-bleed spreads:**
`Spread.jsx` uses `viewerSettingsRef` (always-current ref) to avoid stale closures
in the ResizeObserver callback. `offset` is rounded to the nearest 0.5 to absorb
sub-pixel float errors from fractional `paddingLeft` values.

---

## Dev Environment

> **⚠️ Use port 3000.** The S3 content bucket's CORS policy whitelists
> `http://localhost:3000` specifically — the dev server (and any Playwright/
> headless repro) **must** run on port 3000 or every manifest/OPF/spine fetch
> fails with a CORS error and no book loads. If 3000 is taken, free it rather
> than letting Vite fall back to 3001.

```bash
# Run Vite dev server (serves from dev/) — must be on port 3000 (see above)
npm start

# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Production build
npm run build
```

### First-time setup

`dev/index.jsx` is gitignored — each developer keeps their own local copy:

```bash
cp dev/index.example.jsx dev/index.jsx
```

Edit `dev/index.jsx` and set a `manifestURL` pointing to a b-ber project's
`manifest.json`. All content (OPF, NCX, HTML spine items, assets) is fetched from
S3 at runtime — no local content setup is needed.

```jsx
function App() {
  return (
    <Reader manifestURL="https://s3.amazonaws.com/b-ber-projects-production/i29-roundup/project-reader/manifest.json" />
  )
}
```

### Available test projects

| Project slug                                     | Good for testing                                  |
| ------------------------------------------------ | ------------------------------------------------- |
| `i29-roundup`                                    | General — multi-chapter, text-heavy (**default**) |
| `spreads-testing-nov-2024`                       | Full-bleed spreads, verso/recto classification    |
| `what-could-i-have-said-with-a-mouthful-of-salt` | Additional general content                        |

Full URL pattern: `https://s3.amazonaws.com/b-ber-projects-production/<slug>/project-reader/manifest.json`

To switch projects: change `manifestURL` in `dev/index.js` and save — hot reload
picks it up without a server restart. See TASK-016 for expanding this list.

---

## Spawning Subagents

For tasks that involve reading many files in parallel (e.g., TASK-012 documentation),
spawn subagents — one per directory or concern. Each subagent should:

1. Read the relevant source files
2. Write a README or findings file
3. Report back with a summary

Do not spawn subagents for single-file changes or targeted bug fixes.

---

## Documentation Updates

After completing any task that changes how the app is configured, run, or structured:

- **Root `../../PLAN.md`** — update the React 19 feature section
- **`README.md`** — update if setup steps, CLI commands, or major features changed
- **Task PRD** (root `../../tasks/`) — mark complete, remove `.open` from filename

Do not consider a task complete until the root `PLAN.md` is updated.

---

## Monorepo Context

This package (`b-ber-reader-react`) is one of several packages in the `b-ber`
monorepo. The agent standards in this file are designed for portability. When
adapting to another package:

- Keep the task system identical — all tasks live in the **root** `tasks/` and
  the **root** `PLAN.md` (per-package `tasks/`/`PLAN.md` were flattened away)
- Keep the quality gates identical
- Keep the commit conventions identical (update the scope token, e.g. `reader-react` → `lib-epub`)
- Update the dev commands section
- Update the architecture notes section
- Add package-specific code standards as needed
