import React from 'react'
import VideoControlsNormal from './VideoControlsNormal'
import MediaButtonPlaybackRate from './MediaButtonPlaybackRate'

const VideoControlsFull = props => (
  <React.Fragment>
    <VideoControlsNormal {...props} />
    <MediaButtonPlaybackRate
      playbackSlow={props.playbackSlow}
      playbackNormal={props.playbackNormal}
      playbackFast={props.playbackFast}
    />
  </React.Fragment>
)

export default VideoControlsFull
