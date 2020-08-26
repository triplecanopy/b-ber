import React from 'react'

const MediaButtonSeekForward = props => (
  <button
    className="material-icons media__button__forward_30"
    onClick={props.timeForward}
  >
    forward_30
  </button>
)

const MediaButtonSeekBack = props => (
  <button
    className="material-icons media__button__replay_30"
    onClick={props.timeBack}
  >
    replay_30
  </button>
)

export { MediaButtonSeekForward, MediaButtonSeekBack }
