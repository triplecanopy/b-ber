import React from 'react'
import classNames from 'classnames'

const Spinner = props => (
    <div
        className={classNames('spinner', {
            'spinner--visible': props.spinnerVisible,
        })}
    >
        <div className="spinner__detail" />
    </div>
)

export default Spinner
