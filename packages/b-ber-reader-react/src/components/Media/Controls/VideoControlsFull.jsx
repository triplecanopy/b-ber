import React from 'react'
import MediaButtonPlaybackRate from './MediaButtonPlaybackRate'
import VideoControlsNormal from './VideoControlsNormal'

const VideoControlsFull = (props) => (
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
