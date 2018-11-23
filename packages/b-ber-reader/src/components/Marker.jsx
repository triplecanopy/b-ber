import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ResizeObserver from 'resize-observer-polyfill'
import debounce from 'lodash/debounce'
import { isNumeric } from '../helpers/Types'
import { debug, verboseOutput } from '../config'
import Viewport from '../helpers/Viewport'
import { cssHeightDeclarationPropType } from '../lib/custom-prop-types'
import DocumentPreProcessor from '../lib/DocumentPreProcessor'

class Marker extends Component {
    static ELEMENT_EDGE_VERSO_MIN = 48
    static ELEMENT_EDGE_VERSO_MAX = 52
    static ELEMENT_EDGE_RECTO_MIN = 0
    static ELEMENT_EDGE_RECTO_MAX = 2

    static contextTypes = {
        height: cssHeightDeclarationPropType,
        paddingTop: PropTypes.number,
        paddingLeft: PropTypes.number,
        paddingBottom: PropTypes.number,
        columnGap: PropTypes.number,
        transitionSpeed: PropTypes.number,
        addRef: PropTypes.func,
    }

    constructor(props) {
        super(props)

        this.state = {
            verso: false,
            recto: false,
            x: 0,
            markerId: '',
            unbound: false,
        }

        this.updateRef = this.updateRef.bind(this)
        this.calculateNodePosition = this.calculateNodePosition.bind(this)
        this.calculateOffsetHeight = this.calculateOffsetHeight.bind(this)
        this.connectObservers = this.connectObservers.bind(this)
        this.disconnectObservers = this.disconnectObservers.bind(this)
        this.nodeEdgeIsInAllowableRange = this.nodeEdgeIsInAllowableRange.bind(
            this,
        )

        // refs
        this.contentNode = null // TODO: should be passed via props
        this.layoutNode = null // TODO: should be passed via props
        this.markerNode = null

        this.timer = null
        this.resizeObserver = null

        // callbacks
        this.calculateNodePositionAfterResize = () => ({})
    }

    updateRef() {
        const { recto, verso, x, markerId, unbound } = this.state
        this.context.addRef({
            recto,
            verso,
            x,
            markerId,
            unbound,
        })
    }

    componentDidMount() {
        this.calculateNodePosition()

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
            this.calculateNodePosition,
            0,
            {
                leading: false,
                trailing: true,
            },
        ).bind(this)

