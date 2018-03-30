import {mobileViewportMaxWidth} from '../config'

class Viewport {
    static isMobile() {
        return window.innerWidth <= mobileViewportMaxWidth
    }
}

export default Viewport
