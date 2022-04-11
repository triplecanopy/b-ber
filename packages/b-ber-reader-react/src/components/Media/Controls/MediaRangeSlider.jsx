import React from 'react'

function MediaRangeSlider(props) {
  return (
    <div className="bber-media__slider">
      <div
        className="bber-media__slider--before"
        style={{ width: `${(props.progress / props.duration) * 100}%` }}
      />
      <input
        className="bber-input"
        type="range"
        min="0"
        max={props.duration}
        step={props.duration / 100}
        value={props.progress}
        onChange={props.seek}
      />
    </div>
  )
}

export default MediaRangeSlider
