import React from 'react'

const MediaButtonPlayPause = props =>
  props.paused ? (
    <button className="material-icons" onClick={props.play}>
      play_arrow
    </button>
  ) : (
    <button className="material-icons" onClick={props.pause}>
      pause
    </button>
  )

export default MediaButtonPlayPause
