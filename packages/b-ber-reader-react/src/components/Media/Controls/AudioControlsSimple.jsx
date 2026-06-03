import React from 'react'
import MediaButtonPlayPause from './MediaButtonPlayPause'
import MediaRangeSlider from './MediaRangeSlider'
import MediaTime from './MediaTime'

const AudioControlsSimple = (props) => (
  <>
    <MediaButtonPlayPause
      paused={props.paused}
      pause={props.pause}
      play={props.play}
    />
    <MediaTime time={props.timeElapsed} />
    <MediaRangeSlider
      duration={props.duration}
      progress={props.progress}
      seek={props.seek}
    />
    <MediaTime time={props.timeRemaining} />
  </>
)

export default AudioControlsSimple
