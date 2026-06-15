import classNames from 'classnames'
import React from 'react'
import { useStore } from '../store/StoreContext'

function Spinner() {
  const spinnerVisible = useStore((s) => s.userInterface.spinnerVisible)

  return (
    <div
      className={classNames('bber-spinner', {
        'bber-spinner--visible': spinnerVisible,
      })}
    >
      <div className="bber-spinner__detail" />
    </div>
  )
}

export default Spinner
