import React, {Component} from 'react'
import PropTypes from 'prop-types'
import debounce from 'lodash/debounce'
import pick from 'lodash/pick'
import transitions from '../lib/transition-styles'
import Viewport from '../helpers/Viewport'
import {isNumeric} from '../helpers/Types'
import {cssHeightDeclarationPropType} from '../lib/custom-prop-types'
import observable from '../lib/decorate-observable'


@observable
class Layout extends Component {
    static propTypes = {
        viewerSettings: PropTypes.shape({
            paddingTop: PropTypes.number.isRequired,
            paddingLeft: PropTypes.number.isRequired,
            paddingBottom: PropTypes.number.isRequired,
            fontSize: PropTypes.string.isRequired,
            columnGapPage: PropTypes.number.isRequired,
            columnGapLayout: PropTypes.number.isRequired,
            transition: PropTypes.string.isRequired,
            transitionSpeed: PropTypes.number.isRequired,
            theme: PropTypes.string.isRequired,
        }).isRequired,
    }
    static childContextTypes = {
        height: cssHeightDeclarationPropType,
        columnGapPage: PropTypes.number,
        columnGapLayout: PropTypes.number,
        translateX: PropTypes.number,
        paddingTop: PropTypes.number,
        paddingLeft: PropTypes.number,
        paddingRight: PropTypes.number,
        paddingBottom: PropTypes.number,
        transitionSpeed: PropTypes.number,
    }
    constructor(props) {
        super(props)

        const {
            columnGapPage,
            columnGapLayout,
            paddingTop,
            paddingLeft,
            paddingRight,
            paddingBottom,
        } = this.props.viewerSettings

        this.state = {
            margin: 0,
            border: 0,
            paddingTop,
            paddingLeft,
            paddingRight,
            paddingBottom,
            boxSizing: 'border-box',

            width: 0,
            height: 0,
            transform: 'translateX(0)',
            translateX: 0,

            columnWidth: 'auto',
            columnCount: 2,
            columnGapPage,
            columnGapLayout,

            // we need to set this to 'balance' to preserve the mix of column
            // gaps. unfortunately, this means that our cols are all 'balanced',
            // when we'd actually like to have them set to 'auto'. we append a
            // spacer element as a react component that functions similarly to
            // the Spread component, which fills the space after the last
            // element in the layout to stretch the container to the full height
            // of the screen
            columnFill: 'balance',
        }

        this.debounceSpeed = 60
        this.contentNode = null
        this.layoutNode = null

        ::this.getFrameHeight
        ::this.updateDimensions
        ::this.updateTransform
        ::this.onResizeDone
        ::this.bindEventListeners
        ::this.unBindEventListeners

        this.handleResize = debounce(this.onResizeDone, this.debounceSpeed, {}).bind(this)

    }

    getChildContext() {
        return {
            height: this.state.height,
            columnGapPage: this.state.columnGapPage,
            columnGapLayout: this.state.columnGapLayout,
            translateX: this.state.translateX,
            paddingTop: this.state.paddingTop,
            paddingLeft: this.state.paddingLeft,
            paddingRight: this.state.paddingRight,
            paddingBottom: this.state.paddingBottom,
            transitionSpeed: this.props.viewerSettings.transitionSpeed,
        }
    }

    componentDidMount() {
        this.updateDimensions()
        this.updateTransform()
        this.bindEventListeners()
    }

    componentWillReceiveProps(nextProps) {
        const {spreadIndex} = nextProps
        this.updateTransform(spreadIndex)
    }

    componentWillUnmount() {
        this.unBindEventListeners()
    }

    onResizeDone() {
        this.updateDimensions()
        this.updateTransform()
    }

    getFrameHeight() { // eslint-disable-line class-methods-use-this
        if (Viewport.isMobile()) return 'auto'

        let {height} = this.state
        if (!isNumeric(height)) height = window.innerHeight // make sure we're not treating 'auto' as a number

        return height
    }

    bindEventListeners() {
        window.addEventListener('resize', this.handleResize, false)
    }

    unBindEventListeners() {
        window.removeEventListener('resize', this.handleResize, false)
    }

    updateDimensions() {
        const isMobile = Viewport.isMobile()
        const width = window.innerWidth
        const columns = isMobile ? 1 : 2
        const height = isMobile ? 'auto' : window.innerHeight
        this.setState({width, height, columns})
    }

    updateTransform(spreadIndex = 0) {
        const isMobile = Viewport.isMobile()
        const {paddingLeft, paddingRight, columnGapLayout, width} = this.state
        const gutter = width + ((paddingLeft + paddingRight) / 2) + columnGapLayout

        let translateX = 0
        if (!isMobile) translateX = (gutter * spreadIndex) * -1
        if (!isMobile) translateX = (translateX === 0 && Math.sign(1 / translateX) === -1) ? 0 : translateX // no -0

        const transform = `translateX(${translateX}px)`
        this.setState({transform, translateX})
    }

    pageStyles() {
        return {
            ...pick(this.state, [
                'margin',
                'border',
                'paddingTop',
                'paddingBottom',
                'boxSizing',
                'height',
                'transform',
            ]),

            // additional static styles
            columnGap: this.state.columnGapPage,
            columnCount: 1,
            columnWidth: 'auto',
        }
    }
    layoutStyles() {
        return {
            ...pick(this.state, [
                'margin',
                'border',
                'paddingLeft',
                'paddingRight',
                'boxSizing',
                'width',
                'columns',
                'columnFill',
            ]),

            columnGap: this.state.columnGapLayout,
        }
    }
    contentStyles() { // eslint-disable-line class-methods-use-this
        return {
            padding: 0,
            margin: 0,
        }
    }

    render() {
        const height = this.getFrameHeight()
        const {pageAnimation} = this.props
        const {transition, transitionSpeed} = this.props.viewerSettings
        const transitionStyles = transitions({transitionSpeed})[transition]

        // don't animate if we're transitioning forward to a new chapter, or
        // following an internal link
        let pageStyles = {...this.pageStyles(), height}
        if (pageAnimation) pageStyles = {...pageStyles, ...transitionStyles}

        const layoutStyles = {...this.layoutStyles()}
        const contentStyles = {...this.contentStyles(), minHeight: height}

        return (

            <div
                id='page'
                style={pageStyles}
            >
                <div
                    id='layout'
                    style={layoutStyles}
                    ref={node => this.layoutNode = node}
                >
                    <div
                        id='content'
                        style={contentStyles}
                        ref={node => this.contentNode = node}
                    >
                        <this.props.bookContent
                            {...this.props}
                            {...this.state}
                        />
                    </div>
                </div>
            </div>
        )
    }
}

export default Layout
