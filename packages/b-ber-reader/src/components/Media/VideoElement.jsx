/* eslint-disable jsx-a11y/media-has-caption*/

import React from 'react'

const VideoElement = ({
  elementKey,
  elementRef,
  handleLoad,
  handleEnded,
  controls,
  children,
  ...mediaAttributes
}) => {
  console.log('mediaAttributes', mediaAttributes)

  return (
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
}

export default VideoElement
