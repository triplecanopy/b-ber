import debounce from 'lodash/debounce'
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import ResizeObserver from 'resize-observer-polyfill'
import { unlessDefined } from '../helpers/utils'
import Viewport from '../helpers/Viewport'
import DocumentPreProcessor from '../lib/DocumentPreProcessor'
import ReaderApiContext from '../lib/reader-api-context'
import { useStore } from '../store/StoreContext'
import type {
  ReaderSettingsState,
  RootState,
  ViewerSettingsState,
  ViewState,
} from '../store/types'

interface UseNodePositionOptions {
  // Should the calculations for the spread position be based on the element the
  // ref is attached to, or the ref's parent container. Default false.
  useParentDimensions?: boolean
  // Should calculations use the element's `offsetLeft` (true) or
  // `getBoundingClientRect` (false). Default true.
  useElementOffsetLeft?: boolean
  // Should calculations be based on an element outside the normal column flow,
  // e.g. a fullscreen element.
  useFullscreenElementWidth?: boolean
  // Whether the consumer is a Marker (drives stylesheet regeneration).
  isMarker?: boolean
}

interface UseNodePositionResult<T extends HTMLElement = HTMLElement> {
  elemRef: React.RefObject<T | null>
  verso: boolean | null
  recto: boolean | null
  spreadIndex: number | null
  elementEdgeLeft: number | null
  // Redux slices the withNodePosition HOC's connect() used to inject; returned
  // here so consumers that read them (Vimeo, Iframe) still can (§4.1).
  view: ViewState
  viewerSettings: ViewerSettingsState
  readerSettings: ReaderSettingsState
}

interface NodePositionState {
  verso: boolean | null
  recto: boolean | null
  spreadIndex: number | null
  elementEdgeLeft: number | null
}

const ELEMENT_EDGE_VERSO_MIN = 48
const ELEMENT_EDGE_VERSO_MAX = 52
const ELEMENT_EDGE_RECTO_MIN = 0
const ELEMENT_EDGE_RECTO_MAX = 5

const elementEdgeIsInAllowableRange = (edgePositionVariance: number): boolean =>
  (edgePositionVariance >= ELEMENT_EDGE_VERSO_MIN &&
    edgePositionVariance <= ELEMENT_EDGE_VERSO_MAX) ||
  (edgePositionVariance >= ELEMENT_EDGE_RECTO_MIN &&
    edgePositionVariance <= ELEMENT_EDGE_RECTO_MAX)

