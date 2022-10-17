import React from 'react'

function MediaButtonSeekForward(props) {
  return (
    <button
      className="bber-button material-icons bber-media__button__forward_30"
      onClick={props.timeForward}
    >
      forward_30
    </button>
  )
}

function MediaButtonSeekBack(props) {
  return (
    <button
      className="bber-button material-icons bber-media__button__replay_30"
      onClick={props.timeBack}
    >
      replay_30
    </button>
  )
}

export { MediaButtonSeekForward, MediaButtonSeekBack }
