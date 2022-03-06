import React from 'react'
import classNames from 'classnames'

const MediaButtonLoop = props => (
  <button
    className={classNames('material-icons', { hover: props.loop })}
    onClick={props.updateLoop}
  >
    repeat
  </button>
)

export default MediaButtonLoop
