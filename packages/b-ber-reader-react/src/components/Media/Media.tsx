import React from 'react'
import { MEDIA_CONTROLS_PRESETS } from '../../constants'
import useNodePosition from '../../hooks/use-node-position'
import MediaControls from './Controls/MediaControls'
import { useMediaPlayer } from './useMediaPlayer'

interface MediaProps {
  MediaComponent: React.ComponentType<any>
  mediaType: string
  autoPlay?: boolean
  controls?: string
  // Remaining HTML5 media attributes (id, src, data-* etc.) are spread through.
  [key: string]: any
}

function Media(props: MediaProps) {
  // useNodePosition supplies the media element ref and the spread the element
  // sits on; the latter drives autoplay-on-page-change in useMediaPlayer.
  const { elemRef, spreadIndex } = useNodePosition<HTMLMediaElement>({
    useParentDimensions: true,
  })

  const player = useMediaPlayer({
    ...props,
    elemRef: elemRef as React.RefObject<HTMLMediaElement>,
    spreadIndex,
  })

  const {
    MediaComponent,
    mediaType,
    autoPlay,
    controls: controlsAttribute,

    // `rest` includes React.Children, and the HTML5 media attributes except
    // `controls` and `autoPlay` since those are handled internally.
    ...rest
  } = props

  // MediaControls overrides the browser's default controls for media
  // elements. The UI is configured by passing in one of the options below.
  // The UI config option (simple, normal or full) must be passed in via the
  // `controls` attribute on the media element.
  //
  // If the `controls` attribute is not present on the media element, the
  // controls are completely hidden. If the controls element is anything other
  // than one of the options below, the default browser controls UI is shown.
  //
  // Audio
  //  'simple'
  //     - play/pause button
  //     - progress bar
  //  'normal'
  //     - play/pause button
  //     - progress bar
  //     - time elapsed/remaining
  //     - skip ahead/skip back buttons
  //     - volume controls
  //     - download button
  //  'full'
  //     - play/pause button
  //     - progress bar
  //     - time elapsed/remaining
  //     - skip ahead/skip back buttons
  //     - volume controls
  //     - download button
  //     - loop button
  //     - playback speed
  //
  // Video
  //  'simple'
  //     - play/pause button
  //     - progress bar
  //  'normal'
  //     - play/pause button
  //     - progress bar
  //     - time elapsed/remaining
  //     - volume controls
  //     - fullscreen button
  //  'full'
  //     - play/pause button
  //     - progress bar
  //     - time elapsed/remaining
  //     - volume controls
  //     - fullscreen button
  //     - playback speed

  let config: string | null = null
  let controls = true

  if (!controlsAttribute) {
    controls = false
  } else if (MEDIA_CONTROLS_PRESETS.has(controlsAttribute)) {
    config = controlsAttribute
    controls = false
  }

  return (
    <>
      <MediaComponent
        elementKey={rest.id}
        elementRef={elemRef}
        handleLoad={player.handleLoad}
        handleEnded={player.handleEnded}
        controls={controls}
        {...rest}
      />
      <MediaControls
        config={config}
        mediaType={mediaType}
        play={player.play}
        pause={player.pause}
        timeForward={player.timeForward}
        timeBack={player.timeBack}
        updateVolume={player.updateVolume}
        updateLoop={player.updateLoop}
        updatePlaybackRate={player.updatePlaybackRate}
        seek={player.seek}
        toggleFullscreen={player.toggleFullscreen}
        currentSrc={player.state.currentSrc}
        currentTime={player.state.currentTime}
        duration={player.state.duration}
        progress={player.state.progress}
        timeElapsed={player.state.timeElapsed}
        timeRemaining={player.state.timeRemaining}
        paused={player.state.paused}
        playbackRate={player.state.playbackRate}
        volume={player.state.volume}
        loop={player.state.loop}
      />
    </>
  )
}

export default Media
