import PropTypes from 'prop-types'
import React from 'react'

class Media extends React.Component {
    static contextTypes = {
        spreadIndex: PropTypes.number,
        viewLoaded: PropTypes.bool,
        lastSpread: PropTypes.bool,
    }

    state = {
        autoPlay: this.props['data-autoplay'],
        paused: true,
    }

    componentWillReceiveProps(nextProps, nextContext) {
        // Play the media on spread change if autoplay is true
        if (!this.state.autoPlay) return

        // Don't play the media unless the chapter is visible
        if (!nextContext.viewLoaded) return

        const { paused } = this.state

        // Don't play the media unless it's sufficiently loaded
        if (this.props.elemRef.current.readyState < 3) return console.warn('Media not loaded')

        // b-ber jumps from spreadIndex n to 0 quickly and causes a blip before
        // the chapter changes, so account for that here
        if (nextContext.lastSpread && nextContext.spreadIndex === 0) return

        // Play the media if it's located on the current spread
        if (nextProps.spreadIndex === nextContext.spreadIndex && paused === true) {
            this.setState({ paused: false }, () => {
                // The `play` method returns a promise and errors out if the
                // user hasn't interacted with the page yet on Chrome and
                // Safari. This prevents the error, although it doesn't play the
                // media
                const p = this.props.elemRef.current.play()
                if (p) p.catch(() => {})
            })
        }

        // Otherwise pause the media
        if (nextProps.spreadIndex !== nextContext.spreadIndex && paused === false) {
            this.setState({ paused: true }, () => {
                this.props.elemRef.current.pause()
            })
        }
    }
}

export default Media
