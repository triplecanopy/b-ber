import React from 'react'
import { MEDIA_PLAYBACK_RATES } from '../../..//constants'

const MediaButtonPlaybackRate = props => {
  switch (props.playbackRate) {
    case MEDIA_PLAYBACK_RATES.SLOW:
      return <button onClick={props.playbackNormal}>2x</button>
    case MEDIA_PLAYBACK_RATES.NORMAL:
      return <button onClick={props.playbackFast}>3x</button>
    case MEDIA_PLAYBACK_RATES.FAST:
      return <button onClick={props.playbackSlow}>1x</button>
    default:
      return null
  }
}

export default MediaButtonPlaybackRate
