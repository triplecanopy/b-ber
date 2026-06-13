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

## 1. Verification gate (every task, every commit)

Run **all** of these before marking any conversion done:

1. `npm test` — 71 suites / 458 tests pass. Count must not regress.
2. **9 snapshots unchanged.** A changed snapshot means render output moved =
   a behavior change = a bug in the conversion. **Fix the conversion; never
   re-record the snapshot** to make it pass.
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
  most consumers), and the `selfRef` removal (the most entangled change). Also
  the state-management research (TASK-073).

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
