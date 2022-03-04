import React from 'react'
import VideoControlsNormal from './VideoControlsNormal'
import MediaButtonPlaybackRate from './MediaButtonPlaybackRate'

const VideoControlsFull = props => (
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
