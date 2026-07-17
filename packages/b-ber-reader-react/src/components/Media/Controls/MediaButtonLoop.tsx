import classNames from 'classnames'
import React from 'react'
import Repeat from '../../Icons/Repeat'

interface MediaButtonLoopProps {
  loop: boolean
  updateLoop: () => void
}

function MediaButtonLoop(props: MediaButtonLoopProps) {
  return (
    <button
      className={classNames('bber-button', {
        'bber-hover': props.loop,
      })}
      onClick={props.updateLoop}
    >
      <Repeat />
    </button>
  )
}

export default MediaButtonLoop
