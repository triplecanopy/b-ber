import React, { useEffect, useRef } from 'react'
import isPlainObject from 'lodash/isPlainObject'
import { connect } from 'react-redux'
import classNames from 'classnames'
import Layout from './Layout'
import Viewport from '../helpers/Viewport'
import Asset from '../helpers/Asset'

function Frame(props) {
  const node = useRef(null)

  useEffect(() => {
    if (!Viewport.isSingleColumn() || !node?.current) return

    node.current.scrollTo(0, 0)
  }, [props.view.loaded])

  return (
    <div
      id="frame"
      ref={node}
      className={classNames(
        `_${Asset.createHash(props.readerSettings.bookURL)}`,
        props.className || ''
      )}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        margin: 0,
        padding: 0,
        border: 0,
        ...(Viewport.isVerticallyScrolling(props)
          ? {
              WebkitOverflowScrolling: 'touch',
              overflowY: 'auto',
              overflowX: 'hidden',
            }
          : { overflow: 'hidden' }),
        ...(isPlainObject(props.style) ? props.style : {}),
      }}
    >
      <Layout
        BookContent={props.BookContent}
        className={props.className}
        lastSpreadIndex={props.lastSpreadIndex}
        layout={props.layout}
        readerSettings={props.readerSettings}
        slug={props.slug}
        spreadIndex={props.spreadIndex}
        style={props.style}
        view={props.view}
        viewerSettings={props.viewerSettings}
      />
    </div>
  )
}

export default connect(
  ({ readerSettings, viewerSettings }) => ({ readerSettings, viewerSettings }),
  () => ({})
)(Frame)
