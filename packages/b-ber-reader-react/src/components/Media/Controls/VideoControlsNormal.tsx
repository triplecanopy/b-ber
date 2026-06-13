import React from 'react'
import MediaButtonFullScreen from './MediaButtonFullScreen'
import MediaButtonVolume from './MediaButtonVolume'
import type { MediaControlsChildProps } from './MediaControls'
import MediaTime from './MediaTime'
import VideoControlsSimple from './VideoControlsSimple'

type VideoControlsNormalProps = Omit<
  MediaControlsChildProps,
  'mediaType' | 'config'
>

// TODO: type these props properly. Pre-existing bugs carried verbatim from the
// JS: MediaTime accepts `time` (not `timeElapsed`/`timeRemaining`) and
// MediaButtonVolume expects `volume`/`updateVolume` (not `volumeUp`/`volumeDown`,
// which are also absent from props). These props are no-ops at runtime; casting
// the components to `any` preserves that behavior without relaxing the types.
const MediaTimeUntyped = MediaTime as any
const MediaButtonVolumeUntyped = MediaButtonVolume as any

const VideoControlsNormal = (props: VideoControlsNormalProps) => (
  <>
    <VideoControlsSimple {...props} />
    <MediaTimeUntyped
      timeElapsed={props.timeElapsed}
      timeRemaining={props.timeRemaining}
    />
    <MediaButtonVolumeUntyped
      volumeUp={(props as any).volumeUp}
      volumeDown={(props as any).volumeDown}
    />
    <MediaButtonFullScreen toggleFullscreen={props.toggleFullscreen} />
  </>
)

export default VideoControlsNormal
