import React from 'react'
import VideoControlsSimple from './VideoControlsSimple'
import VideoControlsNormal from './VideoControlsNormal'
import VideoControlsFull from './VideoControlsFull'

const VideoControls = ({ config, ...rest }) => {
  if (config === 'simple') return <VideoControlsSimple {...rest} />
  if (config === 'normal') return <VideoControlsNormal {...rest} />
  return <VideoControlsFull {...rest} />
}

export default VideoControls
