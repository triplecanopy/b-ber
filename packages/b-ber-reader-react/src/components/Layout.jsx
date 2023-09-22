/* eslint-disable camelcase */

import React, { useContext, useEffect, useState } from 'react'
import debounce from 'lodash/debounce'
import { connect } from 'react-redux'
import classNames from 'classnames'
import transitions from '../lib/transition-styles'
import Viewport from '../helpers/Viewport'
import browser from '../lib/browser'
import withLastSpreadIndex from '../lib/with-last-spread-index'
import withDimensions from '../lib/with-dimensions'
import ReaderContext from '../lib/reader-context'
import {
  breakpoints,
  RESIZE_DEBOUNCE_TIMER,
  MEDIA_QUERY_MOBILE,
} from '../constants'

function getLayoutStyles(props, state) {
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
    // Get padding from mobile entry in breakpoint map
    const breakpoint = breakpoints.get(MEDIA_QUERY_MOBILE)

    nextPaddingTop = breakpoint.paddingTop
    nextPaddingBottom = breakpoint.paddingBottom
  }

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
  }
}

function getLeafStyles(
  position /* <left|right> */,
  translateX,
  transitionSpeed
) {
  // Overlay styles for hiding content in the 'padding' range. FF animations
  // 'jump' when animating a transform, so we use 'left' and 'right'
  // properties in that case. in either case, need to move the leaves in the
  // opposite direction as the containing element

  // const { transitionSpeed } = this.props.viewerSettings

  let styles = {}
  let nextTranslateX = translateX
  // let positionX = 0

  // let translateX = this.context.getTranslateX()

  if (browser.name === 'firefox') {
    if (position === 'left') nextTranslateX *= -1
    styles = {
      [position]: `${nextTranslateX}px`,
      transition: `${position} ${transitionSpeed}ms ease 0s`,
    }
  } else {
    nextTranslateX *= -1
    const transform = `translateX(${nextTranslateX}px) translate3d(0, 0, 0)`
    styles = {
      transform,
      transition: `transform ${transitionSpeed}ms ease 0s`,
    }
  }

  return styles
}

function Leaves({
  layout,
  paddingLeft,
  paddingRight,
  enableTransitions,
  translateX,
  transitionSpeed,
}) {
  // Disable transition animation by default. Enabling transition requires
  // user action, e.g. clicking 'next'
  if (Viewport.isVerticallyScrolling({ layout })) return null

  return (
    <>
      <div
        className="bber-leaf bber-leaf--left"
        style={{
          width: paddingLeft,
          ...getLeafStyles('left', translateX, transitionSpeed),
          ...(enableTransitions ? {} : { transition: 'none' }),
        }}
      />
      <div
        className="bber-leaf bber-leaf--right"
        style={{
          width: paddingRight,
          ...getLeafStyles('right', translateX, transitionSpeed),
          ...(enableTransitions ? {} : { transition: 'none' }),
        }}
      />
    </>
  )
}

function Layout(props) {
  const readerContext = useContext(ReaderContext)

  const [state, setState] = useState({
    margin: 0,
    border: 0,
    boxSizing: 'border-box',
    transform: 'translateX(0) translate3d(0, 0, 0)',
    columnFill: 'auto',
  })

  const height = props.getFrameHeight()
  const { spreadIndex, slug, layout } = props
  const { enableTransitions } = props.userInterface
  const {
    transition,
    transitionSpeed,
    paddingLeft,
    paddingRight,
  } = props.viewerSettings
  const translateX = readerContext.getTranslateX()

  const updateTransform = nextSpreadIndex => {
    const nextTranslateX = readerContext.getTranslateX(nextSpreadIndex)
    const transform = `translateX(${nextTranslateX}px) translate3d(0, 0, 0)`

    setState(prevState => ({ ...prevState, transform }))
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

export default connect(
  ({ userInterface }) => ({ userInterface }),
  () => ({})
)(withDimensions(withLastSpreadIndex(Layout)))
