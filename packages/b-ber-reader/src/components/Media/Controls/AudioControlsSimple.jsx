import React from 'react'
import MediaTime from './MediaTime'
import MediaButtonPlayPause from './MediaButtonPlayPause'
import MediaRangeSlider from './MediaRangeSlider'

const AudioControlsSimple = props => (
  <React.Fragment>
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
  </React.Fragment>
)

export default AudioControlsSimple
