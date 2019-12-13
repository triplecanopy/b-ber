/* eslint-disable jsx-a11y/media-has-caption*/

import React from 'react'
import PropTypes from 'prop-types'

const VideoElement = ({ elementKey, elementRef, children, ...rest }) => (
  <video key={elementKey} ref={elementRef} {...rest}>
    {children}
  </video>
)

VideoElement.propTypes = {
  elementKey: PropTypes.string.isRequired,
  elementRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.elementType }),
  ]).isRequired,
}

export default VideoElement
