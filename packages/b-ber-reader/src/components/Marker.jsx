import React, {Component} from 'react'
import PropTypes from 'prop-types'
import ResizeObserver from 'resize-observer-polyfill'
import debounce from 'lodash/debounce'
import {isNumeric, isInt, isFloat} from '../helpers/Types'
import {debug, verboseOutput} from '../config'
import Viewport from '../helpers/Viewport'
import {cssHeightDeclarationPropType} from '../lib/custom-prop-types'

class Marker extends Component {
    static contextTypes = {
        height: cssHeightDeclarationPropType,
        paddingTop: PropTypes.number,
        paddingLeft: PropTypes.number,
        paddingBottom: PropTypes.number,
        // columnGap: PropTypes.number,
        // translateX: PropTypes.number,
        transitionSpeed: PropTypes.number,
        requestDeferredCallbackExecution: PropTypes.func,
    }
    constructor(props) {
        super(props)

        this.state = {
            verso: null,
            recto: null,
            parentOffset: 0,
        }

        this.contentNode = null
        this.layoutNode = null
        this.markerNode = null
        this.resizeObserver = null
        this.mutationObserver = null

        this.calculateNodePosition = this.calculateNodePosition.bind(this)
        this.calculateOffsetHeight = this.calculateOffsetHeight.bind(this)
        this.getParentOffsetBottom = this.getParentOffsetBottom.bind(this)
        this.connectObservers = this.connectObservers.bind(this)
        this.disconnectObservers = this.disconnectObservers.bind(this)

        this.calculateNodePositionAfterResize = _ => ({})
        this.calculateNodePositionAfterMutation = _ => ({})
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
            this.calculateNodePosition, this.context.transitionSpeed, {}
        ).bind(this)

        // MutationObserver runs on nextTick, since we want to update the
        // position when the DOM changes, but know that the marker is aligned
        // with the containing element's edges
        this.calculateNodePositionAfterMutation = debounce(
            this.calculateNodePosition, 0, {}
        ).bind(this)

        // this.calculateNodePosition()
        this.connectObservers()
    }

    componentWillUnmount() {
        this.disconnectObservers()
    }

    getParentOffsetBottom() {
        let parentOffset = 0
        const parent = this.markerNode.parentNode.parentNode

        if (!parent) return parentOffset
        if (debug) parent.style.backgroundColor = 'lightblue'

        const style = window.getComputedStyle(parent)

        parentOffset += parseFloat(style.marginBottom, 10)
        parentOffset += parseFloat(style.paddingBottom, 10)

        return parentOffset
    }

    calculateNodePosition(record) {
        if (!this.markerNode) {
            console.error(`No marker node`)
            return
        }

        const {paddingLeft} = this.context
        const parentOffset = this.getParentOffsetBottom()

        const {x} = this.markerNode.getBoundingClientRect()
        // const {columnGap, translateX} = this.context
        const windowWidth = window.innerWidth
        const position = (x - paddingLeft) / windowWidth

        const verso = isInt(position)
        const recto = isFloat(position)

        if (debug && verboseOutput) {
            const initiator = String(record).split(',')[0].replace(/(\[object |\])/g, '').replace(/Record/, 'Observer').replace(/Entry/, '')
            const versoOrRecto = verso ? 'verso' : 'recto'
            console.group(`Marker#calculateNodePosition`)
            console.log(`Initiator: ${initiator}`)
            console.log(`Marker: ${this.markerNode.dataset.marker}`)
            console.log(`Layout: ${versoOrRecto}`)
            console.log('Records:', record)
            console.log('position: %d, DOMRect.x: %d, paddingLeft: %d; parentOffset: %d', position, x, paddingLeft, parentOffset)
            console.groupEnd()
        }

        this.setState({verso, recto, parentOffset})
        this.context.requestDeferredCallbackExecution()
    }

    connectObservers() {
        this.resizeObserver = new ResizeObserver(this.calculateNodePositionAfterResize)
        this.resizeObserver.observe(this.contentNode)

        this.mutationObserver = new window.MutationObserver(this.calculateNodePositionAfterMutation)
        this.mutationObserver.observe(this.contentNode, {attributes: true, subtree: true})
    }

    disconnectObservers() {
        this.resizeObserver.disconnect()
        this.mutationObserver.disconnect()
    }

    calculateOffsetHeight() {
        let offsetHeight = 0
        if (!this.layoutNode || !this.markerNode || Viewport.isMobile()) return offsetHeight

        const {verso, parentOffset} = this.state
        const markerBottom = this.markerNode.getBoundingClientRect().bottom

        let {height} = this.context
        if (!isNumeric(height)) height = window.innerHeight

        const {paddingTop, paddingBottom} = this.context
        const padding = paddingTop + paddingBottom

        offsetHeight = height
        if (verso) offsetHeight *= 2
        if (verso) offsetHeight -= padding
        offsetHeight -= padding / 2
        offsetHeight -= parentOffset
        offsetHeight -= markerBottom

        if (debug && verboseOutput) {
            console.group('Marker#calculateOffsetHeight')
            console.log('verso: %s; padding: %d; height: %d',
                         verso, padding, height) // eslint-disable-line indent
            console.log('parentOffset: %d; markerBottom: %d; offsetHeight: %d',
                         parentOffset, markerBottom, offsetHeight) // eslint-disable-line indent
            console.groupEnd()
        }

        return offsetHeight
    }

    render() {
        // TODO: the parentOffset should be a calculation of the distance
        // between the marker and the spread nodes, since we can't know the
        // additional spacing on the parent without walking back up the dom
        const {verso, recto, parentOffset} = this.state
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
                    data-offset={parentOffset}
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