        this.calculateNodePosition()
        this.connectObservers()
    }

    componentWillUnmount() {
        this.disconnectObservers()
    }

    // eslint-disable-next-line class-methods-use-this
    nodeEdgeIsInAllowableRange(position, _position) {
        const result =
            (position >= Marker.ELEMENT_EDGE_VERSO_MIN &&
                position <= Marker.ELEMENT_EDGE_VERSO_MAX) ||
            (position >= Marker.ELEMENT_EDGE_RECTO_MIN &&
                position <= Marker.ELEMENT_EDGE_RECTO_MAX)

        if (debug && verboseOutput) {
            console.log(
                'Marker#nodeEdgeIsInAllowableRange Recalculating layout',
                position,
                _position,
            )
        }

        return result
    }

    calculateNodePosition(record = undefined) {
        if (!this.markerNode) return console.error('No marker node')

        const { paddingLeft, columnGap } = this.context
        const { x, width } = this.markerNode.getBoundingClientRect()

        // determine if the marker is verso or recto. we're testing whether the
        // marker's x offset is divisible by the window width. a remainder means
        // that the marker is positioned at 1/2 the page width, or 'recto'

        // here's the width of the layout's visible frame
        const layoutUnit = window.innerWidth - paddingLeft * 2 + columnGap

        // if a marker's edge is in the recto position, the sum of this operation will be 0
        const pageUnitRecto = x - columnGap - width - paddingLeft

        // get the decimal value of the recto unit over the visible frame, rounded to two
        const position = Number(
            (Math.abs(pageUnitRecto / layoutUnit) % 1).toFixed(2).substring(2),
        )

        // keep a reference of the original calculation for debugging
        const _position = Math.abs(pageUnitRecto / layoutUnit)

        // our calculations are precise enough to know that a marker's edge will
        // sit within 0.01px of the *left* edge of the visible frame if it's on
        // a verso column. we've effectively multiplied the decimal value by 10
        // above, and check against that sum
        const verso =
            position >= Marker.ELEMENT_EDGE_VERSO_MIN &&
            position <= Marker.ELEMENT_EDGE_VERSO_MAX
        const recto =
            position >= Marker.ELEMENT_EDGE_RECTO_MIN &&
            position <= Marker.ELEMENT_EDGE_RECTO_MAX

        // in the case that the marker's edge is *not* at 0, or within 0.01px
        // of the centre line (usually during browser resize, or as other
        // markers are shifting the DOM around) calculateNodePosition calls
        // itself recursively after a timeout.

        // TODO: there should be a guard in place to ensure that this doesn't
        // end up calling itself forever, but with a long enough timeout, and
        // given that the layout will likely be adjusted by the user (i.e.,
        // resizing the browser to adjust the broken layout, which will trigger
        // a reflow), the chances of a stack overflow are pretty minimal
        if (
            this.nodeEdgeIsInAllowableRange(position, _position) !== true ||
            (verso === false && recto === false)
        ) {
            console.log('node not in allowable range')
            clearTimeout(this.timer)
            this.timer = setTimeout(
                this.calculateNodePosition,
                this.context.transitionSpeed,
            )
        }

        if (debug && verboseOutput) {
            const initiator = String(record)
                .split(',')[0]
                .replace(/(\[object |\])/g, '')
                .replace(/Record/, 'Observer')
                .replace(/Entry/, '')
            const versoOrRecto = verso ? 'verso' : 'recto'
            console.group('Marker#calculateNodePosition')
            console.log(`Initiator: ${initiator}`)
            console.log(`Marker: ${this.markerNode.dataset.marker}`)
            console.log(`Layout: ${versoOrRecto}`)
            console.log('Record:', record)
            console.log(
                'position: %d, Computed Position: %d, DOMRect.x: %d, paddingLeft: %d',
                position,
                _position,
                x,
                paddingLeft,
            )
            console.groupEnd()
        }

        // TODO: may want to debounce this call, or write up 'swap' functions in
        // DocumentPreProcessor in case of flickering, but seems OK rn
        DocumentPreProcessor.removeStyleSheets()
        DocumentPreProcessor.createStyleSheets({ paddingLeft, columnGap })
        DocumentPreProcessor.appendStyleSheets()

        this.setState(
            {
                verso,
                recto,
                x,
                markerId: this.props['data-marker'],
                unbound: JSON.parse(this.props['data-unbound']),
            },
            this.updateRef,
        )
    }

    connectObservers() {
        this.resizeObserver = new ResizeObserver(
            this.calculateNodePositionAfterResize,
        )
        this.resizeObserver.observe(this.contentNode)
    }

    disconnectObservers() {
        clearTimeout(this.timer)
        this.resizeObserver.disconnect()
    }

    calculateOffsetHeight() {
        let offsetHeight = 0
        if (!this.layoutNode || !this.markerNode || Viewport.isMobile()) {
            return offsetHeight
        }

        const { verso, recto } = this.state
        const markerBottom = this.markerNode.getBoundingClientRect().bottom
        const { paddingTop, paddingBottom } = this.context
        const padding = paddingTop + paddingBottom

        let { height } = this.context
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

        if (JSON.parse(this.props['data-unbound']) === true) {
            offsetHeight /= 2
        }

        offsetHeight = Math.floor(offsetHeight)
        offsetHeight -= 1 // nudge
        return offsetHeight
    }

    render() {
        const { verso, recto } = this.state
        const offsetHeight = this.calculateOffsetHeight()

        const debugSpacerStyles = { background: 'coral' }
        const debugMarkerStyles = { backgroundColor: verso ? 'violet' : 'red' }

        let spacerStyles = {
            paddingBottom: offsetHeight,
            display: 'block',
        }
        if (debug) spacerStyles = { ...spacerStyles, ...debugSpacerStyles }

        let markerStyles = { ...this.props.style }
        if (debug) markerStyles = { ...markerStyles, ...debugMarkerStyles }

        return (
            <span>
                <span
                    {...this.props}
                    data-verso={verso}
                    data-recto={recto}
                    style={markerStyles}
                    ref={node => (this.markerNode = node)}
                />
                <span className="marker__spacer" style={spacerStyles} />
            </span>
        )
    }
}

export default Marker
