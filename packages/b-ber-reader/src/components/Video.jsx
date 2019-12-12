/* eslint-disable no-unused-vars */

import React from 'react'
import Media from './Media'
import withNodePosition from './withNodePosition'
import VideoElement from './VideoElement'

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

    return <VideoElement elementKey={rest.id} elementRef={elemRef} {...rest} />
  }
}

export default withNodePosition(Video, { useParentDimensions: true })
