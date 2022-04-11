import React from 'react'
import { MEDIA_PLAYBACK_RATES } from '../../../constants'

function MediaButtonPlaybackRate(props) {
  switch (props.playbackRate) {
    case MEDIA_PLAYBACK_RATES.SLOW:
      return (
        <button
          className="bber-button bber-button__media__playback-rate"
          onClick={props.playbackNormal}
        >
          0.5<span className="bber-times__media__playback-rate">&times;</span>
        </button>
      )
    case MEDIA_PLAYBACK_RATES.NORMAL:
      return (
        <button
          className="bber-button bber-button__media__playback-rate"
          onClick={props.playbackFast}
        >
          1<span className="bber-times__media__playback-rate">&times;</span>
        </button>
      )
    case MEDIA_PLAYBACK_RATES.FAST:
      return (
        <button
          className="bber-button bber-button__media__playback-rate"
          onClick={props.playbackSlow}
        >
          1.5<span className="bber-times__media__playback-rate">&times;</span>
        </button>
      )
    default:
      return null
  }
}

export default MediaButtonPlaybackRate
