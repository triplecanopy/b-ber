import React from 'react'

const MediaButtonDownload = props => (
  <a className="material-icons" href={props.currentSrc} download={true}>
    file_download
  </a>
)

export default MediaButtonDownload
