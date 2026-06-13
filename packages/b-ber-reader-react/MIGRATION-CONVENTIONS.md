# React 19 migration — conventions

**Owned by TASK-094.** Read this before starting any React 19 migration task
(TASK-095–100 and the state-management work). It defines the *one* way to do
each kind of conversion so the wave tasks stay consistent and small. The wave
tasks reference these rules rather than re-deriving them.

These conventions exist because the migration is split into many small,
independently-shippable tasks (deliberately, so each fits a smaller context
window and is individually verifiable). Consistency has to be decided here, once.

---

## 0. The golden rule

**Behavior must be preserved exactly.** The app must function identically after
every conversion. These tasks are *not* a redesign — they change *how* a
component is written, never *what* it does. Anything that would change behavior
(bug fixes, layout tweaks, state-shape changes) is out of scope and belongs to a
dedicated task.

"Exactly" means **observable app behavior**, which is not always the same as a
*literal* line-for-line translation. The clearest example is state batching
(§3c): mechanically faithful `setState`→setter code can still behave differently
at runtime across React versions. Preserving behavior there takes judgment, not
just a transcription — when in doubt, flag it for review.

## 1. Verification gate (every task, every commit)

Run **all** of these before marking any conversion done:

1. `npm test` — 71 suites / 458 tests pass. Count must not regress.
2. **9 snapshots unchanged.** A changed snapshot means render output moved =
   a behavior change = a bug in the conversion. **Fix the conversion; never
   re-record the snapshot** to make it pass. (Snapshots capture *final* output
   only — they do **not** catch render count, update ordering, or batching
   differences; see §3c for what they miss.)
3. `npm run typecheck` (`tsc --noEmit`) clean — strict mode, no new `any` beyond
   what the file already had.
4. **Targeted browser QA** only where the change can affect layout, positioning,
   or media playback (Media subtree, position hooks, selfRef removal). Pure leaf
   components verified by tests + snapshots need no manual QA.

## 2. Commit discipline

- **One conversion per commit** — one component, or one HOC + its consumer
  updates. Never bundle unrelated conversions.
- Conventional commits, `reader-react` scope. Use `refactor` for behavior-
  preserving conversions: `refactor(reader-react): convert Footnote to functional`.
