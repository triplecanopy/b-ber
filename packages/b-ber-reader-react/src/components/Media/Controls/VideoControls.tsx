import React from 'react'
import type { MediaControlsChildProps } from './types'
import VideoControlsFull from './VideoControlsFull'
import VideoControlsNormal from './VideoControlsNormal'
import VideoControlsSimple from './VideoControlsSimple'

type VideoControlsProps = Omit<MediaControlsChildProps, 'mediaType'>

const VideoControls = ({ config, ...rest }: VideoControlsProps) => {
  if (config === 'simple') return <VideoControlsSimple {...rest} />
  if (config === 'normal') return <VideoControlsNormal {...rest} />
  return <VideoControlsFull {...rest} />
}

export default VideoControls
