import React from 'react'
import { MEDIA_PLAYBACK_RATES } from '../../..//constants'

const MediaButtonPlaybackRate = props => {
  switch (props.playbackRate) {
    case MEDIA_PLAYBACK_RATES.SLOW:
      return (
        <button
          className="button__media__playback-rate"
          onClick={props.playbackNormal}
        >
          2<span className="times__media__playback-rate">&times;</span>
        </button>
      )
    case MEDIA_PLAYBACK_RATES.NORMAL:
      return (
        <button
          className="button__media__playback-rate"
          onClick={props.playbackFast}
        >
          3<span className="times__media__playback-rate">&times;</span>
        </button>
      )
    case MEDIA_PLAYBACK_RATES.FAST:
      return (
        <button
          className="button__media__playback-rate"
          onClick={props.playbackSlow}
        >
          1<span className="times__media__playback-rate">&times;</span>
        </button>
      )
    default:
      return null
  }
}

export default MediaButtonPlaybackRate
