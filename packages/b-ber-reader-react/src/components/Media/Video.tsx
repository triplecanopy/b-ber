import React from 'react'
import Media from './Media'
import VideoElement from './VideoElement'

// Pass-through wrapper: all props are forwarded to Media.
const Video = (props: Record<string, any>) => (
  <Media mediaType="video" MediaComponent={VideoElement} {...props} />
)

export default Video
