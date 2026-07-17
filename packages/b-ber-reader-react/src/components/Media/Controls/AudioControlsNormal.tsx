import React from 'react'
import MediaButtonPlayPause from './MediaButtonPlayPause'
import { MediaButtonSeekBack, MediaButtonSeekForward } from './MediaButtonSeek'
import MediaButtonVolume from './MediaButtonVolume'
import MediaRangeSlider from './MediaRangeSlider'
import MediaTime from './MediaTime'
import type { MediaControlsChildProps } from './types'

type AudioControlsNormalProps = Omit<
  MediaControlsChildProps,
  'mediaType' | 'config'
>

const AudioControlsNormal = (props: AudioControlsNormalProps) => (
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
