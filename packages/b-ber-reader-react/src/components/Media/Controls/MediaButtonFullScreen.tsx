import React from 'react'

interface MediaButtonFullScreenProps {
  toggleFullscreen: () => void
}

const MediaButtonFullScreen = (props: MediaButtonFullScreenProps) => (
  <button className="bber-button" onClick={props.toggleFullscreen}>
    toggleFullscreen
  </button>
)

export default MediaButtonFullScreen
