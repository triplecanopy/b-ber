import { useCallback, useLayoutEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { bindActionCreators } from 'redux'
import * as viewerSettingsActions from '../actions/viewer-settings'
import { columns } from '../constants'
import { isNumeric } from '../helpers/Types'
import Viewport from '../helpers/Viewport'
import type {
  AppDispatch,
  RootState,
  ViewerSettingsState,
} from '../store/types'

const getWidth = (scrollingLayout: boolean): number => {
  // Column layout, return the window width
  if (!scrollingLayout) return window.innerWidth

  // Scrolling layout, but not a mobile device, return the window width
  if (/mobi/i.test(window.navigator.userAgent) === false) {
    return window.innerWidth
  }

  // Get the device orientation and return either the screen height or width
  const { matches: landscapeOrientation } = window.matchMedia(
    '(orientation: landscape)'
  )

  return landscapeOrientation ? window.screen.height : window.screen.width
}

interface UseDimensionsResult {
  viewerSettings: ViewerSettingsState
  viewerSettingsActions: {
    update: (payload: Partial<ViewerSettingsState>) => void
  }
  getFrameHeight: () => number | 'auto'
  getFrameWidth: () => number
  getSingleColumnWidth: () => number
  updateDimensions: () => void
}

// Replaces with-dimensions: measures the viewport and dispatches
// viewerSettings (width/height/columns), and exposes frame-measurement
// helpers derived from the current viewerSettings.
const useDimensions = (layout: string): UseDimensionsResult => {
  const dispatch = useDispatch<AppDispatch>()

  const viewerSettingsActionsBundle = useMemo(
    () => bindActionCreators(viewerSettingsActions, dispatch),
    [dispatch]
  )

  const updateDimensions = useCallback(() => {
    const scrollingLayout = Viewport.isVerticallyScrolling({ layout })
    const width = getWidth(scrollingLayout)
    // The scroll layout stores 'auto' for height (consumers branch on
    // isNumeric); the store types height as number, so cast to preserve it.
    const height = (scrollingLayout
      ? 'auto'
      : window.innerHeight) as unknown as number
    const nextColumns = scrollingLayout ? columns.ONE : columns.TWO

    viewerSettingsActionsBundle.update({
      width,
      height,
      columns: nextColumns,
    })
  }, [layout, viewerSettingsActionsBundle])

  // UNSAFE_componentWillMount called updateDimensions() before the first
  // render, so the first paint already reflected the real viewport rather
  // than viewerSettings' zero-value defaults. Dispatching synchronously
  // during render isn't safe (React rejects updates to other connected
  // components while this one is rendering), and a plain useEffect runs
  // after paint and would flash those defaults for one frame. useLayoutEffect
  // runs synchronously after the first commit but before the browser paints,
  // so the resulting re-render with real dimensions replaces the default
  // values before anything is shown.
  useLayoutEffect(() => {
    updateDimensions()
    // biome-ignore lint/correctness/useExhaustiveDependencies: mirror
    // UNSAFE_componentWillMount — run the initial measurement once.
  }, [])

  const viewerSettings = useSelector((state: RootState) => state.viewerSettings)

  const getFrameHeight = useCallback((): number | 'auto' => {
    if (Viewport.isVerticallyScrolling({ layout })) return 'auto'

    let { height } = viewerSettings
    const { paddingTop, paddingBottom } = viewerSettings

    // make sure we're not treating 'auto' as a number
    if (!isNumeric(height)) height = window.innerHeight

    height -= paddingTop
    height -= paddingBottom

    return height
  }, [layout, viewerSettings])

  const getFrameWidth = useCallback((): number => {
    const { width, paddingLeft, paddingRight, columnGap } = viewerSettings
    return width - paddingLeft - paddingRight - columnGap
  }, [viewerSettings])

  const getSingleColumnWidth = useCallback(
    (): number => getFrameWidth() / 2,
    [getFrameWidth]
  )

  return {
    viewerSettings,
    viewerSettingsActions: viewerSettingsActionsBundle,
    getFrameHeight,
    getFrameWidth,
    getSingleColumnWidth,
    updateDimensions,
  }
}

export default useDimensions
