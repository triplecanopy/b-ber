import React from 'react'
import AudioControlsSimple from './AudioControlsSimple'
import AudioControlsNormal from './AudioControlsNormal'
import AudioControlsFull from './AudioControlsFull'

const AudioControls = ({ config, ...rest }) => {
  if (config === 'simple') return <AudioControlsSimple {...rest} />
  if (config === 'normal') return <AudioControlsNormal {...rest} />
  return <AudioControlsFull {...rest} />
}

export default AudioControls
