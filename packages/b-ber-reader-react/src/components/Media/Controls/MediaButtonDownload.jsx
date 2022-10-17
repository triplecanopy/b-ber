import React from 'react'

const MediaButtonDownload = props => (
  <a
    className="bber-a material-icons media__button__file_download"
    href={props.currentSrc}
    download={true}
  >
    file_download
  </a>
)

export default MediaButtonDownload
