import React from 'react'
import PropTypes from 'prop-types'
import Media from './Media'

class Audio extends Media {
    static propTypes = {
        'data-autoplay': PropTypes.bool.isRequired,
    }
    static contextTypes = {
        spreadIndex: PropTypes.number,
        columnGap: PropTypes.number,
        translateX: PropTypes.number,
        paddingLeft: PropTypes.number,
        paddingRight: PropTypes.number,
    }

    render() {
        return (
            <audio // eslint-disable-line jsx-a11y/media-has-caption
                ref={node => (this.media = node)}
                onCanPlay={this.handleOnCanPlay}
                {...this.props}
            >
                {/* <track kind='captions' src='sampleCaptions.vtt' srcLang='en' /> */}
                {this.props.children}
            </audio>
        )
    }
}

export default Audio
