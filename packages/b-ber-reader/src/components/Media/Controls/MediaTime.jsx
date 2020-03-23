import React from 'react'

const MediaTime = props => (
  <div className="media__time">
    <div className="media__time__elapsed">{props.timeElapsed}</div>
    <div className="media__time__separator">/</div>
    <div className="media__time__remaining">{props.timeRemaining}</div>
  </div>
)

export default MediaTime
