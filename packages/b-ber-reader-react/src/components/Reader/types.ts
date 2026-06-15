import type SpineItem from '../../models/SpineItem'
import type {
  AppDispatch,
  ReaderLocationState,
  ReaderSettingsState,
  ViewerSettingsState,
  ViewState,
} from '../../store/types'

// Action-creator bundles as produced by `bindActionCreators(...)`. The action
// modules are typed TS, but binding them erases the precise per-creator
// signatures into dispatch-returning functions, so the bundles are kept loose
// here. TODO: derive these from the action modules once the dispatch typing is
// tightened (TASK-073).
export type BoundActions = Record<string, (...args: any[]) => unknown>

// Reader state as managed by the Reader functional component's useState. Only
// the fields the external modules (loader/navigation/resize) and the render
// read are enumerated; the shape is otherwise permissive.
export interface ReaderState {
  __metadata: unknown[]
  __spine: unknown[]
  __guide: unknown[]

  opsURL: string
  spine: SpineItem[]
  guide: unknown[]
  metadata: unknown[]
  spineItemURL: string
  currentSpineItem: SpineItem | null
  currentSpineItemIndex: number
  cache: boolean

  spreadIndex: number
  chapterDelta: number
  relativeSpreadPosition: number
  spreadDelta?: number

  firstChapter: boolean
  lastChapter: boolean
  firstSpread: boolean
  lastSpread: boolean

  showSidebar: string | null
  slug?: string

  disableMobileResizeEvents: boolean
}

// Props the Reader component receives from connect() + its owner. Only the
// fields read by the component and the external modules are typed.
export interface ReaderProps {
  readerSettings: ReaderSettingsState
  viewerSettings: ViewerSettingsState
  readerLocation: ReaderLocationState
  view: ViewState
  cache: boolean
  downloads: unknown[]
  uiOptions: unknown
  layout: string
  style: React.CSSProperties
  className: string

  viewerSettingsActions: BoundActions
  readerLocationActions: BoundActions
  viewActions: BoundActions
  userInterfaceActions: BoundActions
}

// Props the Reader *function* receives. readerSettings and userInterfaceActions
// are no longer threaded in (Reader reads them from the built-in store and
// injects them into propsRef — TASK-106), so they are omitted from the
// component's own/connected prop surface while remaining on ReaderProps for the
// modules that read propsRef.
export type ReaderComponentProps = Omit<
  ReaderProps,
  'readerSettings' | 'userInterfaceActions'
>

// setState shim signature — the class-style partial-merge + callback setter the
// Reader exposes and the hooks below call.
export type SetState = (
  update: Partial<ReaderState> | ((prev: ReaderState) => ReaderState),
  callback?: () => void
) => void

// A plain mutable ref ({ current }). Matches what React.useRef returns and lets
// tests pass a literal `{ current: … }` without constructing a real ref.
export interface MutableRef<T> {
  current: T
}

// ─── Reader API ──────────────────────────────────────────────────────────────
// The assembled set of orchestrator callbacks (Reader's own methods plus those
// returned by useLoader / useNavigation / useResize). The hooks resolve
// cross-cutting calls through a ref to this object instead of the old `this`
// shim, so the call graph (which is cyclic — navigation ↔ loader) stays wired
// without ordering constraints. Reader assembles it each render from the stable
// hook callbacks; consumers read `apiRef.current.<fn>` at call time.
export interface ReaderApi {
  setState: SetState
  closeSidebars(): void
  freeze(): void
  handleSidebarButtonClick(value: string | null): void
  getTranslateX(spreadIndex?: number): number
  destroyReaderComponent(): void
  getSlug(): string

  // From useLoader
  createStateFromOPF(callback?: () => void): Promise<void>
  showSpineItem(): void
  loadSpineItem(
    spineItem?: SpineItem,
    deferredCallback?: () => void
  ): Promise<void>

  // From useNavigation
  updateQueryString(callback?: () => void): void
  savePosition(): void
  handlePageNavigation(increment: number): void
  handleChapterNavigation(increment: number): void
  navigateToSpreadByIndex(spreadIndex: number): void
  navigateToElementById(id: string): void
  navigateToChapterByURL(absoluteURL: string): void
  getSpineItemByAbsoluteUrl(absoluteURL: string): number

  // From useResize
  handleResize(): void
  handleResizeStart(): void
  handleResizeEnd(): void
  bindResizeHandlers(): void
  unbindResizeHandlers(): void
}

// Shared dependencies the orchestrator threads into each hook: always-current
// refs to state/props (read synchronously inside async/observer callbacks), the
// setState shim, and the ref to the assembled ReaderApi for cross-hook calls.
export interface ReaderHookDeps {
  stateRef: MutableRef<ReaderState>
  propsRef: MutableRef<ReaderProps>
  setState: SetState
  api: MutableRef<ReaderApi>
}
