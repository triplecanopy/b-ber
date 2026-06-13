import React from 'react'

interface MediaButtonSeekForwardProps {
  timeForward: () => void
}

interface MediaButtonSeekBackProps {
  timeBack: () => void
}

function MediaButtonSeekForward(props: MediaButtonSeekForwardProps) {
  return (
    <button
      className="bber-button material-icons bber-media__button__forward_30"
      onClick={props.timeForward}
    >
      forward_30
    </button>
  )
}

function MediaButtonSeekBack(props: MediaButtonSeekBackProps) {
  return (
    <button
      className="bber-button material-icons bber-media__button__replay_30"
      onClick={props.timeBack}
    >
      replay_30
    </button>
  )
}

export { MediaButtonSeekBack, MediaButtonSeekForward }
