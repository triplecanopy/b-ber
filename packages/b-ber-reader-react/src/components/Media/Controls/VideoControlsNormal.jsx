import React from 'react'
import VideoControlsSimple from './VideoControlsSimple'
import MediaTime from './MediaTime'
import MediaButtonVolume from './MediaButtonVolume'
import MediaButtonFullScreen from './MediaButtonFullScreen'

const VideoControlsNormal = props => (
  <>
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
  </>
)

export default VideoControlsNormal
