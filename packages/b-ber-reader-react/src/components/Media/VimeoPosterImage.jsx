import React from 'react'
import classNames from 'classnames'

function VimeoPosterImage({ src, playing, controls, handleUpdatePlaying }) {
  if (!src) return null

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-noninteractive-element-interactions
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
