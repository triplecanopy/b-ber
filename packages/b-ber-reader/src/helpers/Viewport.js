import {breakpoints} from '../constants'

class Viewport {
    static isMobile() {
        return window.innerWidth <= breakpoints.MOBILE
    }
}

export default Viewport
