import React from 'react'

interface MediaButtonDownloadProps {
  currentSrc: string
}

const MediaButtonDownload = (props: MediaButtonDownloadProps) => (
  <a
    className="bber-a material-icons media__button__file_download"
    href={props.currentSrc}
    download={true}
  >
    file_download
  </a>
)

export default MediaButtonDownload
