import React from 'react'
import AudioControls from './AudioControls'
import type { MediaControlsChildProps } from './types'
import VideoControls from './VideoControls'

const AudioVideoControls = ({
  mediaType,
  ...rest
}: MediaControlsChildProps) => {
  // `rest` already carries playbackSlow/Normal/Fast (injected by MediaControls).
  if (mediaType === 'audio') return <AudioControls {...rest} />

  return <VideoControls {...rest} />
}

export default AudioVideoControls
