import {debug} from '../config'

export const mediaLarge = [{
    selector: `.figure__fullbleed figure`,
    declarations: [
        `position: absolute`,
        `height: 100vh`,
        `width: 100vw`,
        `top: 0`,
        `margin-left: -30px`, // must match #layout padding
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


export const mediaSmall = [{
    selector: `.figure__fullbleed figure`,
    declarations: [
        `width: 100vw`,
        `margin-left: -30px`, // must match #layout padding
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
