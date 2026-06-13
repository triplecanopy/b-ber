import classNames from 'classnames'
import React from 'react'
import { MEDIA_PLAYBACK_RATES } from '../../../constants'
import AudioVideoControls from './AudioVideoControls'

// Props passed down from Media to the control tree. Every control component
// receives some subset of these via `{...props}` spreads.
export interface MediaControlsProps {
  config: string | null
  mediaType: string
  play: () => void
  pause: () => void
  timeForward: () => void
  timeBack: () => void
  updateVolume: (e: React.ChangeEvent<HTMLInputElement>) => void
  updateLoop: () => void
  updatePlaybackRate: (playbackRate: number) => void
  seek: (e: React.ChangeEvent<HTMLInputElement>) => void
  toggleFullscreen: () => void
  currentSrc: string
  currentTime: number
  duration: number
  progress: number
  timeElapsed: string
  timeRemaining: string
  paused: boolean
  playbackRate: number
  volume: number
  loop: boolean
}

// Playback-rate handlers are injected by MediaControls before forwarding props
// down the tree.
export interface MediaControlsChildProps extends MediaControlsProps {
  playbackSlow: () => void
  playbackNormal: () => void
  playbackFast: () => void
}

class MediaControls extends React.Component<MediaControlsProps> {
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
          'bber-media__controls',
          `bber-media__controls--${mediaType}`,
          `bber-media__controls--${config}`
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
