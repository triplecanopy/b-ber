/* eslint-disable no-param-reassign,prefer-rest-params */

import debounce from 'lodash/debounce'
import {detect} from 'detect-browser'
import ResizeObserver from 'resize-observer-polyfill'
import {isNumeric} from '../helpers/Types'
import {debug, verboseOutput} from '../config'

export default function observable(target) {

    const browser = detect()
    const ensureRenderTimeout = 60

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

        const {transitionSpeed} = this.props.viewerSettings

        this.calculateNodePositionAfterResize = debounce(
            this.calculateNodePosition, transitionSpeed, {}
        ).bind(this)

        this.calculateNodePositionAfterMutation = debounce(
            this.calculateNodePosition, 60, {
                leading: false,
                trailing: true,
            }
        ).bind(this)

        if (_componentDidMount) _componentDidMount.call(this, arguments)

        this.observe()
    }

    const _componentWillUnmount = target.prototype.componentWillUnmount
    target.prototype.componentWillUnmount = function componentWillUnmount() {

        this.unobserve()

        if (_componentWillUnmount) _componentWillUnmount.call(this, arguments)
    }

    target.prototype.connectResizeObserver = function connectResizeObserver() {

        if (!this.contentNode) throw new Error(`Couldn't find this.contentNode`)

        this.__resizeObserver = new ResizeObserver(this.calculateNodePositionAfterResize)
        this.__resizeObserver.observe(this.contentNode)
    }

    target.prototype.connectMutationObserver = function connectMutationObserver() {

        if (!this.contentNode) throw new Error(`Couldn't find this.contentNode`)

        this.__mutationObserver = new window.MutationObserver(this.calculateNodePositionAfterMutation)
        this.__mutationObserver.observe(this.contentNode, {attributes: true, subtree: true})
    }

    target.prototype.disconnectResizeObserver = function disconnectResizeObserver() {
        this.__resizeObserver.disconnect()
    }

    target.prototype.disconnectMutationObserver = function disconnectMutationObserver() {
        this.__mutationObserver.disconnect()
    }

    target.prototype.unobserveResizeObserver = function unobserveResizeObserver() {
        if (!this.contentNode) throw new Error(`Couldn't find this.contentNode`)
        this.__resizeObserver.unobserve(this.contentNode)
    }

    target.prototype.unobserveMutationObserver = function unobserveMutationObserver() {
        if (!this.contentNode) throw new Error(`Couldn't find this.contentNode`)
        this.__mutationObserver.disconnect(this.contentNode)
    }

    target.prototype.calculateNodePosition = function calculateNodePosition(/*entry*/) {
        if (!this.contentNode) throw new Error(`Couldn't find this.contentNode`)

        if (browser.name === 'firefox') {
            const contentWidth = this.contentNode.offsetWidth

            console.log('contentWidth', contentWidth)

            const spreadWidth = window.innerWidth
            console.log('spreadWidth', spreadWidth)

            const columnCount = contentWidth / spreadWidth
            console.log('columnCount', columnCount)

            const spreadTotal = Math.floor(columnCount) - 1 // TODO: allow for extra column needed for 'balance' CSS property
            console.log('spreadTotal', spreadTotal)

            // we force FF to re-render if contentWidth has changed to ensure
            // we're getting the latest values
            if (this.__contentDimensions !== contentWidth) {
                window.clearTimeout(this.timer)
                this.timer = setTimeout(_ => {
                    this.__contentDimensions = contentWidth
                    this.contentNode.style.display = 'none'
                    this.contentNode.style.display = 'block'
                }, ensureRenderTimeout)
            }
            else {
                this.props.setReaderState({spreadTotal, ready: true})
            }

        }
        else {
            const {columns} = this.state
            const contentHeight = this.contentNode.offsetHeight
            const frameHeight = this.getFrameHeight()

            // we need to return 0 for column count on mobile to ensure that
            // chapter navigation works
            let columnCount = contentHeight / frameHeight
            if (!isNumeric(columnCount)) columnCount = 0

            const spreadTotal = Math.floor(columnCount / columns) - 1 // TODO: allow for extra column needed for 'balance' CSS property

            if (debug && verboseOutput) {
                console.group('Layout#connectResizeObserver')
                console.log('spreadTotal: %d; contentHeight: %d; frameHeight %d; columns %d',
                                spreadTotal, contentHeight, frameHeight, columns) // eslint-disable-line indent
                console.groupEnd()
            }

            if (this.__contentDimensions !== contentHeight) {
                window.clearTimeout(this.timer)
                this.timer = setTimeout(_ => {
                    this.__contentDimensions = contentHeight
                    this.contentNode.style.display = 'none'
                    this.contentNode.style.display = 'block'
                }, ensureRenderTimeout)
            }
            else {
                this.props.setReaderState({spreadTotal, ready: true})
            }

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
