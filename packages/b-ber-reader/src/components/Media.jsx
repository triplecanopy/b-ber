import { Component } from 'react'
import Viewport from '../helpers/Viewport'

class Media extends Component {
    constructor(props) {
        super(props)

        this.state = {
            canPlay: false,
            autoPlay: this.props['data-autoplay'] || false,
            fullScreen: this.props['data-fullscreen']
                ? JSON.parse(this.props['data-fullscreen'])
                : false,
            paused: true,
            nodeSpreadIndex: 0,
        }

        this.handleOnCanPlay = this.handleOnCanPlay.bind(this)
        this.handleOnClick = this.handleOnClick.bind(this)
        this.play = this.play.bind(this)
        this.pause = this.pause.bind(this)

        this.getNodeSpreadIndex = this.getNodeSpreadIndex.bind(this)
        this.setNodeSpreadIndex = this.setNodeSpreadIndex.bind(this)
        this.handleUpdatedSpreadIndex = this.handleUpdatedSpreadIndex.bind(this)

        // TODO: should avoid firing on initial load, when spreadIndex === 0
        this.timer = null
        this.media = null
    }

    componentDidMount() {
        this.getNodeSpreadIndex()
    }

    componentWillReceiveProps() {
        window.clearTimeout(this.timer)
        this.timer = setTimeout(() => {
            const index = this.getNodeSpreadIndex()
            if (index !== this.state.nodeSpreadIndex) {
                this.setNodeSpreadIndex(index)
            }
            this.handleUpdatedSpreadIndex(index)
        }, this.context.transitionSpeed)
    }

    componentWillUnmount() {
        window.clearTimeout(this.timer)
    }

    getNodeSpreadIndex() {
        if (!this.media || !this.context) return

        const { x } = this.media.getBoundingClientRect()
        const { columnGap, translateX } = this.context
        const { fullScreen } = this.state
        const windowWidth = window.innerWidth

        let nodeSpreadIndex
        if (fullScreen) {
            nodeSpreadIndex = (x - translateX) / windowWidth
        } else {
            // TODO: should account for element offset (margins/padding)
            nodeSpreadIndex = Math.floor(
                (x - columnGap / 2 - translateX) / windowWidth,
            )
        }

        return nodeSpreadIndex
    }

    setNodeSpreadIndex(nodeSpreadIndex) {
        this.setState({ nodeSpreadIndex })
    }

    handleUpdatedSpreadIndex(index) {
        if (!this.state.autoPlay || Viewport.isMobile()) return

        const { spreadIndex } = this.context
        const { canPlay, paused } = this.state

        if (spreadIndex === index && paused && canPlay) {
            this.play()
        } else if (spreadIndex !== index && !paused) {
            this.pause()
        }
    }

    handleOnCanPlay() {
        this.setState({ canPlay: true })
    }
    handleOnClick() {
        if (!this.media || !this.state.canPlay) return
        if (this.media.paused) {
            this.play()
            return
        }

        this.pause()
    }
    play() {
        if (!this.media) return
        if (this.media.paused && this.state.canPlay) {
            this.media.play()
            this.setState({ paused: false })
        }
    }
    pause() {
        if (!this.media) return
        if (!this.media.paused && this.state.canPlay) {
            this.media.pause()
            this.setState({ paused: true })
        }
    }
}

export default Media
