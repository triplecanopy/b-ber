import React from 'react'

const MediaButtonDownload = props => (
  <a href={props.currentSrc} download={true}>
    download
  </a>
)

export default MediaButtonDownload
