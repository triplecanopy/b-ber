import React from 'react'
import MediaButtonPlayPause from './MediaButtonPlayPause'
import type { MediaControlsChildProps } from './MediaControls'
import MediaRangeSlider from './MediaRangeSlider'
import MediaTime from './MediaTime'

type AudioControlsSimpleProps = Omit<
  MediaControlsChildProps,
  'mediaType' | 'config'
>

const AudioControlsSimple = (props: AudioControlsSimpleProps) => (
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
