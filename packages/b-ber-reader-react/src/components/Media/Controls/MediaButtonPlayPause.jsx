import React from 'react'

function MediaButtonPlayPause(props) {
  return props.paused ? (
    <button
      className="bber-button material-icons bber-media__button__play"
      onClick={props.play}
    >
      play_arrow
    </button>
  ) : (
    <button
      className="bber-button material-icons bber-media__button__pause"
      onClick={props.pause}
    >
      pause
    </button>
  )
}

export default MediaButtonPlayPause
