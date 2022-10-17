import React from 'react'
import Media from './Media'
import AudioElement from './AudioElement'

const Audio = props => (
  <Media mediaType="audio" MediaComponent={AudioElement} {...props} />
)

export default Audio
