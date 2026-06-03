import React from 'react'
import MediaButtonFullScreen from './MediaButtonFullScreen'
import MediaButtonVolume from './MediaButtonVolume'
import MediaTime from './MediaTime'
import VideoControlsSimple from './VideoControlsSimple'

const VideoControlsNormal = (props) => (
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
