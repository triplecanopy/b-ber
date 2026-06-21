import React from 'react'
import FileDownload from '../../Icons/FileDownload'

interface MediaButtonDownloadProps {
  currentSrc: string
}

const MediaButtonDownload = (props: MediaButtonDownloadProps) => (
  <a
    className="bber-a media__button__file_download"
    href={props.currentSrc}
    download={true}
  >
    <FileDownload />
  </a>
)

export default MediaButtonDownload
