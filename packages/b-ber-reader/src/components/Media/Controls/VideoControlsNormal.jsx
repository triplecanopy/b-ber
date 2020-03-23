import React from 'react'
import VideoControlsSimple from './VideoControlsSimple'
import MediaTime from './MediaTime'
import MediaButtonVolume from './MediaButtonVolume'
import MediaButtonFullScreen from './MediaButtonFullScreen'

const VideoControlsNormal = props => (
  <React.Fragment>
    <VideoControlsSimple {...props} />
    <MediaTime
      timeElapsed={props.timeElapsed}
      timeRemaining={props.timeRemaining}
    />
    <MediaButtonVolume
      volumeUp={props.volumeUp}
      volumeDown={props.volumeDown}
    />
    <MediaButtonFullScreen toggleFullscreen={props.toggleFullscreen} />
  </React.Fragment>
)

export default VideoControlsNormal
