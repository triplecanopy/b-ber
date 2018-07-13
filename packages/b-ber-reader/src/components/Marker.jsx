import React, {Component} from 'react'
import PropTypes from 'prop-types'
import ResizeObserver from 'resize-observer-polyfill'
import debounce from 'lodash/debounce'
import {isNumeric} from '../helpers/Types'
import {debug, verboseOutput} from '../config'
import Viewport from '../helpers/Viewport'
import {cssHeightDeclarationPropType} from '../lib/custom-prop-types'
import DocumentPreProcessor from '../lib/DocumentPreProcessor'

class Marker extends Component {
    static ELEMENT_EDGE_VERSO = 50
    static ELEMENT_EDGE_VERSO_WITHIN_MARGIN_OF_ERROR = 49
    static ELEMENT_EDGE_RECTO = 0

    static contextTypes = {
        height: cssHeightDeclarationPropType,
        paddingTop: PropTypes.number,
        paddingLeft: PropTypes.number,
        paddingBottom: PropTypes.number,
        columnGap: PropTypes.number,
        transitionSpeed: PropTypes.number,
    }

    constructor(props) {
        super(props)

        this.state = {
            verso: null,
            recto: null,
        }

        this.calculateNodePosition = this.calculateNodePosition.bind(this)
        this.calculateOffsetHeight = this.calculateOffsetHeight.bind(this)
        this.removeParentOffsetBottom = this.removeParentOffsetBottom.bind(this)
        this.connectObservers = this.connectObservers.bind(this)
        this.disconnectObservers = this.disconnectObservers.bind(this)
        this.nodeEdgeIsInAllowableRange = this.nodeEdgeIsInAllowableRange.bind(this)

        // refs
        this.contentNode = null // TODO: should be passed via props
        this.layoutNode = null // TODO: should be passed via props
        this.markerNode = null

        this.timer = null
        this.resizeObserver = null

        // callbacks
        this.calculateNodePositionAfterResize = _ => ({})
    }

    componentDidMount() {
        this.contentNode = document.querySelector('#content')
        this.layoutNode = document.querySelector('#layout')

        // in a 2 column layout, we need to know whether a marker is positioned
        // verso or recto to force fullscreen elements into the correct
        // position. since our calculations below are based on the x position of
        // the marker, we need to ensure that its aligned at the left edge of
        // our containing element for accurate results (i.e., not undergoing a
        // transition).

        // ResizeObserver ensures that calculations run after the marker has
        // settled into the left-most position of the container
        this.calculateNodePositionAfterResize = debounce(
            // this.calculateNodePosition, this.context.transitionSpeed, {
            this.calculateNodePosition, 0, {
                leading: false,
                trailing: true,
            }
        ).bind(this)

        this.calculateNodePosition()
        this.connectObservers()
    }

    componentWillUnmount() {
        this.disconnectObservers()
    }

    // Remove a marker's parent's margin/padding-bottom instead of calculating
    // an offset. fixes FF issue where bottom distance is *always* appended to
    // the column after resizing
    removeParentOffsetBottom() {
        const parent = this.markerNode.parentNode.parentNode

        if (!parent) return
        if (debug) parent.style.backgroundColor = 'lightblue'

        parent.style.paddingBottom = 0
        parent.style.marginBottom = 0
    }

    nodeEdgeIsInAllowableRange(position, _position) { // eslint-disable-line class-methods-use-this
        const result = (position === Marker.ELEMENT_EDGE_VERSO || position === Marker.ELEMENT_EDGE_VERSO_WITHIN_MARGIN_OF_ERROR || position === Marker.ELEMENT_EDGE_RECTO)
        if (debug && verboseOutput) console.log('Marker#nodeEdgeIsInAllowableRange Recalculating layout', position, _position)
        return result
    }

