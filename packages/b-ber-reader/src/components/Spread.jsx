/* eslint-disable class-methods-use-this,react/sort-comp */
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ResizeObserver from 'resize-observer-polyfill'
import debounce from 'lodash/debounce'
import { debug } from '../config'
import { isNumeric } from '../helpers/Types'
import { cssHeightDeclarationPropType } from '../lib/custom-prop-types'
import Messenger from '../lib/Messenger'
import { messagesTypes } from '../constants'
// import browser from '../lib/browser'
import Viewport from '../helpers/Viewport'

const SpreadStyleBlock = props => {
    const { spreadPosition, markerRefId, unbound, paddingLeft } = props
    const offsetLeftPrevious = unbound ? 0 : paddingLeft * 2
    const offsetLeftCurrent = unbound ? paddingLeft * 2 : 0
    const offsetLeftNext = unbound ? paddingLeft * -2 : paddingLeft * -2

    // prettier-ignore
    const styles = `
        .spread-index__${spreadPosition - 2} #spread__${markerRefId} > figure,
        .spread-index__${spreadPosition - 2} #spread__${markerRefId} > .spread__content,
        .spread-index__${spreadPosition - 1} #spread__${markerRefId} > figure,
        .spread-index__${spreadPosition - 1} #spread__${markerRefId} > .spread__content { transform: translateX(${offsetLeftPrevious}px); }
        .spread-index__${spreadPosition}     #spread__${markerRefId} > figure,
        .spread-index__${spreadPosition}     #spread__${markerRefId} > .spread__content { transform: translateX(${offsetLeftCurrent}px); }
        .spread-index__${spreadPosition + 1} #spread__${markerRefId} > figure,
        .spread-index__${spreadPosition + 1} #spread__${markerRefId} > .spread__content,
        .spread-index__${spreadPosition + 2} #spread__${markerRefId} > figure,
        .spread-index__${spreadPosition + 2} #spread__${markerRefId} > .spread__content { transform: translateX(${offsetLeftNext}px); }
    `
    return <style>{Viewport.isMobile() ? null : styles}</style>
}

class Spread extends Component {
    static contextTypes = {
        height: cssHeightDeclarationPropType,
        paddingTop: PropTypes.number,
        paddingLeft: PropTypes.number,
        paddingRight: PropTypes.number,
        paddingBottom: PropTypes.number,
        columnGap: PropTypes.number,
        refs: PropTypes.object,
    }
    static childContextTypes = {
        left: PropTypes.string,
        transform: PropTypes.string,
        recto: PropTypes.bool,
        verso: PropTypes.bool,
    }
    constructor(props) {
        super(props)

        this.state = {
            height: 0,

            // verso and recto relate to the position of the marker node
            verso: false,
            recto: false,
            left: '',
            transform: '',

            spreadPosition: 0,
            marker: {
                verso: false,
                recto: false,
                x: 0,
                markerId: '',
                unbound: false,
            },
        }

        this.debounceSpeed = 60
        this.messageKey = null

        this.calculateSpreadOffset = this.calculateSpreadOffset.bind(this)
        this.updateChildElementPositions = this.updateChildElementPositions.bind(
            this,
        )
        this.connectResizeObserver = this.connectResizeObserver.bind(this)
        this.disconnectResizeObserver = this.disconnectResizeObserver.bind(this)
        this.debounceCalculateSpreadOffset = debounce(
            this.calculateSpreadOffset,
            this.debounceSpeed,
            {},
        ).bind(this)
    }
    getChildContext() {
        return {
            left: this.state.left,
            transform: this.state.transform,
            recto: this.state.recto,
            verso: this.state.verso,
        }
    }
    componentWillReceiveProps(_, nextContext) {
        const markerRefId = this.props['data-marker-reference']
        if (nextContext.refs[markerRefId]) {
            console.log(
                'Spread#componentWillReceiveProps tests nextProps.marker',
            )

            const { verso, recto, x, markerId, unbound } = nextContext.refs[
                markerRefId
            ]

            if (
                verso !== this.state.marker.verso ||
                recto !== this.state.marker.recto ||
                x !== this.state.marker.x ||
                markerId !== this.state.marker.markerId ||
                unbound !== this.state.marker.unbound
            ) {
                console.log(
                    'Spread#componentWillReceiveProps updates nextProps.marker',
                )
                this.setState(
                    { marker: nextContext.refs[markerRefId] },
                    this.updateChildElementPositions,
                )
            }
        }
    }
    componentWillMount() {
        // Adds listener for our 'ready' event that's fired in
        // decorate-observable.js. This is used to update the absolutely
        // positioned images in fullbleed panels which function properly on
        // Chrome, so we only need it for FF and Safari
        this.messageKey = Messenger.register(() => {
            // if (browser.name === 'chrome') return
            this.updateChildElementPositions()
        }, messagesTypes.DEFERRED_EVENT)
    }
    componentDidMount() {
        this.connectResizeObserver()
        // More x-browser compat.
        // if (browser.name === 'chrome') return
        setImmediate(this.updateChildElementPositions)
    }
    componentWillUnmount() {
        this.disconnectResizeObserver()
        Messenger.deregister(this.messageKey)
    }
    connectResizeObserver() {
        const contentNode = document.querySelector('#content')
        if (!contentNode) {
            return console.error(
                'Spread#connectResizeObserver: No #content node',
            )
        }
        this.resizeObserver = new ResizeObserver(
            this.debounceCalculateSpreadOffset,
        )
        this.resizeObserver.observe(contentNode)
    }
    disconnectResizeObserver() {
        this.resizeObserver.disconnect()
    }
    calculateSpreadOffset() {
        let { height } = this.context
        const { paddingTop, paddingBottom } = this.context
        const padding = paddingTop + paddingBottom

        height = isNumeric(height) ? height * 2 - padding * 2 : height
        if (isNumeric(height)) height -= 1 // nudge to prevent overflow onto next spread

        if (this.state.marker.unbound === true) {
            height = height / 2 - 1
        }

        this.setState({ height }, this.updateChildElementPositions)
    }

