import { debug } from '../config'

export const mediaLarge = (/* { paddingLeft, columnGap } */) => [
  // {
  //     selector: 'img',
  //     declarations: ['opacity: 0.2'],
  // },
  {
    selector: `.figure__fullbleed figure,
                   .spread .spread__content`,
    declarations: [
      `opacity: ${debug ? 0.8 : 1}`,
      'top: 0',
      'z-index: 11',
      'height: 100vh',
      'position: absolute',
      'width: 100vw',
    ],
  },
  {
    selector: `.figure__fullbleed figure .img-wrap img,
                   .figure__fullbleed figure .img-wrap video`,
    declarations: [
      `opacity: ${debug ? 0.4 : 1}`,
      'position: absolute',
      'object-fit: contain',
      'width: 100%!important',
      'max-width: 100%',
      'max-height: 100%!important',
      'height: 100%',
      'top: 0',
      'left: 0',
      'bottom: 0',
      'right: 0',
    ],
  },
]

export const mediaSmall = (/* {paddingLeft, columnGap} */) => [
  {
    selector: `.figure__fullbleed figure .spread .spread__content`,
    declarations: ['z-index: 11', 'width: 100vw', 'position: relative'],
  },
  {
    selector: `.figure__fullbleed figure .img-wrap img,
                   .figure__fullbleed figure .img-wrap video`,
    declarations: [
      `opacity: ${debug ? 0.4 : 1}`,
      'object-fit: contain',
      'width: 100%!important',
      'max-width: 100%',
      'max-height: 100%!important',
      'height: 100%',
      'top: 0',
      'left: 0',
      'bottom: 0',
      'right: 0',
    ],
  },
]
