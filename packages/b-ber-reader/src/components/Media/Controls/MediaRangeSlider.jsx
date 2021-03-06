import React from 'react'

const MediaRangeSlider = props => (
  <div className="media__slider">
    <div
      className="media__slider--before"
      style={{ width: `${(props.progress / props.duration) * 100}%` }}
    />
    <input
      type="range"
      min="0"
      max={props.duration}
      step={props.duration / 100}
      value={props.progress}
      onChange={props.seek}
    />
  </div>
)

export default MediaRangeSlider
