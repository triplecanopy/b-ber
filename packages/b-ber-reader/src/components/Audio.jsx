/* eslint-disable no-unused-vars */

import React from 'react'
import Media from './Media'
import withNodePosition from './withNodePosition'
import AudioElement from './AudioElement'

class Audio extends Media {
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

    return <AudioElement elementKey={rest.id} elementRef={elemRef} {...rest} />
  }
}

export default withNodePosition(Audio, { useParentDimensions: true })
