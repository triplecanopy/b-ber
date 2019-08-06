/* eslint-disable no-param-reassign,prefer-rest-params */

import debounce from 'lodash/debounce'
import ResizeObserver from 'resize-observer-polyfill'
import { isNumeric } from '../helpers/Types'
import { debug, verboseOutput, logTime } from '../config'
import browser from '../lib/browser'
import { ENSURE_RENDER_TIMEOUT, DEBOUNCE_TIMER } from '../constants'

const log = (lastSpreadIndex, contentDimensions, frameHeight, columns) => {
    if (debug && verboseOutput) {
        console.group('Layout#connectResizeObserver')
        console.log(
            'lastSpreadIndex: %d; contentDimensions: %d; frameHeight %d; columns %d',
            lastSpreadIndex,
            contentDimensions,
            frameHeight,
            columns
        ) // eslint-disable-line indent
        console.groupEnd()
    }
}

export default function observable(target) {
    const _componentWillMount = target.prototype.componentWillMount

    target.prototype.componentWillMount = function componentWillMount() {
        this.__observerableTimer = null
        this.__contentDimensions = 0
        this.__resizeObserver = null
        this.__mutationObserver = null

        if (_componentWillMount) _componentWillMount.call(this, arguments)
    }

    const _componentDidMount = target.prototype.componentDidMount
    target.prototype.componentDidMount = function componentDidMount() {
        this.calculateNodePositionAfterResize = debounce(this.calculateNodePosition, DEBOUNCE_TIMER, {
            leading: false,
            trailing: true,
        }).bind(this)

        this.calculateNodePositionAfterMutation = debounce(this.calculateNodePosition, DEBOUNCE_TIMER, {
            leading: false,
            trailing: true,
        }).bind(this)

        if (_componentDidMount) _componentDidMount.call(this, arguments)

        this.observe()
    }

    const _componentWillUnmount = target.prototype.componentWillUnmount
    target.prototype.componentWillUnmount = function componentWillUnmount() {
        this.unobserve()

        if (_componentWillUnmount) _componentWillUnmount.call(this, arguments)
    }

    target.prototype.connectResizeObserver = function connectResizeObserver() {
        if (!this.contentNode) throw new Error("Couldn't find this.contentNode")

        this.__resizeObserver = new ResizeObserver(this.calculateNodePositionAfterResize)
        this.__resizeObserver.observe(this.contentNode)
    }

    target.prototype.connectMutationObserver = function connectMutationObserver() {
        if (!this.contentNode) throw new Error("Couldn't find this.contentNode")

        this.__mutationObserver = new window.MutationObserver(this.calculateNodePositionAfterMutation)
        this.__mutationObserver.observe(this.contentNode, { attributes: true, subtree: true })
    }

    target.prototype.disconnectResizeObserver = function disconnectResizeObserver() {
        this.__resizeObserver.disconnect()
    }

    target.prototype.disconnectMutationObserver = function disconnectMutationObserver() {
        this.__mutationObserver.disconnect()
    }

    target.prototype.unobserveResizeObserver = function unobserveResizeObserver() {
        if (!this.contentNode) throw new Error("Couldn't find this.contentNode")
        this.__resizeObserver.unobserve(this.contentNode)
    }

    target.prototype.unobserveMutationObserver = function unobserveMutationObserver() {
        if (!this.contentNode) throw new Error("Couldn't find this.contentNode")
        this.__mutationObserver.disconnect(this.contentNode)
    }

    target.prototype.calculateNodePosition = function calculateNodePosition(/* entry */) {
        if (!this.contentNode) throw new Error("Couldn't find this.contentNode")

        const { columns } = this.state
        const lastNode = document.querySelector('.ultimate')

        let contentDimensions
        let lastSpreadIndex
        let frameHeight

        // TODO: prevent multiple callbacks. good to have this off for debug
        // if (this.props.ready === true) return

        if (logTime) console.time('observable#setReaderState')

        // height of the reader frame (viewport - padding top and bottom),
        // rounded so we get a clean divisor
        frameHeight = this.getFrameHeight()

        // getFrameHeight will return 'auto' for mobile. set to zero so that
        // chapter navigation still works
        if (!isNumeric(frameHeight)) frameHeight = 0

        // we need the width of the frame for calculations for FF
        const frameWidth = this.getFrameWidth()

        if (browser.name === 'firefox' && lastNode) {
            // FF only. we need to find the document height, but firefox
            // interprets our column layout as having width, so we measure the
            // distance of the left edge of the last node in our document, and
            // divide it by the number of columns
            contentDimensions = lastNode.offsetLeft + this.getSingleColumnWidth()
            lastSpreadIndex = Math.round(contentDimensions / frameWidth)
            lastSpreadIndex -= 1
        } else {
            contentDimensions = Math.max(
                this.contentNode.scrollHeight,
                this.contentNode.offsetHeight,
                this.contentNode.clientHeight
            )

            frameHeight = Math.round(frameHeight)

            // find the last index by dividing the document length by the frame
            // height, and then divide the result by 2 to account for the 2
            // column layout. Math.ceil to only allow whole numbers (each page
            // must have 2 columns), and to account for dangling lines of text
            // that will spill over to the next column (contentDimensions /
            // frameHeight in these cases will be something like 6.1 for a
            // six-page chapter). minus one since we want it to be a zero-based
            // index
            lastSpreadIndex = Math.ceil(contentDimensions / frameHeight / 2) - 1
        }

        // never less than 0
        lastSpreadIndex = lastSpreadIndex < 0 ? 0 : lastSpreadIndex

        log(lastSpreadIndex, contentDimensions, frameHeight, columns)

        // check that everything's been added to the DOM. if there's a disparity
        // in dimensions, or the node we use to measure width of the DOM isn't
        // available, then hide then show content to trigger our resize
        // observer's callback
        if (this.__contentDimensions !== contentDimensions || lastNode == null) {
            window.clearTimeout(this.timer)
            this.timer = setTimeout(() => {
                this.__contentDimensions = contentDimensions

                log(lastSpreadIndex, contentDimensions, frameHeight, columns)

                this.contentNode.style.display = 'none'
                this.contentNode.style.display = 'block'
            }, ENSURE_RENDER_TIMEOUT)
        } else {
            if (logTime) console.timeEnd('observable#setReaderState')
            this.props.setReaderState({ lastSpreadIndex, ready: true })
        }
    }

    target.prototype.observe = function observe() {
        this.connectResizeObserver()
        this.connectMutationObserver()
    }

    target.prototype.unobserve = function unobserve() {
        this.unobserveResizeObserver()
        this.unobserveMutationObserver()
    }

    target.prototype.disconnect = function disconnect() {
        this.disconnectResizeObserver()
        this.disconnectMutationObserver()
    }
}
