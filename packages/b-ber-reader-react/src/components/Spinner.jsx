import React from 'react'
import classNames from 'classnames'

function Spinner(props) {
  return (
    <div
      className={classNames('bber-spinner', {
        'bber-spinner--visible': props.spinnerVisible,
      })}
    >
      <div className="bber-spinner__detail" />
    </div>
  )
}

export default Spinner
