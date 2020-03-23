import React from 'react'
import AudioControlsNormal from './AudioControlsNormal'
import MediaButtonLoop from './MediaButtonLoop'
import MediaButtonPlaybackRate from './MediaButtonPlaybackRate'

const AudioControlsFull = props => (
  <React.Fragment>
    <AudioControlsNormal {...props} />
    <MediaButtonLoop updateLoop={props.updateLoop} />
    <MediaButtonPlaybackRate
      playbackSlow={props.playbackSlow}
      playbackNormal={props.playbackNormal}
      playbackFast={props.playbackFast}
    />
  </React.Fragment>
)

export default AudioControlsFull
