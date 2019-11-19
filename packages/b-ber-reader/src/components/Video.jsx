/* eslint-disable jsx-a11y/media-has-caption,no-unused-vars */

import React from 'react'
import Media from './Media'
import withNodePosition from './withNodePosition'

class Video extends Media {
  render() {
    const {
      elemRef,
      verso,
      recto,
      edgePosition,
      spreadIndex,
      edgePositionVariance,
      elementEdgeLeft,
      ...rest
    } = this.props
    return (
      <video ref={elemRef} {...rest}>
        {this.props.children}
      </video>
    )
  }
}

export default withNodePosition(Video, { useParentDimensions: true })
