import React from 'react'

const MediaButtonPlayPause = props =>
  props.paused ? (
    <button onClick={props.play}>play</button>
  ) : (
    <button onClick={props.pause}>pause</button>
  )

export default MediaButtonPlayPause
