import classNames from 'classnames'
import React from 'react'

interface MediaButtonLoopProps {
  loop: boolean
  updateLoop: () => void
}

function MediaButtonLoop(props: MediaButtonLoopProps) {
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
