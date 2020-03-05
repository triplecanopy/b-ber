/* eslint-disable jsx-a11y/media-has-caption*/

import React from 'react'

const AudioElement = ({
  elementKey,
  elementRef,
  handleLoad,
  handleEnded,
  controls,
  children,
  ...mediaAttributes
}) => (
  <audio
    onLoadedMetadata={handleLoad}
    onEnded={handleEnded}
    controls={controls}
    key={elementKey}
    ref={elementRef}
    {...mediaAttributes}
  >
    {children}
  </audio>
)

export default AudioElement
