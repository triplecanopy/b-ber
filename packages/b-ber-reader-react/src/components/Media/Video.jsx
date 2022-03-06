import React from 'react'
import Media from './Media'
import VideoElement from './VideoElement'

const Video = props => (
  <Media mediaType="video" MediaComponent={VideoElement} {...props} />
)

export default Video