// Replaces with-node-position. Determines whether the attached node sits in the
// verso or recto position and which spread it appears on, then exposes that via
// state. The generic `T` types the ref to the element the consumer attaches it
// to (a span for Marker, a media element for Media, a div for Vimeo/Iframe).
const useNodePosition = <T extends HTMLElement = HTMLElement>(
  options: UseNodePositionOptions = {}
): UseNodePositionResult<T> => {
  const readerApi = useContext(ReaderApiContext)
  const viewerSettings = useStore((s) => s.viewerSettings)
  const view = useStore((s) => s.view)
  const readerSettings = useStore((s) => s.readerSettings)

  const elemRef = useRef<T>(null)

  const [state, setState] = useState<NodePositionState>({
    verso: null,
    recto: null,
    spreadIndex: null,
    elementEdgeLeft: null,
  })

  const settings = useMemo(
    () => ({
      useParentDimensions: unlessDefined(options.useParentDimensions, false),
      useElementOffsetLeft: unlessDefined(options.useElementOffsetLeft, true),
      useFullscreenElementWidth: unlessDefined(
        options.useFullscreenElementWidth,
        false
      ),
      isMarker: unlessDefined(options.isMarker, false),
    }),
    [
      options.useParentDimensions,
      options.useElementOffsetLeft,
      options.useFullscreenElementWidth,
      options.isMarker,
    ]
  )

  // The class read this.props / this.context / this.settings live inside its
  // calculation methods (which run from a ResizeObserver callback and a
  // debounced handler set up once at mount). Mirror that with always-current
  // refs so the stable callbacks below never close over stale values.
  const settingsRef = useRef(settings)
  settingsRef.current = settings
  const viewerSettingsRef = useRef(viewerSettings)
  viewerSettingsRef.current = viewerSettings
  const viewRef = useRef(view)
  viewRef.current = view
  const getTranslateXRef = useRef(readerApi.getTranslateX)
  getTranslateXRef.current = readerApi.getTranslateX

  const getRef = useCallback((): HTMLElement | null => {
    if (settingsRef.current.useParentDimensions) {
      return elemRef.current?.parentElement ?? null
    }
    return elemRef.current
  }, [])

  // Determine if the element is verso or recto and calculate the index of the
  // spread that it appears on.
  const calculateUsingOffsetLeft = useCallback(() => {
    const node = getRef()
    if (!node) return console.error('Element does not exist')

    const { isMarker } = settingsRef.current
    const { width, paddingLeft, paddingRight, columnGap } =
      viewerSettingsRef.current

    // Get the offset of the node's (the marker's) parent's (span's) parent
    // (element in the document that it's been inserted into). The grandparent
    // is assumed to exist in the live DOM; cast to satisfy getComputedStyle.
    const computedParentStyle = window.getComputedStyle(
      node.parentElement?.parentElement as Element
    )

    const marginLeft = computedParentStyle.marginLeft
    const elementPaddingLeft = computedParentStyle.paddingLeft

    // Get the left edge of the element, taking into account padding and margins
    const elementEdgeLeft =
      node.offsetLeft - parseFloat(marginLeft) - parseFloat(elementPaddingLeft)

    // Width of a single column
    const columnWidth = (window.innerWidth - paddingLeft * 2 - columnGap) / 2

    // Width of the visible portion of the layout. Shared geometry source with
    // Spread positioning and the page-turn transform (TASK-084).
    const innerFrameWidth = Viewport.getPageWidth({
      width,
      paddingLeft,
      paddingRight,
      columnGap,
    })

    // Calculate for the left edge of the element as if it were in the recto
    // position
    let elementEdgeLeftInRecto = elementEdgeLeft - columnGap - columnWidth

    // Subtract the left padding of the frame only if the element being queried
    // is "inline", i.e., inside a normal column of flowing text
    if (node.offsetWidth !== window.innerWidth) {
      elementEdgeLeftInRecto -= paddingLeft
    }

    // Calculate the position (verso or recto) of the element by dividing by the
    // visible frame. A remainder means the position is verso.
    const edgePosition = Math.abs(elementEdgeLeftInRecto / innerFrameWidth)

    // Decimal value of the recto unit over the visible frame, rounded to two,
    // to account for tiny variants in the actual position of the element's left
    // edge and determine if it's moving (mid-transition) or within allowable
    // range of the recto or verso ranges.
    const edgePositionVariance = Number(
      (edgePosition % 1).toFixed(2).substring(2)
    )

    const verso =
      edgePositionVariance >= ELEMENT_EDGE_VERSO_MIN &&
      edgePositionVariance <= ELEMENT_EDGE_VERSO_MAX
    const recto =
      edgePositionVariance >= ELEMENT_EDGE_RECTO_MIN &&
      edgePositionVariance <= ELEMENT_EDGE_RECTO_MAX

    // TODO return range? i.e., { spreadStart: 0, spreadEnd: 1 } Returning a
    // rounded number means that the index will never be 0
    const spreadIndex = Math.floor(Number(edgePosition.toFixed(2)))

    // If the marker's edge isn't within the allowable range (during a
    // transition or resize), nudge display to force a reflow.
    if (
      elementEdgeIsInAllowableRange(edgePositionVariance) === false ||
      (verso === false && recto === false)
    ) {
      node.style.display = 'none'
      node.style.display = 'block'
    }

    setState({ verso, recto, spreadIndex, elementEdgeLeft })

    // TODO Marker component specific code needs to be handled better here
    if (isMarker) {
      DocumentPreProcessor.removeStyleSheets()
      DocumentPreProcessor.createStyleSheets()
      DocumentPreProcessor.appendStyleSheets()
    }
  }, [getRef])

  // Calculate the position of the attached node (or its parent) in relation to
  // the last node in the chapter. Used when calculations can't be done with
  // offsetLeft because the element is absolutely positioned.
  const calculateUsingBoundingClientRect = useCallback(() => {
    const node = getRef()
    if (!node) return console.error('Element does not exist')

    const { ultimateOffsetLeft } = viewRef.current
    const { width, paddingLeft, paddingRight, columnGap } =
      viewerSettingsRef.current

    // Account for the transform applied to the layout element
    const transformLeft = Math.abs(getTranslateXRef.current())
    const elementEdgeLeft = node.getBoundingClientRect().x + transformLeft

    const innerFrameWidth = Viewport.getPageWidth({
      width,
      paddingLeft,
      paddingRight,
      columnGap,
    })

    let elementSpreadIndex =
      ultimateOffsetLeft / innerFrameWidth -
      (ultimateOffsetLeft - elementEdgeLeft) / innerFrameWidth

    elementSpreadIndex = Math.round(elementSpreadIndex)

    setState((prev) => ({
      ...prev,
      verso: true,
      recto: false,
      spreadIndex: elementSpreadIndex,
    }))
  }, [getRef])

  // componentDidMount (offsetLeft path): debounce the calculation and observe
  // the node for resizes; componentWillUnmount disconnected the observer.
  useEffect(() => {
    if (!settings.useElementOffsetLeft) return

    const node = getRef()
    if (!node) {
      console.error('No element to conenct to ResizeObserver')
      return
    }

    const calculateAfterResize = debounce(calculateUsingOffsetLeft, 0, {
      leading: false,
      trailing: true,
    })
    const resizeObserver = new ResizeObserver(calculateAfterResize)
    resizeObserver.observe(node)

    return () => resizeObserver.disconnect()
  }, [settings.useElementOffsetLeft, getRef, calculateUsingOffsetLeft])

  // componentDidMount + UNSAFE_componentWillReceiveProps (bounding-client-rect
  // path): the class recalculated whenever the ultimate node's offset changed.
  // Key the effect on that value so it runs on mount and on each change (§3 —
  // componentWillReceiveProps computing from a prop → useEffect([prop])).
  useEffect(() => {
    if (settings.useElementOffsetLeft) return
    calculateUsingBoundingClientRect()
  }, [
    settings.useElementOffsetLeft,
    view.ultimateOffsetLeft,
    calculateUsingBoundingClientRect,
  ])

  return {
    elemRef,
    verso: state.verso,
    recto: state.recto,
    spreadIndex: state.spreadIndex,
    elementEdgeLeft: state.elementEdgeLeft,
    view,
    viewerSettings,
    readerSettings,
  }
}

export default useNodePosition