    calculateNodePosition(record = undefined) {
        if (!this.markerNode) return console.error(`No marker node`)

        this.removeParentOffsetBottom()

        const {paddingLeft, columnGap} = this.context
        const {x, width} = this.markerNode.getBoundingClientRect()

        // determine if the marker is verso or recto. we're testing whether the
        // marker's x offset is divisible by our layout width (which is the same
        // as the window width). a remainder means that the marker is positioned
        // at 1/2 the page width, or 'recto'

        // here's the width of the layout's visible frame
        const layoutUnit = window.innerWidth - paddingLeft * 2 + columnGap // eslint-disable-line no-mixed-operators

        // if a marker's edge is in the recto position, the sum of this operation will be 0
        const pageUnitRecto = x - columnGap - width - paddingLeft

        // get the decimal value of the recto unit over the visible frame, rounded to two
        const position = Number((Math.abs(pageUnitRecto / layoutUnit) % 1).toFixed(2).substring(2))

        // keep a reference of the original calculation for debugging
        const _position = Math.abs(pageUnitRecto / layoutUnit)

        // our calculations are precise enough to know that a marker's edge will
        // sit within 0.01px of the *left* edge of the visible frame if it's on
        // a verso column. we've effectively multiplied the decimal value by 10
        // above, and check against that sum
        const verso = position === Marker.ELEMENT_EDGE_VERSO || position === Marker.ELEMENT_EDGE_VERSO_WITHIN_MARGIN_OF_ERROR
        const recto = !verso

        // in the case that the marker's edge is *not* at 0, or withing 0.01px
        // of the centre line (usually during browser resize, or as other
        // markers are shifting the DOM around) calculateNodePosition calls
        // itself recursively after a timeout.

        // TODO: there should be a guard in place to ensure that this doesn't
        // end up calling itself forever, but with a long enough timeout, and
        // given that the layout will likely be adjusted by the user (i.e.,
        // resizing the browser to adjust the broken layout, which will trigger
        // a reflow), the chances of a stack overflow are pretty minimal
        if (this.nodeEdgeIsInAllowableRange(position, _position) !== true) {
            clearTimeout(this.timer)
            this.timer = setTimeout(this.calculateNodePosition, this.context.transitionSpeed)
        }

        if (debug && verboseOutput) {
            const initiator = String(record).split(',')[0].replace(/(\[object |\])/g, '').replace(/Record/, 'Observer').replace(/Entry/, '')
            const versoOrRecto = verso ? 'verso' : 'recto'
            console.group(`Marker#calculateNodePosition`)
            console.log(`Initiator: ${initiator}`)
            console.log(`Marker: ${this.markerNode.dataset.marker}`)
            console.log(`Layout: ${versoOrRecto}`)
            console.log('Record:', record)
            console.log('position: %d, Computed Position: %d, DOMRect.x: %d, paddingLeft: %d', position, _position, x, paddingLeft)
            console.groupEnd()
        }

        // TODO: may want to debounce this call, or write up 'swap' functions in
        // DocumentPreProcessor in case of flickering, but seems OK rn
        DocumentPreProcessor.removeStyleSheets()
        DocumentPreProcessor.createStyleSheets({paddingLeft, columnGap})
        DocumentPreProcessor.appendStyleSheets()

        this.setState({verso, recto})
    }

    connectObservers() {
        this.resizeObserver = new ResizeObserver(this.calculateNodePositionAfterResize)
        this.resizeObserver.observe(this.contentNode)
    }

    disconnectObservers() {
        this.resizeObserver.disconnect()
    }

    calculateOffsetHeight() {
        let offsetHeight = 0
        if (!this.layoutNode || !this.markerNode || Viewport.isMobile()) return offsetHeight

        const {verso, recto} = this.state
        const markerBottom = this.markerNode.getBoundingClientRect().bottom
        const {paddingTop, paddingBottom} = this.context
        const padding = paddingTop + paddingBottom

        let {height} = this.context
        if (!isNumeric(height)) height = window.innerHeight

        if (verso) {
            offsetHeight = height
            offsetHeight *= 2
            offsetHeight -= padding
            offsetHeight -= padding / 2
            offsetHeight -= markerBottom
        }

        if (recto) {
            offsetHeight = height
            offsetHeight -= markerBottom
            offsetHeight -= padding / 2
        }

        return offsetHeight
    }

    render() {
        const {verso, recto} = this.state
        const offsetHeight = this.calculateOffsetHeight()

        const debugSpacerStyles = {background: 'coral'}
        const debugMarkerStyles = {backgroundColor: (verso ? 'violet' : 'red')}

        let spacerStyles = {paddingBottom: offsetHeight, display: 'block'}
        if (debug) spacerStyles = {...spacerStyles, ...debugSpacerStyles}

        let markerStyles = {...this.props.style}
        if (debug) markerStyles = {...markerStyles, ...debugMarkerStyles}

        return (
            <span>
                <span
                    {...this.props}
                    data-verso={verso}
                    data-recto={recto}
                    style={markerStyles}
                    ref={node => this.markerNode = node}
                />
                <span
                    className='marker__spacer'
                    style={spacerStyles}
                />
            </span>
        )
    }
}

export default Marker
