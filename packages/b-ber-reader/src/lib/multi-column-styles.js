import {debug} from '../config'

export const mediaLarge = ({paddingLeft, columnGap}) => [{
    selector: `.figure__fullbleed figure`,
    declarations: [
        `opacity: ${debug ? 0.8 : 1}`,
        `top: 0`,
        `z-index: 11`,
        `height: 100vh`,
        `position: absolute`,
        `width: calc(100vw - ${(paddingLeft * 2)}px)`,
        `margin-left: ${(paddingLeft * -2) + columnGap}px`,
    ],
}, {
    selector: `.figure__fullbleed figure .img-wrap img,
               .figure__fullbleed figure .img-wrap video`,
    declarations: [
        `opacity: ${debug ? 0.4 : 1}`,
        `position: absolute`,
        `object-fit: contain`,
        `width: 100%!important`,
        `max-width: 100%`,
        `max-height: 100%!important`,
        `height: 100%`,
        `top: 0`,
        `left: 0`,
        `bottom: 0`,
        `right: 0`,
    ],
}]


export const mediaSmall = ({paddingLeft, columnGap}) => [{
    selector: `.figure__fullbleed figure`,
    declarations: [
        `z-index: 11`,
        `width: calc(100vw - ${(paddingLeft * 2)}px)`,
        `margin-left: ${(paddingLeft * -2) + columnGap}px`,
    ],
}, {
    selector: `.figure__fullbleed figure .img-wrap img,
               .figure__fullbleed figure .img-wrap video`,
    declarations: [
        `opacity: ${debug ? 0.4 : 1}`,
        `object-fit: contain`,
        `width: 100%!important`,
        `max-width: 100%`,
        `max-height: 100%!important`,
        `height: 100%`,
        `top: 0`,
        `left: 0`,
        `bottom: 0`,
        `right: 0`,
    ],
}]
