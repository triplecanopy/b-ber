import React from 'react'

interface VideoElementProps {
  elementKey?: React.Key
  elementRef?: React.Ref<HTMLVideoElement>
  handleLoad?: React.ReactEventHandler<HTMLVideoElement>
  handleEnded?: React.ReactEventHandler<HTMLVideoElement>
  controls?: boolean
  children?: React.ReactNode
  // Remaining HTML5 media attributes are spread onto the element.
  [key: string]: any
}

const VideoElement = ({
  elementKey,
  elementRef,
  handleLoad,
  handleEnded,
  controls,
  children,
  ...mediaAttributes
}: VideoElementProps) => (
  <video
    onLoadedMetadata={handleLoad}
    onEnded={handleEnded}
    controls={controls}
    key={elementKey}
    ref={elementRef}
    {...mediaAttributes}
  >
    {children}
  </video>
)

export default VideoElement
