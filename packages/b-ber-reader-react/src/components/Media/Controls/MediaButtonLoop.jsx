import classNames from 'classnames'
import React from 'react'

function MediaButtonLoop(props) {
  return (
    <button
      className={classNames('bber-button material-icons', {
        'bber-hover': props.loop,
      })}
      onClick={props.updateLoop}
    >
      repeat
    </button>
  )
}

export default MediaButtonLoop
