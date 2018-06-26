import isPlainObject from 'lodash/isPlainObject'
import {isNumeric} from '../helpers/Types'
import {transitions, themes} from '../constants'

const __extendExistingProps = (target, ref, obj, opts = {enumerable: true}) => {
    Object.entries(ref).forEach(([key, val]) => {
        const value = ({}.hasOwnProperty.call(obj, key)) ? obj[key] : val
        Object.defineProperty(target, key, {value, ...opts})
    })
    return target
}

class ViewerSettings {
    static defaults = {
        paddingTop: 37,
        paddingLeft: 90,
        paddingRight: 90,
        paddingBottom: 37,
        fontSize: 120,
        // fontFamily: 'Times',
        // columns: 2,                  // dynamic, based on screen size
        columnGap: 30,
        theme: themes.DEFAULT,
        transition: transitions.SLIDE,
        transitionSpeed: 400,           // must be in ms
    }
    constructor(options = {}) {
        this.settings = {}
        const options_ = __extendExistingProps({}, ViewerSettings.defaults, options)
        this.settings = {...this.settings, ...options_}

        this.put = this.put.bind(this)
        this.get = this.get.bind(this)
    }

    get paddingTop() { return this.settings.paddingTop }
    get paddingLeft() { return typeof this.settings.paddingLeft === 'function' ? this.settings.paddingLeft() : this.settings.paddingLeft }
    get paddingRight() { return typeof this.settings.paddingRight === 'function' ? this.settings.paddingRight() : this.settings.paddingRight }
    get paddingBottom() { return this.settings.paddingBottom }

    get paddingX() { return this.settings.paddingLeft + this.settings.paddingLeft }
    get paddingY() { return this.settings.paddingTop + this.settings.paddingBottom }

    get columns() { return this.settings.columns }
    get columnGap() { return this.settings.columnGap }
    get transition() { return this.settings.transition }
    get transitionSpeed() { return this.settings.transitionSpeed }
    get theme() { return this.settings.theme }

    // returns n as a string (percentage)
    get fontSize() {
        return `${this.settings.fontSize}%`
    }

    set paddingTop(val) { this.settings.paddingTop = val }
    set paddingLeft(val) { this.settings.paddingLeft = val }
    set paddingRight(val) { this.settings.paddingRight = val }
    set paddingBottom(val) { this.settings.paddingBottom = val }

    // expects array of values
    set padding(values) {
        const [top, right, bottom, left] = values
        if (isNumeric(top)) this.settings.paddingTop = top
        if (isNumeric(right)) this.settings.paddingRight = right
        if (isNumeric(bottom)) this.settings.paddingBottom = bottom
        if (isNumeric(left)) this.settings.paddingLeft = left
    }

    set columns(val) { this.settings.columns = val }
    set columnGap(val) { this.settings.columnGap = val }
    set transition(val) { this.settings.transition = val }
    set transitionSpeed(val) { this.settings.transitionSpeed = val }
    set theme(val) { this.settings.theme = val }

    // stores vals as numbers
    set fontSize(val) {
        let val_ = val
        if (!isNumeric(val_)) val_ = parseFloat(val_, 10)
        this.settings.fontSize = val_
    }

    get(key = '') {
        if (!key) return this.settings
        return this.settings[key]
    }

    put(objectOrString = {}, val = null) {
        if (isPlainObject(objectOrString)) {
            const objectOrString_ = {...objectOrString}

            // TODO: this should be extracted and process other props
            if ({}.hasOwnProperty.call(objectOrString_, 'fontSize')) {
                if (!isNumeric(objectOrString_.fontSize)) objectOrString_.fontSize = parseFloat(objectOrString_.fontSize, 10)
            }

            const options = __extendExistingProps({}, ViewerSettings.defaults, objectOrString_)
            this.settings = {...this.settings, ...options}
            return
        }
        if (typeof objectOrString === 'string') {
            this.settings[objectOrString] = val
            return
        }

        console.error(`Invalid params: could not update settings`)

    }
}

export default ViewerSettings
