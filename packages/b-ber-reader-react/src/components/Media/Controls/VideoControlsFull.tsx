import React from 'react'
import MediaButtonPlaybackRate from './MediaButtonPlaybackRate'
import type { MediaControlsChildProps } from './types'
import VideoControlsNormal from './VideoControlsNormal'

type VideoControlsFullProps = Omit<
  MediaControlsChildProps,
  'mediaType' | 'config'
>

const VideoControlsFull = (props: VideoControlsFullProps) => (
  <>
    <VideoControlsNormal {...props} />
    <MediaButtonPlaybackRate
      playbackSlow={props.playbackSlow}
      playbackNormal={props.playbackNormal}
      playbackFast={props.playbackFast}
    />
  </>
)

export default VideoControlsFull
