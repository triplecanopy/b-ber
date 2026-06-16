import find from 'lodash/find'
import isInteger from 'lodash/isInteger'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import * as viewerSettingsActions from '../../actions/viewer-settings'
import Asset from '../../helpers/Asset'
import Url from '../../helpers/Url'
import { unlessDefined } from '../../helpers/utils'
import Viewport from '../../helpers/Viewport'
import ReaderContext from '../../lib/reader-context'
import { useReaderLocationActions } from '../../store/readerLocationActions'
import { useReaderStore, useStore } from '../../store/StoreContext'
import type { AppDispatch, RootState } from '../../store/types'
import { useUserInterfaceActions } from '../../store/userInterfaceActions'
import { useViewActions } from '../../store/viewActions'
import Controls from '../Controls'
import Frame from '../Frame'
import Spinner from '../Spinner'
import { book, useLoader } from './loader'
import { useNavigation } from './navigation'
import { useResize } from './resize'
import type {
  ReaderApi,
  ReaderComponentProps,
  ReaderProps,
  ReaderState,
} from './types'

// Renders the current chapter's React element tree. Content is written to the
// module-level `book` object by loader.js and re-rendered when Reader state
// changes. See IMPROVEMENT_PLAN.md C4 for the known issue with this approach.
function BookContent() {
  return <div key="book-content">{book.content}</div>
}

// ─── Reader ──────────────────────────────────────────────────────────────────
//
// Main orchestrator component. Manages spine/chapter loading, page navigation,
// sidebar visibility, and resize handling.
//
// Local state is managed with useState; a setState shim preserves the
// class-style partial-merge and callback semantics the navigation/loader/resize
// logic relies on. That logic lives in three hooks — useLoader, useNavigation,
// useResize (TASK-100) — which read the live state/props refs and dispatch
// directly. Cross-cutting calls between them (the navigation ↔ loader cycle, and
// calls into Reader's own methods like freeze) resolve through `apiRef`, a ref
// to the assembled ReaderApi, replacing the former `this`-impersonating selfRef
// shim.
//
// Deprecated lifecycle methods were replaced:
//   UNSAFE_componentWillMount       → useEffect (empty deps, guarded)
//   componentDidMount               → useEffect (empty deps)
//   componentWillUnmount            → useEffect cleanup
//   UNSAFE_componentWillReceiveProps → two targeted useEffect hooks
//
// ReaderContext.Provider value is memoized (fixes IMPROVEMENT_PLAN H5).

