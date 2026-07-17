import type React from 'react'

// Shared prop types for the media-control tree. These live in a leaf module
// (not in MediaControls.tsx) so the child controls can import them without
// creating an import cycle back to their parent. (TASK-022)

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
