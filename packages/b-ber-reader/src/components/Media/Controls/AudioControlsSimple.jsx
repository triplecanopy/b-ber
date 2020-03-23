import React from 'react'
import MediaTime from './MediaTime'
import MediaButtonPlayPause from './MediaButtonPlayPause'
import MediaRangeSlider from './MediaRangeSlider'

const AudioControlsSimple = props => (
  <React.Fragment>
    <MediaTime
      timeElapsed={props.timeElapsed}
      timeRemaining={props.timeRemaining}
    />
    <MediaButtonPlayPause
      paused={props.paused}
      pause={props.pause}
      play={props.play}
    />
    <MediaRangeSlider
      duration={props.duration}
      progress={props.progress}
      seek={props.seek}
    />
  </React.Fragment>
)

export default AudioControlsSimple