- Update the task PRD checkboxes as you go (don't batch); update the root
  `PLAN.md` React section when a task closes.

## 3. Class → functional component

Standard mechanical mapping. Apply it literally; don't get creative.

| Class member | Functional equivalent |
| ------------ | --------------------- |
| `constructor` state / `this.state` | `useState` (independent values) or `useReducer` (related/transition-y) |
| instance fields (non-state) | `useRef` (mutable, no re-render) |
| `React.createRef()` | `useRef(null)` |
| `componentDidMount` | `useEffect(() => { … }, [])` |
| `componentWillUnmount` | cleanup return from `useEffect(…, [])` |
| `componentDidUpdate(prev)` | `useEffect(() => { … }, [dep])` keyed on the changed value |
| `UNSAFE_componentWillMount` | `useEffect(…, [])` (note: now runs *after* first paint — see §3a) |
| `UNSAFE_componentWillReceiveProps(next)` | `useEffect(…, [prop])` reacting to the prop, **or** derive-during-render if it was computing state from props |
| instance methods | plain functions in the body, or `useCallback` if passed as props / effect deps |
| `this.props` / `this.context` | `props` arg / `useContext(TheContext)` |

### 3a. `UNSAFE_componentWillMount` caveat

`UNSAFE_componentWillMount` ran **before** first render; `useEffect(…, [])` runs
**after** first paint. If the component depended on a side effect completing
before the first render (e.g. `App`'s async manifest load, `Media`/`Vimeo` setup),
preserve the original ordering: gate render on a ready flag, or move the work to
a `useState` initializer / `useMemo` if it's synchronous and render-blocking.
**Verify the spinner/loading sequence is unchanged** (this is exactly the class
of regression the spread cluster fought — don't reintroduce it).

### 3b. Keep `connect()` for now

If a class is wrapped by `react-redux` `connect()`, **leave `connect()` in place**
— it wraps functional components fine. Do **not** swap `connect`/`mapStateToProps`
for `useSelector`/`useDispatch` in this wave; that is the state-management
migration (TASK-073 → Step 4). Keeping `connect()` keeps these diffs purely about
the component body and isolates the state change to one later task.

### 3c. State updates and automatic batching (cross-version)

`b-ber-reader-react` is a **library embedded in host apps**, and its
`peerDependencies` range is **React 16.2 → 19** (dev/test currently runs React
19.1). **Automatic batching of state updates changed within that range**, and it
is the one place a *literal* `this.setState` → `useState`-setter translation can
be mechanically faithful yet behave differently at runtime:

- **React ≤17:** multiple `setState` calls are batched only inside React event
  handlers. In promises, `await` continuations, `setTimeout`, native event
  handlers, and `ResizeObserver`/`MutationObserver` callbacks they run
  **synchronously** — each triggers its own re-render, and state/DOM is
  observable *between* them.
- **React 18+:** updates are **automatically batched everywhere**, including all
  those async/observer contexts — several updates in one tick coalesce into a
  single re-render.

The reader has clusters of updates in exactly the contexts that diverge — the
async loader, navigation, resize handlers, and Media components
(`Reader/loader.ts`, `navigation.ts`, `resize.ts`, `Media/*`). **A conversion
must not depend on update timing or render count**; write it so it is correct
under *both* batched and unbatched behavior:

1. **Treat multiple setters in one function body as one logical transition.**
   Prefer a single `useReducer` (or one consolidated `useState` object) so the
   transition is atomic and explicit. This is the idiomatic fix for "several
   `setState` in one function," reads better, and removes any dependence on
   whether the runtime batches — make these clusters the preferred target.
2. **Use functional updaters** `setX(prev => next)` whenever the new value
   derives from the current one, so batching / stale closures can't read a stale
   value.
3. **Never rely on an intermediate render between two updates.** If class code
   reads the DOM or derived state *between* two `setState` calls expecting the
   first to have committed, that assumption is already fragile and breaks under
   18+ — restructure to compute the final state once, then apply it.
4. **`flushSync` is a deliberate escape hatch, not a default.** If a conversion
   genuinely needs the DOM committed between two updates (a measure-then-act
   step), `flushSync` (from `react-dom`) forces it — but it defeats batching and
   costs performance, so use it rarely and comment *why*. None is used today;
   introducing one is a signal to **stop and get the conversion reviewed**. Do
   not reach for it to paper over a deferred spread/layout bug (out of scope — §5).

**Snapshots will not catch batching changes** — they capture final output, not
render count or intermediate states. The batching-sensitive conversions (the
async/observer paths above — **TASK-096** and especially **TASK-100**) must be
reasoned through, **browser-QA'd**, and flagged for review when update ordering
is non-obvious.

### 3d. Effect idempotency & cleanup (and StrictMode as the detector)

A class lifecycle runs on a fixed schedule; an effect does not. `useEffect` can
run **more than once** — its cleanup fires before every re-run (not just on
unmount), and under React 18+ **StrictMode in dev it deliberately runs
mount → cleanup → mount again** to surface effects that aren't safe to repeat.
So converting `componentDidMount`/`componentWillUnmount` to an effect is *not*
just syntax: the effect must be **idempotent** and its cleanup must **fully
reverse** whatever it set up.

Rules:

1. **Every effect that allocates or subscribes returns a cleanup that undoes it
   exactly.** Observers `disconnect()`, listeners `removeEventListener`, timers
   `clearTimeout`/`clearInterval`, in-flight work is aborted or its result
   ignored. `componentWillUnmount` → the cleanup return, but remember the cleanup
   also runs *between* re-runs.
2. **Idempotent:** running effect → cleanup → effect again must leave no
   duplicated side effect (no double fetch, double observer, leaked listener).
3. The reader's at-risk effects: the async **loader** fetch (guard against
   double/overlapping loads — abort or ignore stale results on cleanup), the
   **ResizeObserver/MutationObserver** attach (disconnect on cleanup), window/
   keyboard **event listeners**, the **`Ultimate`** polling loop (clear the
   timeout + reset its active flag), and the **`document.fonts.ready`** handler.
4. **Don't paper over the double-invoke with a "run once" ref** unless the
   semantics are genuinely one-time (e.g. one-shot analytics). For data loading
   and subscriptions, make the effect idempotent/abortable — that's the actual
   fix and it's also what keeps the code correct under concurrent remounts.

**Detector:** temporarily wrap the dev harness (`dev/index.jsx`) in
`<React.StrictMode>` while doing these conversions. A correct conversion runs
cleanly under it; a missing/incorrect cleanup shows up immediately as a double
fetch, doubled observer, or leak. StrictMode is **not** enabled today and need
not ship — it's a migration-time tool. (`createRoot` is already in use, so
concurrent behavior is otherwise live regardless.)

### 3e. Render purity / external reads (concurrent rendering)

Concurrent React may call a component's render **multiple times**, bail out, or
restart it before committing. Render must therefore be **pure**: no side effects,
no mutation, and **no reads of mutable external sources during render** — those
can *tear* (observe inconsistent values within one render pass) or be thrown away.

Existing offenders in the tree (do **not** worsen them; fix one only when you're
already converting that file, otherwise leave it for the dedicated task):

- `window.innerWidth` / `innerHeight` read directly in render/computation paths
  — `Footnote`, `Spread`, `SpreadFigure`.
- the **`book.content` module-global rendered straight into JSX** (`BookContent`)
  — the long-known render-pipeline bypass.
- `Layout`'s `debounce` created in the render body.

Rules:

1. **Introduce no new in-render reads** of `window`/`document`/module globals or
   other mutable external state. Move the read into an effect + state, or read it
   from props/the store.
2. **`useSyncExternalStore` is the tear-free primitive** for subscribing to a
   genuinely external store. It's the right tool for window dimensions
   (`with-dimensions` → hook, **TASK-098**) and for the eventual built-in state
   store + `book.content` (**TASK-073** → Step 4) — note it there rather than
   hand-rolling a `useEffect`+`useState` window-size subscription.
3. When a conversion *forces* you to touch one of the offenders above, fixing it
   to a pure read is in scope; a broad sweep of all of them is not (that belongs
   to housekeeping / the state work).

## 4. HOC → hook

Done **after** all of an HOC's consumers are already functional components (so
the conversion is mechanical). Pattern:

1. Add a hook `useX()` next to the HOC that returns what the HOC injected as
   props (it may call `useSelector`/`useDispatch` internally — converting the
   *HOC's own* Redux access to hooks **is** the point of this wave, and is
   distinct from §3b's component-level `connect()`).
2. In each (now functional) consumer, call `useX()` instead of reading the
   injected props.
3. Remove the `withX(...)` wrapper from the consumer's export.
4. Delete the HOC once it has no consumers.
5. Replace the HOC-injected props that TASK-032 left typed `any` with the hook's
   real return type (see TASK-032 "Type debt" — this is where those clusters are
   meant to dissolve).

Convert one HOC and all its consumers in a single task/commit so the codebase is
never left half-wired.

## 5. Scope discipline (what NOT to do)

- **No spread/polling bug fixes.** TASK-086/087/088/089/069/078 are deferred to
  after the migration. Don't touch the `Ultimate` polling loop, spread
  measurement, or sentinel detection.
- **No state-architecture changes** beyond converting an HOC's own access to a
  hook (§4). The Redux→built-in migration is TASK-073/Step 4.
- **No reorganization** beyond what a conversion strictly requires. File moves,
  renames, CSS-module migration (TASK-076), and docs (TASK-071) are separate.
- **Dead code:** remove only what is *provably* unreferenced (Biome
  `noUnusedVariables`/`noUnusedImports` + grep). When in doubt, leave it.

## 6. Typing

- Strict mode stays on. No new `any`. Prefer deriving real types as HOC-injected
  `any` props become hook return types (§4.5).
- Reuse the shared types in `src/store/types.ts` / `src/components/Reader/types.ts`
  rather than inventing local duplicates (TASK-032 flagged the duplication).

## 7. Model guidance (which model runs which task)

The wave tasks carry a `**Model:**` field. Rule of thumb:

- **Sonnet 4.6** — mechanical conversions with a clear pattern and strong test
  coverage as a guardrail (leaf components, the Media subtree, measurement HOCs).
  Small diffs, snapshots catch render drift.
- **Opus** — high-judgment work: this conventions doc, `App` (async
  pre-render side effect + `connect`), the position hooks (geometry + marker QA +
  most consumers), and the `selfRef` removal (the most entangled change, and the
  densest batching-sensitive site per §3c). Also the state-management research
  (TASK-073). When a Sonnet task hits non-obvious cross-version behavior —
  batching (§3c), effect cleanup/idempotency (§3d), or render purity (§3e),
  e.g. `Media`/`Vimeo` in TASK-096 — escalate that piece to Opus.

---

## Conversion order (the why)

```
Step 1 — class → functional (HOCs stay as wrappers):
  TASK-095  leaf components (Footnote, Marker, SidebarSettings)
  TASK-096  Media subtree (Media, Vimeo, Iframe, MediaControls, MediaButtonVolume)
  TASK-097  App

Step 2 — HOC → hook (now every consumer is functional):
  TASK-098  measurement HOCs (with-dimensions, with-navigation-actions)
  TASK-099  position HOCs (with-node-position, with-iframe-position) + TASK-084 getPageWidth adoption

  TASK-100  remove selfRef shim (navigation/loader/resize → hooks)

Step 3 — TASK-073 state-management research → Step 4 execution
```

Components convert before HOCs because an HOC wraps a functional component
without issue, but a hook can only be called from a functional component — so
making consumers functional first turns every HOC→hook step into a mechanical
swap with no half-wired intermediate state.
