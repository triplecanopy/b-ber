import React from 'react'
import Viewport from '../helpers/Viewport'

// Figures in spreads are positioned absolutely, so the fullbleed images
// contained inside them overflow on either side. we create a style block for
// each image based on its position and transform it to either side as a user
// scrolls. end effect is that it 'wipes' into/out of view, and is centered on
// the page where the figure is placed

function SpreadImageStyles(props) {
  const { spreadPosition, markerRefId, paddingLeft, unbound } = props
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
  const styles = Viewport.isVerticallyScrolling(props) ? null : `
    /* Previous pages */
    .spread-index__${adjustedSpreadPosition - 2} #spread__${markerRefId} > figure,
    .spread-index__${adjustedSpreadPosition - 2} #spread__${markerRefId} > .spread__content,
    .spread-index__${adjustedSpreadPosition - 1} #spread__${markerRefId} > figure,
    .spread-index__${adjustedSpreadPosition - 1} #spread__${markerRefId} > .spread__content {
      backface-visibility: hidden;
      transform: translateX(${translateLeftPrevious}px) translate3d(0, 0, 0);
      /*transform-style: preserve-3d;*/
    }

    /* Current page */
    .spread-index__${adjustedSpreadPosition} #spread__${markerRefId} > figure,
    .spread-index__${adjustedSpreadPosition} #spread__${markerRefId} > .spread__content {
      backface-visibility: hidden;
      /*transform-style: preserve-3d;*/
      transform: translateX(${translateLeftCurrent}px) translate3d(0, 0, 0);
    }

    /* Next pages */
    .spread-index__${adjustedSpreadPosition + 1} #spread__${markerRefId} > figure,
    .spread-index__${adjustedSpreadPosition + 1} #spread__${markerRefId} > .spread__content,
    .spread-index__${adjustedSpreadPosition + 2} #spread__${markerRefId} > figure,
    .spread-index__${adjustedSpreadPosition + 2} #spread__${markerRefId} > .spread__content {
      backface-visibility: hidden;
      /*transform-style: preserve-3d;*/
      transform: translateX(${translateLeftNext}px) translate3d(0, 0, 0);
    }
  `

  return (
    <style id={`style__${markerRefId}`} data-position={adjustedSpreadPosition}>
      {styles}
    </style>
  )
}

export default SpreadImageStyles
