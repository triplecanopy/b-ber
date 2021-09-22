import React from 'react'
import Viewport from '../helpers/Viewport'
import { layouts } from '../constants'

// Figures in spreads are positioned absolutely, so the fullbleed images
// contained inside them overflow on either side. we create a style block for
// each image based on its position and transform it to either side as a user
// scrolls. end effect is that it 'wipes' into/out of view, and is centered on
// the page where the figure is placed

const SpreadImageStyles = props => {
  const { spreadPosition, markerRefId, paddingLeft, recto, unbound } = props
  const translateLeftPrevious = paddingLeft * 2
  const translateLeftCurrent = 0
  const translateLeftNext = paddingLeft * -2

  // If an image is recto or unbound, then set it to be centered on the
  // upcoming screen, since the figure's position is calculated based on the
  // marker, and the marker in those cases will be one page behind

  // const adjustedSpreadPosition =
  //   recto || unbound ? spreadPosition - 1 : spreadPosition

  // const adjustedSpreadPosition = spreadPosition

  const adjustedSpreadPosition = unbound ? spreadPosition - 1 : spreadPosition

  // const adjustedSpreadPosition = recto ? spreadPosition - 1 : spreadPosition

  // console.log('recto || unbound', recto, unbound, spreadPosition)

  // prettier-ignore
  const styles = props.layout === layouts.SCROLL || Viewport.isMobile() ? null : `
    /* Previous pages */
    .spread-index__${adjustedSpreadPosition - 2} #spread__${markerRefId} > figure,
    .spread-index__${adjustedSpreadPosition - 2} #spread__${markerRefId} > .spread__content,
    .spread-index__${adjustedSpreadPosition - 1} #spread__${markerRefId} > figure,
    .spread-index__${adjustedSpreadPosition - 1} #spread__${markerRefId} > .spread__content { transform: translateX(${translateLeftPrevious}px); }

    /* Current page */
    .spread-index__${adjustedSpreadPosition}     #spread__${markerRefId} > figure,
    .spread-index__${adjustedSpreadPosition}     #spread__${markerRefId} > .spread__content { transform: translateX(${translateLeftCurrent}px); }

    /* Next pages */
    .spread-index__${adjustedSpreadPosition + 1} #spread__${markerRefId} > figure,
    .spread-index__${adjustedSpreadPosition + 1} #spread__${markerRefId} > .spread__content,
    .spread-index__${adjustedSpreadPosition + 2} #spread__${markerRefId} > figure,
    .spread-index__${adjustedSpreadPosition + 2} #spread__${markerRefId} > .spread__content { transform: translateX(${translateLeftNext}px); }
  `

  return (
    <style id={`style__${markerRefId}`} data-position={adjustedSpreadPosition}>
      {styles}
    </style>
  )
}

export default SpreadImageStyles
