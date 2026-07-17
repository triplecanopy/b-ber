import React from 'react'
import Forward30 from '../../Icons/Forward30'
import Replay30 from '../../Icons/Replay30'

interface MediaButtonSeekForwardProps {
  timeForward: () => void
}

interface MediaButtonSeekBackProps {
  timeBack: () => void
}

function MediaButtonSeekForward(props: MediaButtonSeekForwardProps) {
  return (
    <button
      className="bber-button bber-media__button__forward_30"
      onClick={props.timeForward}
    >
      <Forward30 />
    </button>
  )
}

function MediaButtonSeekBack(props: MediaButtonSeekBackProps) {
  return (
    <button
      className="bber-button bber-media__button__replay_30"
      onClick={props.timeBack}
    >
      <Replay30 />
    </button>
  )
}

export { MediaButtonSeekBack, MediaButtonSeekForward }
