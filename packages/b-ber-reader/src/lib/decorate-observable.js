/* eslint-disable no-param-reassign,prefer-rest-params */

import debounce from 'lodash/debounce'
import ResizeObserver from 'resize-observer-polyfill'
import { isNumeric } from '../helpers/Types'
import { debug, verboseOutput, logTime } from '../config'
import browser from '../lib/browser'

const ensureRenderTimeout = 0

const log = (spreadTotal, contentDimensions, frameHeight, columns) => {
    if (debug && verboseOutput) {
        console.group('Layout#connectResizeObserver')
        console.log(
            'spreadTotal: %d; contentDimensions: %d; frameHeight %d; columns %d',
            spreadTotal,
            contentDimensions,
            frameHeight,
            columns,
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
        const { transitionSpeed } = this.props.viewerSettings

        this.calculateNodePositionAfterResize = debounce(
            this.calculateNodePosition,
            transitionSpeed,
            {},
        ).bind(this)

        this.calculateNodePositionAfterMutation = debounce(
            this.calculateNodePosition,
            60,
            {
                leading: false,
                trailing: true,
            },
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
        if (!this.contentNode) throw new Error('Couldn\'t find this.contentNode')

        this.__resizeObserver = new ResizeObserver(
            this.calculateNodePositionAfterResize,
        )
        this.__resizeObserver.observe(this.contentNode)
    }

    target.prototype.connectMutationObserver = function connectMutationObserver() {
        if (!this.contentNode) throw new Error('Couldn\'t find this.contentNode')

        this.__mutationObserver = new window.MutationObserver(
            this.calculateNodePositionAfterMutation,
        )
        this.__mutationObserver.observe(this.contentNode, {
            attributes: true,
            subtree: true,
        })
    }

    target.prototype.disconnectResizeObserver = function disconnectResizeObserver() {
        this.__resizeObserver.disconnect()
    }

    target.prototype.disconnectMutationObserver = function disconnectMutationObserver() {
        this.__mutationObserver.disconnect()
    }

    target.prototype.unobserveResizeObserver = function unobserveResizeObserver() {
        if (!this.contentNode) throw new Error('Couldn\'t find this.contentNode')
        this.__resizeObserver.unobserve(this.contentNode)
    }

    target.prototype.unobserveMutationObserver = function unobserveMutationObserver() {
        if (!this.contentNode) throw new Error('Couldn\'t find this.contentNode')
        this.__mutationObserver.disconnect(this.contentNode)
    }

    target.prototype.calculateNodePosition = function calculateNodePosition(/*entry*/) {
        if (!this.contentNode) throw new Error('Couldn\'t find this.contentNode')

        const { columns, paddingLeft } = this.state

        let contentDimensions
        let columnCount
        let spreadTotal
        let spreadWidth
        let frameHeight

        if (this.props.ready === true) return

        if (logTime) console.time('observable#setReaderState')

        // FF only
        if (browser.name === 'firefox') {
            contentDimensions = this.contentNode.offsetWidth - paddingLeft * 2
            spreadWidth = window.innerWidth - paddingLeft * 2
            columnCount = contentDimensions / spreadWidth

            spreadTotal = Math.floor(columnCount)
        }
        else {
            contentDimensions = this.contentNode.offsetHeight
            frameHeight = this.getFrameHeight()

            // we need to return 0 for column count on mobile to ensure that
            // chapter navigation works
            let columnCount = contentDimensions / frameHeight
            if (!isNumeric(columnCount)) columnCount = 0

            spreadTotal = Math.floor(columnCount / columns)
        }

        log(spreadTotal, contentDimensions, frameHeight, columns)

        if (this.__contentDimensions !== contentDimensions) {
            window.clearTimeout(this.timer)
            this.timer = setTimeout(_ => {
                this.__contentDimensions = contentDimensions

                log(spreadTotal, contentDimensions, frameHeight, columns)

                this.contentNode.style.display = 'none'
                this.contentNode.style.display = 'block'
            }, ensureRenderTimeout)
        }
        else {
            if (logTime) console.timeEnd('observable#setReaderState')
            this.props.setReaderState({ spreadTotal, ready: true })
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
