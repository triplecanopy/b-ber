import React from 'react'
import MediaButtonPlayPause from './MediaButtonPlayPause'
import MediaRangeSlider from './MediaRangeSlider'
import type { MediaControlsChildProps } from './types'

type VideoControlsSimpleProps = Omit<
  MediaControlsChildProps,
  'mediaType' | 'config'
>

const VideoControlsSimple = (props: VideoControlsSimpleProps) => (
  <>
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
  </>
)

export default VideoControlsSimple
