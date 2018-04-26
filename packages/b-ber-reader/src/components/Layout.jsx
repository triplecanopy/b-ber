import React, {Component} from 'react'
import PropTypes from 'prop-types'
import debounce from 'lodash/debounce'
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
            columnGap: PropTypes.number.isRequired,
            transition: PropTypes.string.isRequired,
            transitionSpeed: PropTypes.number.isRequired,
            theme: PropTypes.string.isRequired,
        }).isRequired,
    }
    static childContextTypes = {
        height: cssHeightDeclarationPropType,
        columnGap: PropTypes.number,
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
            columnGap,
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

            columns: 2,
            columnGap,
            columnFill: 'auto',
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
            columnGap: this.state.columnGap,
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

    getFrameHeight() {
        if (Viewport.isMobile()) return 'auto'
        const {paddingTop, paddingBottom} = this.state

        let {height} = this.state
        if (!isNumeric(height)) height = window.innerHeight // make sure we're not treating 'auto' as a number

        return height - (paddingTop + paddingBottom)
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
        const {width} = this.state
        let translateX = 0
        if (!isMobile) translateX = (width * spreadIndex) * -1
        if (!isMobile) translateX = (translateX === 0 && Math.sign(1 / translateX) === -1) ? 0 : translateX // no -0

        const transform = `translateX(${translateX}px)`
        this.setState({transform, translateX})
    }

    render() {
        const height = this.getFrameHeight()
        const {pageAnimation} = this.props
        const {transition, transitionSpeed} = this.props.viewerSettings
        const transitionStyles = transitions({transitionSpeed})[transition]

        // don't animate if we're transitioning forward to a new chapter, or
        // following an internal link
        let styles = {...this.state}
        if (pageAnimation) styles = {...this.state, ...transitionStyles}

        return (
            <div
                id='layout'
                style={styles}
                ref={node => this.layoutNode = node}
            >
                <div
                    id='content'
                    style={{minHeight: height, padding: 0, margin: 0}}
                    ref={node => this.contentNode = node}
                >
                    <this.props.bookContent
                        {...this.props}
                        {...this.state}
                    />
                </div>
            </div>
        )
    }
}

export default Layout
