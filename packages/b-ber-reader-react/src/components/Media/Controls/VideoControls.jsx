import React from 'react'
import VideoControlsFull from './VideoControlsFull'
import VideoControlsNormal from './VideoControlsNormal'
import VideoControlsSimple from './VideoControlsSimple'

const VideoControls = ({ config, ...rest }) => {
  if (config === 'simple') return <VideoControlsSimple {...rest} />
  if (config === 'normal') return <VideoControlsNormal {...rest} />
  return <VideoControlsFull {...rest} />
}

export default VideoControls
