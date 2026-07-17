import classNames from 'classnames'
import React from 'react'
import { MEDIA_PLAYBACK_RATES } from '../../../constants'
import AudioVideoControls from './AudioVideoControls'
import type { MediaControlsProps } from './types'

function MediaControls(props: MediaControlsProps) {
  const { mediaType, config, updatePlaybackRate } = props

  const playbackSlow = () => updatePlaybackRate(MEDIA_PLAYBACK_RATES.SLOW)
  const playbackNormal = () => updatePlaybackRate(MEDIA_PLAYBACK_RATES.NORMAL)
  const playbackFast = () => updatePlaybackRate(MEDIA_PLAYBACK_RATES.FAST)

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
        playbackSlow={playbackSlow}
        playbackNormal={playbackNormal}
        playbackFast={playbackFast}
        {...props}
      />
    </div>
  )
}

export default MediaControls
