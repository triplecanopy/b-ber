import React from 'react'

interface AudioElementProps {
  elementKey?: React.Key
  elementRef?: React.Ref<HTMLAudioElement>
  handleLoad?: React.ReactEventHandler<HTMLAudioElement>
  handleEnded?: React.ReactEventHandler<HTMLAudioElement>
  controls?: boolean
  children?: React.ReactNode
  // Remaining HTML5 media attributes are spread onto the element.
  [key: string]: any
}

const AudioElement = ({
  elementKey,
  elementRef,
  handleLoad,
  handleEnded,
  controls,
  children,
  ...mediaAttributes
}: AudioElementProps) => (
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
