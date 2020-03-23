import React from 'react'

const MediaButtonPlaybackRate = props => (
  <React.Fragment>
    <button onClick={props.playbackSlow}>rate 1</button>
    <button onClick={props.playbackNormal}>rate 2</button>
    <button onClick={props.playbackFast}>rate 3</button>
  </React.Fragment>
)

export default MediaButtonPlaybackRate
