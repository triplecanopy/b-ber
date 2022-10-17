import React from 'react'
import { MediaButtonSeekForward, MediaButtonSeekBack } from './MediaButtonSeek'
import MediaButtonVolume from './MediaButtonVolume'
import MediaButtonPlayPause from './MediaButtonPlayPause'
import MediaTime from './MediaTime'
import MediaRangeSlider from './MediaRangeSlider'

const AudioControlsNormal = props => (
  <>
    <MediaButtonSeekBack timeBack={props.timeBack} />
    <MediaButtonPlayPause
      paused={props.paused}
      pause={props.pause}
      play={props.play}
    />
    <MediaButtonSeekForward timeForward={props.timeForward} />
    <MediaTime time={props.timeElapsed} />
    <MediaRangeSlider
      duration={props.duration}
      progress={props.progress}
      seek={props.seek}
    />
    <MediaTime time={props.timeRemaining} />
    <MediaButtonVolume
      volume={props.volume}
      updateVolume={props.updateVolume}
    />
  </>
)

export default AudioControlsNormal
