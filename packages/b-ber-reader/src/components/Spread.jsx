/* eslint-disable class-methods-use-this,no-mixed-operators,react/sort-comp */
import React, {Component} from 'react'
import PropTypes from 'prop-types'
import ResizeObserver from 'resize-observer-polyfill'
import debounce from 'lodash/debounce'
import {detect} from 'detect-browser'
import {debug} from '../config'
import {isNumeric} from '../helpers/Types'
import {cssHeightDeclarationPropType} from '../lib/custom-prop-types'

const browser = detect()


class Spread extends Component {
    static contextTypes = {
        height: cssHeightDeclarationPropType,
        paddingTop: PropTypes.number,
        paddingLeft: PropTypes.number,
        paddingBottom: PropTypes.number,
    }
    constructor(props) {
        super(props)

        this.state = {
            height: 0,
            verso: false,
            recto: false,
        }

        this.markerNode = null
        this.spreadNode = null
        this.figureNode = null
        this.debounceSpeed = 60

        this.getMarkerPosition = this.getMarkerPosition.bind(this)
        this.getMarkerDOMRect = this.getMarkerDOMRect.bind(this)
        this.calculateSpreadOffset = this.calculateSpreadOffset.bind(this)
        this.updateChildElementPositions = this.updateChildElementPositions.bind(this)
        this.connectResizeObserver = this.connectResizeObserver.bind(this)
        this.disconnectResizeObserver = this.disconnectResizeObserver.bind(this)
        this.debounceCalculateSpreadOffset = debounce(this.calculateSpreadOffset, this.debounceSpeed, {}).bind(this)
    }
    componentDidMount() {
        this.connectResizeObserver()
        this.attachNodes()
        if (browser.name !== 'chrome') {
            setTimeout(_ => this.updateChildElementPositions(), 1000)
        }
    }
    componentWillUnmount() {
        this.disconnectResizeObserver()
    }
    attachNodes() {
        const markerRefId = this.props['data-marker-reference']
        // console.log('--------markerRefId', markerRefId)
        this.markerNode = document.querySelector(`[data-marker="${markerRefId}"]`)
        this.figureNode = document.querySelector(`[data-marker-reference="${markerRefId}"] figure`)

        // console.log(this.markerNode)
        // console.log(this.figureNode)
    }
    getMarkerPosition() {
        let verso = false
        let recto = false

        if (!this.markerNode) {
            console.error(`Spread#getMarkerPosition: Unbound marker node for spread ${this.props['data-marker-reference']}`)
            return {verso, recto}
        }

        if (!this.markerNode.dataset || !this.markerNode.dataset.verso || !this.markerNode.dataset.recto) {
            console.warn(`Cannot get dataset from marker ${this.props['data-marker-reference']}`)
            return {verso, recto}
        }

        verso = JSON.parse(this.markerNode.dataset.verso)
        recto = JSON.parse(this.markerNode.dataset.recto)

        return {verso, recto}
    }
    getMarkerDOMRect() {
        if (!this.markerNode) {
            console.error(`Spread#getMarkerDOMRect: Unbound marker node for spread ${this.props['data-marker-reference']}`)
            return new window.DOMRect()
        }

        return this.markerNode.getBoundingClientRect()
    }
    connectResizeObserver() {
        const contentNode = document.querySelector('#content')
        if (!contentNode) return console.error(`Spread#connectResizeObserver: No #content node`)
        this.resizeObserver = new ResizeObserver(this.debounceCalculateSpreadOffset)
        this.resizeObserver.observe(contentNode)
    }
    disconnectResizeObserver() {
        this.resizeObserver.disconnect()
    }
    calculateSpreadOffset() {
        let {height} = this.context
        const {paddingTop, paddingBottom} = this.context
        const padding = paddingTop + paddingBottom

        height = isNumeric(height) ? (height * 2) - (padding * 2) : height
        if (isNumeric(height)) height -= 1 // nudge to prevent overflow onto next spread
        this.setState({height})
    }
    // TODO: shouldn't be parsing props with regex
    getPostionLeftFromMatrix() {
        return parseInt(
            window.getComputedStyle(document.getElementById('page'))
                .transform.replace(/(matrix\(|\))/, '')
                .split(',')
                .map(a => a.trim())[4]
            , 10)
    }
    updateChildElementPositions() {
        console.log('-- updateChildElementPositions')
        if (!this.figureNode) { // TODO
            console.log('no figure')
            this.attachNodes()
            // return setImmediate(_ => this.updateChildElementPositions())
        }

        const {innerWidth} = window
        const {verso, recto} = this.getMarkerPosition()
        const {x} = this.getMarkerDOMRect()
        const transformLeft = this.getPostionLeftFromMatrix()

        // TODO: figures should be added as React components during parsing stage
        if (verso) {
            console.log('----- verso')
            this.figureNode.style.left = `${x - transformLeft + innerWidth}px`
            this.figureNode.dataset.layout = 'verso'

            console.log(this.figureNode)
            console.log(x, transformLeft, innerWidth, `${x - transformLeft + innerWidth}px`)
        }
        if (recto) {
            this.figureNode.style.left = `${x - transformLeft + (innerWidth / 2)}px`
            this.figureNode.dataset.layout = 'recto'
        }
    }
    render() {
        const {height} = this.state
        const debugStyles = {background: 'beige'}

        // TODO: chrome's default behaviour sets the absolutely positioned
        // elements in relation to their parent containers, but this should be
        // updated for consistencey
        // if (browser.name !== 'chrome') this.updateChildElementPositions()

        let styles = {height}
        if (debug) styles = {...styles, ...debugStyles}

        return (
            <div
                {...this.props}
                style={styles}
                ref={node => this.spreadNode = node}
            >
                {this.props.children}
            </div>
        )
    }
}

export default Spread
