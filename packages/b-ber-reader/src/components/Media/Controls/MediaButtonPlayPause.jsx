import React from 'react'

const MediaButtonPlayPause = props =>
  props.paused ? (
    <button className="material-icons media__button__play" onClick={props.play}>
      play_arrow
    </button>
  ) : (
    <button
      className="material-icons media__button__pause"
      onClick={props.pause}
    >
      pause
    </button>
  )

export default MediaButtonPlayPause
