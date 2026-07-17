import classNames from 'classnames'
import isPlainObject from 'lodash/isPlainObject'
import React, { useEffect, useRef } from 'react'
import * as Asset from '../helpers/Asset'
import Viewport from '../helpers/Viewport'
import { useStore } from '../store/StoreContext'
import ErrorBoundary from './ErrorBoundary'
import Layout from './Layout'

// Frame reads readerSettings + viewerSettings from the built-in store
// (TASK-106) plus a passthrough bag of layout props from Reader. Typed loosely
// pending the Reader prop surface being finalized.
function Frame(props: any) {
  const readerSettings = useStore((s) => s.readerSettings)
  const viewerSettings = useStore((s) => s.viewerSettings)
  const node = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!Viewport.isSingleColumn() || !node?.current) return

    node.current.scrollTo(0, 0)
  }, [props.slug])

  return (
    <div
      id="frame"
      ref={node}
      className={classNames(
        `_${Asset.createHash(readerSettings.bookURL)}`,
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
      {/* Layout renders BookContent (the book's own HTML/JS), which is outside
          this app's control — an ErrorBoundary here keeps a crash in book
          content (or anywhere else in the Layout tree) from blanking the
          entire reader. */}
      <ErrorBoundary>
        <Layout
          BookContent={props.BookContent}
          className={props.className}
          lastSpreadIndex={props.lastSpreadIndex}
          layout={props.layout}
          readerSettings={readerSettings}
          slug={props.slug}
          spreadIndex={props.spreadIndex}
          style={props.style}
          view={props.view}
          viewerSettings={viewerSettings}
        />
      </ErrorBoundary>
    </div>
  )
}

export default Frame
