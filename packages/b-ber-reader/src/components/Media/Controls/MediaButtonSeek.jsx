import React from 'react'

const MediaButtonSeek = props => (
  <React.Fragment>
    <button onClick={props.timeForward}>forward</button>
    <button onClick={props.timeBack}>back</button>
  </React.Fragment>
)

export default MediaButtonSeek
