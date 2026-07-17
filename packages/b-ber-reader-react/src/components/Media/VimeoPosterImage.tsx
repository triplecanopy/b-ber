import classNames from 'classnames'
import React from 'react'

interface VimeoPosterImageProps {
  src?: string | null
  playing: boolean
  controls: boolean
  handleUpdatePlaying: () => void
}

function VimeoPosterImage({
  src,
  playing,
  controls,
  handleUpdatePlaying,
}: VimeoPosterImageProps) {
  if (!src) return null

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: poster is a decorative overlay; the underlying player provides keyboard controls
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: poster is a decorative overlay; the underlying player provides keyboard controls
    // biome-ignore lint/a11y/noStaticElementInteractions: poster is a decorative overlay; the underlying player provides keyboard controls
    <img
      className={classNames('bber-poster bber-poster--vimeo', {
        // Don't show poster image if the video is playing
        'bber-visible': !playing,
        // Disable pointer-events on the poster image if using native controls
        // and the video is playing
        'bber-controls': controls,
      })}
      onClick={handleUpdatePlaying}
      src={src}
      alt=""
    />
  )
}

export default VimeoPosterImage
