import React from 'react'
import classNames from 'classnames'
import { connect } from 'react-redux'

function Spinner(props) {
  return (
    <div
      className={classNames('bber-spinner', {
        'bber-spinner--visible': props.userInterface.spinnerVisible,
      })}
    >
      <div className="bber-spinner__detail" />
    </div>
  )
}

export default connect(
  ({ userInterface }) => ({ userInterface }),
  () => ({})
)(Spinner)