function Reader(props: ReaderComponentProps) {
  // ─── Local state ───────────────────────────────────────────────────────────
  const [state, setReactState] = useState<ReaderState>({
    __metadata: [],
    __spine: [],
    __guide: [],

    opsURL: '',
    spine: [],
    guide: [],
    metadata: [],
    spineItemURL: '',
    currentSpineItem: null,
    currentSpineItemIndex: 0,
    cache: props.cache,

    // Navigation
    spreadIndex: 0,
    chapterDelta: 0,
    relativeSpreadPosition: 0.0,

    firstChapter: false,
    lastChapter: false,
    firstSpread: false,
    lastSpread: false,

    // Sidebar
    showSidebar: null,

    // Resize — disable resize events on touch devices to avoid spurious
    // triggering from the on-screen keyboard appearing/disappearing
    disableMobileResizeEvents: 'ontouchstart' in document.documentElement,
  })

  // readerSettings, readerLocation, view, and the userInterface / readerLocation
  // / view action bundles now come from the built-in store (TASK-106); only
  // viewerSettings is still connect()ed onto props. All are injected into the
  // props ref below so the external modules keep reading
  // `propsRef.current.view` / `.viewActions` etc. unchanged.
  const store = useReaderStore()
  const readerSettings = useStore((s) => s.readerSettings)
  const readerLocation = useStore((s) => s.readerLocation)
  const view = useStore((s) => s.view)
  const userInterfaceActions = useUserInterfaceActions()
  const readerLocationActions = useReaderLocationActions()
  const viewActions = useViewActions()

  // ─── Live refs ─────────────────────────────────────────────────────────────
  // Keep refs that always hold the latest state and props. The external modules
  // (navigation.js, loader.js, resize.js) read `this.state` and `this.props`
  // synchronously inside async callbacks, so they must always see current
  // values — a regular closure would capture a stale snapshot.
  const stateRef = useRef(state)
  stateRef.current = state

  const propsRef = useRef<ReaderProps>({
    ...props,
    readerSettings,
    readerLocation,
    view,
    userInterfaceActions,
    readerLocationActions,
    viewActions,
  })
  propsRef.current = {
    ...props,
    readerSettings,
    readerLocation,
    view,
    userInterfaceActions,
    readerLocationActions,
    viewActions,
  }

  // ─── setState shim ─────────────────────────────────────────────────────────
  // The external modules call `this.setState(partialState, callback)`.
  // This shim:
  //   1. Merges partial state (matching class setState's shallow-merge behavior)
  //   2. Keeps stateRef in sync so synchronous reads within the same call stack
  //      see the pending update rather than the previous render's snapshot
  //   3. Queues the callback to fire after the component re-renders with the
  //      new state (approximating class setState's callback timing)
  const pendingCallbacksRef = useRef<Array<() => void>>([])

  // Flush any queued setState callbacks after every render. By the time this
  // effect runs, the state update has been committed to the DOM.
  useEffect(() => {
    if (pendingCallbacksRef.current.length === 0) return
    const cbs = pendingCallbacksRef.current.splice(0)
    cbs.forEach((cb) => {
      cb?.()
    })
  })

  const setState = useCallback(
    (
      update: Partial<ReaderState> | ((prev: ReaderState) => ReaderState),
      callback?: () => void
    ) => {
      if (callback) pendingCallbacksRef.current.push(callback)
      setReactState((prev) => {
        const next =
          typeof update === 'function' ? update(prev) : { ...prev, ...update }
        // Sync stateRef immediately so that code reading `this.state`
        // synchronously after calling `this.setState` (within the same tick)
        // sees the intended next value
        stateRef.current = next
        return next
      })
    },
    []
  )

  // ─── Instance methods ──────────────────────────────────────────────────────
  // These were class instance methods. They are defined before the API is
  // assembled below so they can be included in it.

  const closeSidebars = useCallback(() => {
    setState({ showSidebar: null })
  }, [setState])

  const freeze = useCallback(() => {
    // Reset lastSpreadIndex so the backward-chapter effect doesn't navigate
    // to a stale last-spread while the new chapter is loading.
    // We do NOT call viewActions.unload() here: doing so would trigger
    // Ultimate's view.loaded effect and restart the stability watch on the
    // OLD chapter's Ultimate instance, which then fires onStable() ~200ms
    // later — hiding the spinner before the new chapter has loaded. The NEW
    // Ultimate instance (mounted when BookContent remounts after the fetch)
    // runs its own stability cycle and calls onStable() at the right time.
    propsRef.current.viewActions.updateLastSpreadIndex(-1)

    propsRef.current.userInterfaceActions.update({
      handleEvents: false,
      enableTransitions: false,
      spinnerVisible: true,
    })

    setState({ showSidebar: null })
  }, [setState])

  const handleSidebarButtonClick = useCallback(
    (value: string | null) => {
      setState((prev) => ({
        ...prev,
        showSidebar: value === prev.showSidebar ? null : value,
      }))
    },
    [setState]
  )

  const getTranslateX = useCallback((spreadIndex?: number) => {
    const nextSpreadIndex = unlessDefined(
      spreadIndex,
      stateRef.current.spreadIndex
    )

    const isScrolling = Viewport.isVerticallyScrolling(
      propsRef.current.readerSettings
    )

    let translateX = 0
    if (!isScrolling) {
      // Single source of truth for page width — must match Spread positioning
      // (see Viewport.getPageWidth) so figures don't drift off-screen.
      const pageWidth = Viewport.getPageWidth(propsRef.current.viewerSettings)
      translateX = pageWidth * nextSpreadIndex * -1

      // Avoid -0
      translateX =
        translateX === 0 && Math.sign(1 / translateX) === -1 ? 0 : translateX
    }

    return translateX
  }, [])

  const destroyReaderComponent = useCallback(() => {
    // TODO: the location.state.bookURL prop is how we signal to the reader that
    // there is a book loaded but the pathname is '/'. Would be good to standardize
    store.setState((s) => ({
      readerSettings: { ...s.readerSettings, bookURL: '' },
    }))
  }, [store])

  const getSlug = useCallback(() => {
    const { spine, currentSpineItemIndex } = stateRef.current

    if (
      isInteger(currentSpineItemIndex) &&
      spine?.[currentSpineItemIndex]?.slug
    ) {
      return spine[currentSpineItemIndex].slug
    }

    return ''
  }, [])

  // ─── ReaderApi ───────────────────────────────────────────────────────────────
  // The navigation/loader/resize logic lives in the three hooks below. Each
  // reads the live state/props refs and the setState shim directly, and resolves
  // cross-cutting calls through `apiRef` — a ref to the assembled ReaderApi.
  // This replaces the old `selfRef` (a `this` stand-in with state/props getters
  // and `.bind`). The cycle (navigation ↔ loader) is resolved by reading
  // `apiRef.current.<fn>` at call time rather than at hook-construction time.
  const apiRef = useRef<ReaderApi>({} as ReaderApi)

  const deps = { stateRef, propsRef, setState, api: apiRef }
  const loader = useLoader(deps)
  const navigation = useNavigation(deps)
  const resize = useResize(deps)

  // Assemble the API each render from the (stable) hook callbacks + Reader's own
  // methods. The function identities don't change between renders, so reads of
  // apiRef.current are always current.
  apiRef.current = {
    setState,
    closeSidebars,
    freeze,
    handleSidebarButtonClick,
    getTranslateX,
    destroyReaderComponent,
    getSlug,
    ...loader,
    ...navigation,
    ...resize,
  }

  // ─── Initialization ────────────────────────────────────────────────────────
  // Replaces UNSAFE_componentWillMount. Loads spine, guide, and metadata from
  // the OPF, then loads the chapter indicated by the current location params.
  //
  // Unlike UNSAFE_componentWillMount (which ran synchronously before the first
  // render), useEffect runs after the first render. To prevent the user from
  // interacting with an uninitialised reader during the OPF network fetch, we
  // show the spinner immediately at the start of this effect. This addresses
  // IMPROVEMENT_PLAN.md bug C5.
  //
  // The hasInitializedRef guard prevents double-invocation in React 18
  // Strict Mode, which mounts components twice in development.
  const hasInitializedRef = useRef(false)

  useEffect(() => {
    if (hasInitializedRef.current) return
    hasInitializedRef.current = true

    // Show the spinner immediately so the user sees a loading indicator
    // during the OPF/NCX network requests. The spinner will be hidden by
    // Ultimate.jsx once the layout has stabilised after the first chapter
    // loads (see Ultimate.jsx poll() → userInterfaceActions.update).
    propsRef.current.userInterfaceActions.update({
      spinnerVisible: true,
      handleEvents: false,
    })

    apiRef.current.createStateFromOPF(() => {
      const { spine } = stateRef.current
      const { readerSettings, readerLocation } = propsRef.current

      const params = new URLSearchParams(readerLocation.searchParams)
      const currentSpineItemIndex = Number(
        params.get(readerSettings.searchParamKeys.currentSpineItemIndex)
      )
      const currentSpineItem = spine[currentSpineItemIndex]
      const spreadIndex = 0

      if (currentSpineItem) {
        setState({ currentSpineItem, currentSpineItemIndex, spreadIndex }, () =>
          apiRef.current.loadSpineItem(currentSpineItem)
        )
        return
      }

      // Fallback: load the first page of the first chapter
      apiRef.current.loadSpineItem()
    })
  }, [])

  // ─── Resize handlers ───────────────────────────────────────────────────────
  // Replaces componentDidMount (bind) and componentWillUnmount (unbind).
  //
  // NOTE: bindResizeHandlers / unbindResizeHandlers names are inverted in the
  // source — see IMPROVEMENT_PLAN.md H4. Behavior is preserved here as-is to
  // avoid a behavioral change in this migration step.
  useEffect(() => {
    apiRef.current.unbindResizeHandlers() // actually adds listeners (see H4)

    return () => {
      apiRef.current.bindResizeHandlers() // actually removes listeners (see H4)

      const hash = Asset.createHash(propsRef.current.readerSettings.bookURL)
      Asset.removeBookStyles(hash)
    }
  }, [])

  // ─── React to location search param changes ────────────────────────────────
  // Replaces the searchParams branch of UNSAFE_componentWillReceiveProps.
  // When the Redux location changes:
  //   - If the slug changed, load the new spine item (chapter navigation)
  //   - Otherwise, update state to trigger the page transition
  //
  // DOUBLE-LOAD PREVENTION: When internal navigation occurs (handleChapterNavigation
  // → loadSpineItem → updateQueryString), the slug in the search params changes
  // AND the currentSpineItem in Reader state has already been updated to the new
  // chapter (handleChapterNavigation sets currentSpineItem before calling
  // loadSpineItem). We detect this case by comparing the incoming slug to
  // currentSpineItem.slug — if they match, the load is already in progress and
  // we skip calling loadSpineItem a second time.
  //
  // External navigation (browser back/forward, deep links) arrives with a slug
  // that does NOT match the current currentSpineItem.slug, so those still
  // trigger a load correctly.
  //
  // NOTE: The original class component had the same double-load pattern via
  // UNSAFE_componentWillReceiveProps. This fix removes that redundancy.
  const prevSearchParamsRef = useRef(readerLocation.searchParams)

  useEffect(() => {
    const prevSearchParams = prevSearchParamsRef.current
    const nextSearchParams = readerLocation.searchParams
    prevSearchParamsRef.current = nextSearchParams

    // Guard against re-running with the same value (e.g. React Strict Mode
    // double-invocation, or an unrelated Redux update)
    if (nextSearchParams === prevSearchParams) return

    const nextParams = Url.parseQueryString(nextSearchParams)
    const { searchParamKeys } = propsRef.current.readerSettings

    const slug = nextParams[searchParamKeys.slug]
    const currentSpineItemIndex = Number(
      nextParams[searchParamKeys.currentSpineItemIndex]
    )
    const spreadIndex = Number(nextParams[searchParamKeys.spreadIndex])

    const prevParams = Url.parseQueryString(prevSearchParams)
    const prevSlug = prevParams[searchParamKeys.slug]

    // Slug changed → determine whether the load was triggered internally
    // (by handleChapterNavigation / navigateToChapterByURL) or externally
    // (browser back/forward, deep link)
    if (prevSlug && slug && prevSlug !== slug) {
      // If the Reader's currentSpineItem already points to the new slug,
      // the load was triggered internally and loadSpineItem has already been
      // called. Skip the redundant second load.
      const alreadyLoading = stateRef.current.currentSpineItem?.slug === slug

      if (!alreadyLoading) {
        // External navigation: find the spine item and load it
        const spineItem = find(stateRef.current.spine, { slug })
        apiRef.current.loadSpineItem(spineItem)
      }

      return
    }

    // Same chapter, different spread → update navigation state, which will
    // trigger a transform update in Layout
    setState({ slug, currentSpineItemIndex, spreadIndex })
  }, [readerLocation.searchParams])

  // ─── React to view.loaded / lastSpreadIndex changes ────────────────────────
  // Replaces the view.loaded branch of UNSAFE_componentWillReceiveProps.
  // When a chapter finishes loading and the layout has stabilized (signalled by
  // Ultimate dispatching view.load()), navigate to the last spread if we
  // arrived here via backwards chapter navigation.
  useEffect(() => {
    if (view.loaded && view.lastSpreadIndex > -1) {
      if (stateRef.current.chapterDelta < 0) {
        setState({ chapterDelta: 0 }, () =>
          apiRef.current.navigateToSpreadByIndex(
            propsRef.current.view.lastSpreadIndex
          )
        )
      }
    }
  }, [view.loaded, view.lastSpreadIndex])

  // ─── Context value ─────────────────────────────────────────────────────────
  // Previously an object literal in JSX (recreated on every render, causing all
  // context consumers to re-render unnecessarily). Now memoized so consumers
  // only re-render when spreadIndex, lastSpread, or the stable callbacks change.
  // Fixes IMPROVEMENT_PLAN.md H5.
  const readerContextValue = useMemo(
    () => ({
      lastSpread: state.lastSpread,
      spreadIndex: state.spreadIndex,
      getTranslateX,
      navigateToChapterByURL: apiRef.current.navigateToChapterByURL,
      getSpineItemByAbsoluteUrl: apiRef.current.getSpineItemByAbsoluteUrl,
    }),
    [state.lastSpread, state.spreadIndex, getTranslateX]
  )

  // ─── Render ────────────────────────────────────────────────────────────────
  const { downloads, uiOptions, layout, style, className } = props

  const {
    metadata,
    guide,
    spine,
    currentSpineItemIndex,
    showSidebar,
    // lastSpread,
    spreadIndex,
    spineItemURL,
  } = state

  const slug = getSlug()

  return (
    <Controls
      guide={guide}
      spine={spine}
      currentSpineItemIndex={currentSpineItemIndex}
      metadata={metadata}
      showSidebar={showSidebar}
      spreadIndex={spreadIndex}
      lastSpreadIndex={view.lastSpreadIndex}
      handlePageNavigation={apiRef.current.handlePageNavigation}
      destroyReaderComponent={destroyReaderComponent}
      handleChapterNavigation={apiRef.current.handleChapterNavigation}
      handleSidebarButtonClick={handleSidebarButtonClick}
      navigateToChapterByURL={apiRef.current.navigateToChapterByURL}
      downloads={downloads}
      uiOptions={uiOptions}
      layout={layout}
    >
      <ReaderContext.Provider value={readerContextValue}>
        <Frame
          slug={slug}
          spreadIndex={spreadIndex}
          lastSpreadIndex={view.lastSpreadIndex}
          BookContent={BookContent}
          layout={layout}
          // Can't wrap Layout or the withLastSpreadIndex HOC in a way that
          // preserves refs, so pass `view` down as props
          view={view}
          style={style}
          className={className}
          spineItemURL={spineItemURL}
        />
        <Spinner />
      </ReaderContext.Provider>
    </Controls>
  )
}

const mapStateToProps = ({ viewerSettings }: RootState) => ({
  viewerSettings,
})

// Bound action bundles. bindActionCreators yields precise per-creator types
// that don't line up with the loose bundle props on ReaderProps; cast each to
// the loose shape so connect's prop inference matches. Behavior unchanged.
type ReaderDispatchProps = Pick<ReaderProps, 'viewerSettingsActions'>

const mapDispatchToProps = (dispatch: AppDispatch): ReaderDispatchProps => ({
  viewerSettingsActions: bindActionCreators(
    viewerSettingsActions,
    dispatch
  ) as unknown as ReaderProps['viewerSettingsActions'],
})

export default connect(mapStateToProps, mapDispatchToProps)(Reader)
