import React from 'react'
import AudioControlsSimple from './AudioControlsSimple'
import MediaButtonSeek from './MediaButtonSeek'
import MediaButtonVolume from './MediaButtonVolume'
import MediaButtonDownload from './MediaButtonDownload'

const AudioControlsNormal = props => (
  <React.Fragment>
    <AudioControlsSimple {...props} />
    <MediaButtonSeek
      timeForward={props.timeForward}
      timeBack={props.timeBack}
    />
    <MediaButtonVolume
      volumeUp={props.volumeUp}
      volumeDown={props.volumeDown}
    />
    <MediaButtonDownload currentSrc={props.currentSrc} />
  </React.Fragment>
)

export default AudioControlsNormal
