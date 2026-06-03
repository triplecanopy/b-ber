import React from 'react'
import AudioControlsFull from './AudioControlsFull'
import AudioControlsNormal from './AudioControlsNormal'
import AudioControlsSimple from './AudioControlsSimple'

const AudioControls = ({ config, ...rest }) => {
  if (config === 'simple') return <AudioControlsSimple {...rest} />
  if (config === 'normal') return <AudioControlsNormal {...rest} />
  return <AudioControlsFull {...rest} />
}

export default AudioControls
