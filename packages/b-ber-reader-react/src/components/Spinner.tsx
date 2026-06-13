import classNames from 'classnames'
import React from 'react'
import { connect } from 'react-redux'
import type { RootState } from '../store/types'

interface SpinnerProps {
  userInterface: RootState['userInterface']
}

function Spinner(props: SpinnerProps) {
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
  ({ userInterface }: RootState) => ({ userInterface }),
  () => ({})
)(Spinner)
