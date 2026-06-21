import classNames from 'classnames'
import debounce from 'lodash/debounce'
import React, { useContext, useEffect, useState } from 'react'
import {
  breakpoints,
  MEDIA_QUERY_MOBILE,
  RESIZE_DEBOUNCE_TIMER,
} from '../constants'
import Viewport from '../helpers/Viewport'
import browser from '../lib/browser'
import ReaderApiContext from '../lib/reader-api-context'
import transitions from '../lib/transition-styles'
import withLastSpreadIndex from '../lib/with-last-spread-index'
import { useStore } from '../store/StoreContext'

// Local layout state (CSS box/transform values managed via useState).
interface LayoutState {
  margin: number
  border: number
  boxSizing: string
  transform: string
  columnFill: string
}

function getLayoutStyles(props: any, state: LayoutState): React.CSSProperties {
  const {
    width,
    height,
    columns,
    columnGap,
    paddingTop,
    paddingLeft,
    paddingRight,
    paddingBottom,
    fontSize,
  } = props.viewerSettings

  const { margin, border, boxSizing, columnFill, transform } = state
  const { layout } = props

  // Override padding top/bottom if the project has been configured
  // to scroll vertically, since the padding from the media queries
  // is no longer appropriate
  let nextPaddingTop = paddingTop
  let nextPaddingBottom = paddingBottom

  if (Viewport.isVerticalScrollConfigured(layout)) {
    // Get padding from mobile entry in breakpoint map. The mobile breakpoint is
    // always present in the map, so the lookup is non-null in practice.
    const breakpoint = breakpoints.get(MEDIA_QUERY_MOBILE)!

    nextPaddingTop = breakpoint.paddingTop
    nextPaddingBottom = breakpoint.paddingBottom
  }

  // Values originate from viewerSettings/breakpoints and are wider (string |
  // number) than the CSSProperties literal unions; cast since they are valid
  // CSS at runtime.
  return {
    width,
    height,
    columnGap,
    paddingTop: nextPaddingTop,
    paddingLeft,
    paddingRight,
    paddingBottom: nextPaddingBottom,
    margin,
    border,
    boxSizing,
    columns,
    columnFill,
    transform,
    fontSize,
  } as React.CSSProperties
}

function getLeafStyles(
  position: 'left' | 'right',
  translateX: number
): React.CSSProperties {
  // Overlay styles for hiding content in the 'padding' range. FF animations
  // 'jump' when animating a transform, so we use 'left' and 'right'
  // properties in that case. in either case, need to move the leaves in the
  // opposite direction as the containing element

  let styles: React.CSSProperties = {}
  let nextTranslateX = translateX

  if ((browser as { name?: string } | null)?.name === 'firefox') {
    if (position === 'left') {
      nextTranslateX *= -1
    }

    styles = {
      [position]: `${nextTranslateX}px`,
    }
  } else {
    nextTranslateX *= -1

    const transform = `translateX(${nextTranslateX}px) translate3d(0, 0, 0)`

    styles = {
      transform,
    }
  }

  return styles
}

interface LeavesProps {
  layout: string
  paddingLeft: number
  paddingRight: number
  enableTransitions: boolean
  translateX: number
  // transitionSpeed is unused by Leaves/getLeafStyles but kept in the prop
  // surface to match the call site (Layout passes it through unconditionally).
  transitionSpeed: number
}

function Leaves({
  layout,
  paddingLeft,
  paddingRight,
  enableTransitions,
  translateX,
}: LeavesProps) {
  // Disable transition animation by default. Enabling transition requires
  // user action, e.g. clicking 'next'
  if (Viewport.isVerticallyScrolling({ layout })) return null

  return (
    <>
      <div
        className="bber-leaf bber-leaf--left"
        style={{
          width: paddingLeft,
          ...getLeafStyles('left', translateX),
          ...(enableTransitions ? {} : { transition: 'none' }),
        }}
      />
      <div
        className="bber-leaf bber-leaf--right"
        style={{
          width: paddingRight,
          ...getLeafStyles('right', translateX),
          ...(enableTransitions ? {} : { transition: 'none' }),
        }}
      />
    </>
  )
}

// Layout receives connect()ed userInterface plus measurement helpers and
// viewerSettings threaded through the withLastSpreadIndex HOC (which calls
// useDimensions internally); typed loosely pending that HOC's injected-prop
// surface being finalized.
function Layout(props: any) {
  const readerApi = useContext(ReaderApiContext)

  const [state, setState] = useState<LayoutState>({
    margin: 0,
    border: 0,
    boxSizing: 'border-box',
    transform: 'translateX(0) translate3d(0, 0, 0)',
    columnFill: 'auto',
  })

  const height = props.getFrameHeight()
  const { spreadIndex, slug, layout } = props
  const { enableTransitions } = useStore((s) => s.userInterface)
  const { transition, transitionSpeed, paddingLeft, paddingRight } =
    props.viewerSettings
  const translateX = readerApi.getTranslateX()

  const updateTransform = (nextSpreadIndex?: number) => {
    const nextTranslateX = readerApi.getTranslateX(nextSpreadIndex)
    const transform = `translateX(${nextTranslateX}px) translate3d(0, 0, 0)`

    setState((prevState) => ({ ...prevState, transform }))
  }

  const onResizeDone = () => {
    props.updateDimensions()
    updateTransform()
  }

  const handleResize = debounce(onResizeDone, RESIZE_DEBOUNCE_TIMER, {})

  useEffect(() => {
    props.updateDimensions()
    updateTransform()
    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    updateTransform(props.spreadIndex)
  }, [props.spreadIndex])

  return (
    <div
      id="layout"
      className={classNames(`spread-index__${spreadIndex}`, slug, {
        context__scroll: Viewport.isVerticallyScrolling({ layout }),
        context__desktop: Viewport.isMediaQueryDesktop(),
        context__mobile: !Viewport.isMediaQueryDesktop(),
      })}
      style={{
        ...getLayoutStyles(props, state),
        ...transitions({ transitionSpeed })[transition],
        ...(enableTransitions ? {} : { transition: 'none' }),
      }}
    >
      <div
        id="content"
        ref={props.innerRef}
        style={{
          margin: 0,
          padding: 0,
          minHeight: height,
        }}
      >
        {/* BookContent self-keys on spineItemURL from the store (TASK-106). */}
        <props.BookContent />
      </div>

      <Leaves
        layout={layout}
        paddingLeft={paddingLeft}
        paddingRight={paddingRight}
        enableTransitions={enableTransitions}
        translateX={translateX}
        transitionSpeed={transitionSpeed}
      />
    </div>
  )
}

// userInterface is read from the built-in store inside Layout (TASK-106), so
// the former userInterface connect wrapper is gone; withLastSpreadIndex keeps
// its own connect for viewActions.
export default withLastSpreadIndex(Layout)
