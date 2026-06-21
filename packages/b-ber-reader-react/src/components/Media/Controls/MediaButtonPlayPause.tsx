import React from 'react'
import Pause from '../../Icons/Pause'
import PlayArrow from '../../Icons/PlayArrow'

interface MediaButtonPlayPauseProps {
  paused: boolean
  play: () => void
  pause: () => void
}

function MediaButtonPlayPause(props: MediaButtonPlayPauseProps) {
  return props.paused ? (
    <button
      className="bber-button bber-media__button__play"
      onClick={props.play}
    >
      <PlayArrow />
    </button>
  ) : (
    <button
      className="bber-button bber-media__button__pause"
      onClick={props.pause}
    >
      <Pause />
    </button>
  )
}

export default MediaButtonPlayPause
