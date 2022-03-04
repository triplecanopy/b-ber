import React from 'react'
import AudioControls from './AudioControls'
import VideoControls from './VideoControls'

const AudioVideoControls = ({ mediaType, ...rest }) => {
  if (mediaType === 'audio')
    return (
      <AudioControls
        playbackSlow={rest.playbackSlow}
        playbackNormal={rest.playbackNormal}
        playbackFast={rest.playbackFast}
        {...rest}
      />
    )

  return (
    <VideoControls
      playbackSlow={rest.playbackSlow}
      playbackNormal={rest.playbackNormal}
      playbackFast={rest.playbackFast}
      {...rest}
    />
  )
}

export default AudioVideoControls
