import {breakpoints} from '../constants'

class Viewport {
    static isMobile() {
        return window.innerWidth <= breakpoints.MOBILE
    }
    static isXlarge() {
        return window.innerWidth >= breakpoints.XLARGE
    }
}

export default Viewport
