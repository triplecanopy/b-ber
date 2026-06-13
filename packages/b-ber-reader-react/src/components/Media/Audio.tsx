import React from 'react'
import AudioElement from './AudioElement'
import Media from './Media'

// Pass-through wrapper: all props are forwarded to Media.
const Audio = (props: Record<string, any>) => (
  <Media mediaType="audio" MediaComponent={AudioElement} {...props} />
)

export default Audio
