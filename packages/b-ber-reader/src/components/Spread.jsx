/* eslint-disable class-methods-use-this,no-mixed-operators,react/sort-comp */
import React, {Component} from 'react'
import PropTypes from 'prop-types'
import ResizeObserver from 'resize-observer-polyfill'
import debounce from 'lodash/debounce'
import {debug} from '../config'
import {isNumeric} from '../helpers/Types'
import {cssHeightDeclarationPropType} from '../lib/custom-prop-types'
import Messenger from '../lib/Messenger'
import {messagesTypes} from '../constants'
import browser from '../lib/browser'


class Spread extends Component {
    static contextTypes = {
        height: cssHeightDeclarationPropType,
        paddingTop: PropTypes.number,
        paddingLeft: PropTypes.number,
        paddingRight: PropTypes.number,
        paddingBottom: PropTypes.number,
    }
    constructor(props) {
        super(props)

        this.state = {
            height: 0,

            // verso and recto relate to the position of the marker node
            verso: false,
            recto: false,
        }

        this.markerNode = null
        this.spreadNode = null
        this.figureNode = null
        this.debounceSpeed = 60
        this.messageKey = null

        this.getMarkerPosition = this.getMarkerPosition.bind(this)
        this.getMarkerDOMRect = this.getMarkerDOMRect.bind(this)
        this.calculateSpreadOffset = this.calculateSpreadOffset.bind(this)
        this.updateChildElementPositions = this.updateChildElementPositions.bind(this)
        this.connectResizeObserver = this.connectResizeObserver.bind(this)
        this.disconnectResizeObserver = this.disconnectResizeObserver.bind(this)
        this.debounceCalculateSpreadOffset = debounce(this.calculateSpreadOffset, this.debounceSpeed, {}).bind(this)
    }
    componentWillMount() {

        // Adds listener for our 'ready' event that's fired in
        // decorate-observable.js. This is used to update the absolutely
        // positioned images in fullbleed panels which function properly on
        // Chrome, so we only need it for FF and Safari

        this.messageKey = Messenger.register(_ => {
            if (browser.name === 'chrome') return
            this.updateChildElementPositions()
        }, messagesTypes.DEFERRED_EVENT)
    }
    componentDidMount() {
        this.connectResizeObserver()
        this.attachNodes()

        // More x-browser compat.
        if (browser.name === 'chrome') return
        setImmediate(this.updateChildElementPositions)
    }
    componentWillUnmount() {
        this.disconnectResizeObserver()
        Messenger.deregister(this.messageKey)
    }
    attachNodes() {
        const markerRefId = this.props['data-marker-reference']
        this.markerNode = document.querySelector(`[data-marker="${markerRefId}"]`)
        this.figureNode = document.querySelector(`[data-marker-reference="${markerRefId}"] figure`)
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

        // TODO: this should be passed down via props, not picked from the DOM
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

        this.setState({height}, this.updateChildElementPositions)
    }

    getPostionLeftFromMatrix() {
        const matrix = window.getComputedStyle(document.querySelector('#layout'))
            .transform.replace(/(matrix\(|\))/, '')
            .split(',')
            .map(a => Number(a.trim()))

        return matrix[4]
    }

    // Spread#updateChildElementPositions lays out absolutely positioned images
    // over fullbleed placeholders for FF and Safari. This is Chrome's default
    // behaviour so we don't bother shifting anything around in that case
    updateChildElementPositions() {

        if (!this.figureNode) {

            // We call this function recursively on next tick since we know
            // there will be a figure node, but it may just not be available in
            // the DOM

            this.attachNodes()
            return setImmediate(this.updateChildElementPositions)
        }

        const {verso, recto} = this.getMarkerPosition()
        const {x} = this.getMarkerDOMRect()
        const transformLeft = this.getPostionLeftFromMatrix()

        let position = x - transformLeft + window.innerWidth

        if (recto) position -= window.innerWidth / 2

        position = `${position}px`


        // Only update figure's position if it's innaccurate
        if (this.figureNode.style.left !== position) this.figureNode.style.left = `${position}`
        if (verso && this.figureNode.dataset.layout !== 'verso') this.figureNode.dataset.layout = 'verso'
        if (recto && this.figureNode.dataset.layout !== 'recto') this.figureNode.dataset.layout = 'recto'

    }
    render() {
        const {height} = this.state
        const debugStyles = {background: 'beige'}

        // Cross-browser image layout
        // if (browser.name !== 'chrome')
        this.updateChildElementPositions()

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
