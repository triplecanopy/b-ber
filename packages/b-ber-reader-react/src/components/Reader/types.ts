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
  userInterface: { handleEvents: boolean }
  cache: boolean
  downloads: unknown[]
  uiOptions: unknown
  layout: string
  style: React.CSSProperties
  className: string

  viewerSettingsActions: BoundActions
  readerSettingsActions: BoundActions
  readerLocationActions: BoundActions
  viewActions: BoundActions
  userInterfaceActions: BoundActions
}

// ─── selfRef shim surface ────────────────────────────────────────────────────
// The intermediate `selfRef` object that navigation.ts, loader.ts, and
// resize.ts are bound to in place of `this`. It exposes class-instance-style
// getters (state/props) plus the instance methods those modules call on `this`.
// This is an intentional migration shim; a later task replaces it with hooks.
// The bound module functions are attached dynamically on first render, so the
// method members are declared here to satisfy the `this` references.
export interface ReaderInstance {
  readonly state: ReaderState
  readonly props: ReaderProps
  resizeEndTimer: ReturnType<typeof setTimeout> | null

  setState(
    update: Partial<ReaderState> | ((prev: ReaderState) => ReaderState),
    callback?: () => void
  ): void
  closeSidebars(): void
  freeze(): void
  handleSidebarButtonClick(value: string | null): void
  getTranslateX(spreadIndex?: number): number
  destroyReaderComponent(): void
  getSlug(): string

  // Bound from loader.ts
  createStateFromOPF(callback?: () => void): Promise<void>
  showSpineItem(): void
  loadSpineItem(
    spineItem?: SpineItem,
    deferredCallback?: () => void
  ): Promise<void>

  // Bound from navigation.ts
  updateQueryString(callback?: () => void): void
  savePosition(): void
  handlePageNavigation(increment: number): void
  handleChapterNavigation(increment: number): void
  navigateToSpreadByIndex(spreadIndex: number): void
  navigateToElementById(id: string): void
  navigateToChapterByURL(absoluteURL: string): void
  getSpineItemByAbsoluteUrl(absoluteURL: string): number

  // Bound from resize.ts
  handleResize(): void
  handleResizeStart(): void
  handleResizeEnd(): void
  bindResizeHandlers(): void
  unbindResizeHandlers(): void
}
