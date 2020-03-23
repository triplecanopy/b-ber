import React from 'react'
import classNames from 'classnames'
import AudioVideoControls from './AudioVideoControls'
import { MEDIA_PLAYBACK_RATES } from '../../../constants'

class MediaControls extends React.Component {
  playbackSlow = () => this.props.updatePlaybackRate(MEDIA_PLAYBACK_RATES.SLOW)

  playbackNormal = () =>
    this.props.updatePlaybackRate(MEDIA_PLAYBACK_RATES.NORMAL)

  playbackFast = () => this.props.updatePlaybackRate(MEDIA_PLAYBACK_RATES.FAST)

  render() {
    const { mediaType, config } = this.props

    if (!config) return null

    return (
      <div
        className={classNames(
          'media__controls',
          `media__controls--${mediaType}`,
          `media__controls--${config}`
        )}
      >
        <AudioVideoControls
          playbackSlow={this.playbackSlow}
          playbackNormal={this.playbackNormal}
          playbackFast={this.playbackFast}
          {...this.props}
        />
      </div>
    )
  }
}

export default MediaControls
