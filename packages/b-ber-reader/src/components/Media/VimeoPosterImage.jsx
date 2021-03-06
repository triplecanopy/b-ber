import React from 'react'
import classNames from 'classnames'

const VimeoPosterImage = ({ src, playing, controls, handleUpdatePlaying }) => {
  if (!src) return null

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-noninteractive-element-interactions
    <img
      className={classNames('poster poster--vimeo', {
        // Don't show poster image if the video is playing
        visible: !playing,
        // Disable pointer-events on the poster image if using native controls
        // and the video is playing
        controls,
      })}
      onClick={handleUpdatePlaying}
      src={src}
      alt=""
    />
  )
}

export default VimeoPosterImage
