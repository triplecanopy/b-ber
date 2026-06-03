import React from 'react'
import AudioElement from './AudioElement'
import Media from './Media'

const Audio = (props) => (
  <Media mediaType="audio" MediaComponent={AudioElement} {...props} />
)

export default Audio
