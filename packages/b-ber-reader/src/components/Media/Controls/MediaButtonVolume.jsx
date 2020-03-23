import React from 'react'

const MediaButtonVolume = props => (
  <React.Fragment>
    <button onClick={props.volumeUp}>volume up</button>
    <button onClick={props.volumeDown}>volume down</button>
  </React.Fragment>
)

export default MediaButtonVolume