    getPostionLeftFromMatrix() {
        const matrix = window
            .getComputedStyle(document.querySelector('#layout'))
            .transform.replace(/(matrix\(|\))/, '')
            .split(',')
            .map(a => Number(a.trim()))

        return matrix[4]
    }

    // Spread#updateChildElementPositions lays out absolutely positioned images
    // over fullbleed placeholders for FF and Safari. This is Chrome's default
    // behaviour so we don't bother shifting anything around in that case
    updateChildElementPositions() {
        const { verso, recto, x, unbound } = this.state.marker
        // set this after loading to prevent figures drifing around on initial page load
        // TODO: should be passing in transition speed
        // @issue: https://github.com/triplecanopy/b-ber/issues/216
        const transform = 'transition: transform 400ms ease'
        const transformLeft = this.getPostionLeftFromMatrix()

        const width = window.innerWidth
        const { paddingLeft, paddingRight, columnGap } = this.context
        const layoutWidth = width - paddingLeft - paddingRight + columnGap // not sure why we're adding columnGap in here ...
        const spreadPosition = Math.ceil((x - transformLeft) / width)

        let left = 0

        if (!Viewport.isMobile()) {
            left = layoutWidth * spreadPosition
            if (recto) left -= layoutWidth / 2
            if (unbound) left = 0
        } else {
            left = 0
        }

        left = `${left}px`

        this.setState({
            left,
            recto,
            verso,
            transform,
            spreadPosition,
        })
    }

    render() {
        const { height, spreadPosition } = this.state
        const markerRefId = this.props['data-marker-reference']
        const { unbound } = this.state.marker
        const { paddingLeft } = this.context

        const debugStyles = { background: 'beige' }

        let styles = { height }
        if (debug) styles = { ...styles, ...debugStyles }

        return (
            <div
                {...this.props}
                id={`spread__${this.props['data-marker-reference']}`}
                style={styles}
            >
                <SpreadStyleBlock
                    markerRefId={markerRefId}
                    spreadPosition={spreadPosition}
                    unbound={unbound}
                    paddingLeft={paddingLeft}
                />
                {this.props.children}
            </div>
        )
    }
}

export default Spread
