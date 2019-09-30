/* eslint-disable jsx-a11y/media-has-caption,no-unused-vars */

import React from 'react'
import Media from './Media'
import withNodePosition from './withNodePosition'

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
        return (
            <audio ref={elemRef} {...rest}>
                {this.props.children}
            </audio>
        )
    }
}

export default withNodePosition(Audio, { useParentDimensions: true })
