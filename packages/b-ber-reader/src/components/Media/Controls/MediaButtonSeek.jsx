import React from 'react'

const MediaButtonSeekForward = props => (
  <button className="material-icons" onClick={props.timeForward}>
    forward_30
  </button>
)

const MediaButtonSeekBack = props => (
  <button className="material-icons" onClick={props.timeBack}>
    replay_30
  </button>
)

export { MediaButtonSeekForward, MediaButtonSeekBack }
