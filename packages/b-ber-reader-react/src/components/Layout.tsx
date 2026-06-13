import classNames from 'classnames'
import debounce from 'lodash/debounce'
import React, { useContext, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import {
  breakpoints,
  MEDIA_QUERY_MOBILE,
  RESIZE_DEBOUNCE_TIMER,
} from '../constants'
import Viewport from '../helpers/Viewport'
import browser from '../lib/browser'
import ReaderContext from '../lib/reader-context'
import transitions from '../lib/transition-styles'
import withDimensions from '../lib/with-dimensions'
import withLastSpreadIndex from '../lib/with-last-spread-index'
import type { RootState } from '../store/types'

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
  // transitionSpeed
): React.CSSProperties {
  // Overlay styles for hiding content in the 'padding' range. FF animations
  // 'jump' when animating a transform, so we use 'left' and 'right'
  // properties in that case. in either case, need to move the leaves in the
  // opposite direction as the containing element

  // const { transitionSpeed } = this.props.viewerSettings

  let styles: React.CSSProperties = {}
  let nextTranslateX = translateX
  // let positionX = 0

  // let translateX = this.context.getTranslateX()

  if ((browser as { name?: string } | null)?.name === 'firefox') {
    if (position === 'left') {
      nextTranslateX *= -1
    }

    styles = {
      [position]: `${nextTranslateX}px`,
      // transition: `${position} ${transitionSpeed}ms ease 0s`,
    }
  } else {
    nextTranslateX *= -1

    const transform = `translateX(${nextTranslateX}px) translate3d(0, 0, 0)`

    styles = {
      transform,
      // transition: `transform ${transitionSpeed}ms ease 0s`,
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
  // transitionSpeed is currently unused by getLeafStyles (the transition lines
  // are commented out) but kept in the prop surface to match the call site.
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
// viewerSettings threaded through the withDimensions/withLastSpreadIndex HOCs;
// typed loosely pending those HOCs' injected-prop surfaces being finalized.
function Layout(props: any) {
  const readerContext = useContext(ReaderContext)

  const [state, setState] = useState<LayoutState>({
    margin: 0,
    border: 0,
    boxSizing: 'border-box',
    transform: 'translateX(0) translate3d(0, 0, 0)',
    columnFill: 'auto',
  })

  const height = props.getFrameHeight()
  const { spreadIndex, slug, layout } = props
  const { enableTransitions } = props.userInterface
  const { transition, transitionSpeed, paddingLeft, paddingRight } =
    props.viewerSettings
  const translateX = readerContext.getTranslateX()

  const updateTransform = (nextSpreadIndex?: number) => {
    const nextTranslateX = readerContext.getTranslateX(nextSpreadIndex)
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
        <props.BookContent key={props.spineItemURL} />
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

export default connect(
  ({ userInterface }: RootState) => ({ userInterface }),
  () => ({})
)(withDimensions(withLastSpreadIndex(Layout)))
