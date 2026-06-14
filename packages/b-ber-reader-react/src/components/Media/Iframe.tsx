import React, { useEffect } from 'react'
import { isBrowser } from '../../helpers/utils'
import Viewport from '../../helpers/Viewport'
import useIframePosition from '../../hooks/use-iframe-position'
import useNodePosition from '../../hooks/use-node-position'

// Enable absolutely positioned iframe layout for specific browsers/versions
const iframePositioningEnabled = isBrowser('chrome', 'eq', 81)

interface IframeAttrs {
  src?: string
  title?: string
  width?: string | number
  height?: string | number
  [key: string]: any
}

interface IframeProps {
  attrs: IframeAttrs
  // Per-instance override for the node-position calc (set by process-nodes for
  // spread-nested embeds); forwarded to useNodePosition.
  useElementOffsetLeft?: boolean
  layout?: string
  [key: string]: any
}

function Iframe(props: IframeProps) {
  const { attrs } = props

  const {
    iframePlaceholderTop,
    iframePlaceholderWidth,
    iframeStyleBlock,
    innerRef,
  } = useIframePosition({
    enabled: iframePositioningEnabled,
    layout: props.layout,
  })

  const node = useNodePosition<HTMLDivElement>({
    useElementOffsetLeft: props.useElementOffsetLeft,
  })

  // Prevent iframe from stealing focus
  useEffect(() => {
    const focusWindow = () => setTimeout(() => window.focus(), 60)

    window.addEventListener('blur', focusWindow)
    return () => window.removeEventListener('blur', focusWindow)
  }, [])

  const { src, title, width, height } = attrs

  let iframeContainerStyles: React.CSSProperties = {}

  // Set styles for absolutely positioned desktop elements for browser
  // behaviour
  if (iframePositioningEnabled) {
    const mobile = Viewport.isSingleColumn()
    const position = mobile ? 'static' : 'absolute' // Only run re-positioning on desktop

    iframeContainerStyles = {
      top: iframePlaceholderTop,
      width,
      maxWidth: mobile ? '100%' : iframePlaceholderWidth,
      position,
    }
  }

  return (
    <>
      {/* Styles for iframe layout */}
      {iframePositioningEnabled && <style>{iframeStyleBlock('iframe')}</style>}

      {/* See Vimeo.tsx for details about the iframe-placeholder element */}
      {iframePositioningEnabled && (
        <div
          key={`placholder-${src}`}
          style={{ paddingTop: height }}
          className="bber-iframe-placeholder"
          ref={innerRef}
        />
      )}

      <div style={iframeContainerStyles} key={src} ref={node.elemRef}>
        <iframe src={src} title={title} {...attrs} />
      </div>
    </>
  )
}

export default Iframe
