/* eslint-disable jsx-a11y/media-has-caption*/

import React from 'react'
import PropTypes from 'prop-types'

const AudioElement = ({ elementKey, elementRef, children, ...rest }) => (
  <audio key={elementKey} ref={elementRef} {...rest}>
    {children}
  </audio>
)

AudioElement.propTypes = {
  elementKey: PropTypes.string.isRequired,
  elementRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.elementType }),
  ]).isRequired,
}

export default AudioElement
