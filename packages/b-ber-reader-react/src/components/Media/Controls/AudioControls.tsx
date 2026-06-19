import React from 'react'
import AudioControlsFull from './AudioControlsFull'
import AudioControlsNormal from './AudioControlsNormal'
import AudioControlsSimple from './AudioControlsSimple'
import type { MediaControlsChildProps } from './types'

type AudioControlsProps = Omit<MediaControlsChildProps, 'mediaType'>

const AudioControls = ({ config, ...rest }: AudioControlsProps) => {
  if (config === 'simple') return <AudioControlsSimple {...rest} />
  if (config === 'normal') return <AudioControlsNormal {...rest} />
  return <AudioControlsFull {...rest} />
}

export default AudioControls
