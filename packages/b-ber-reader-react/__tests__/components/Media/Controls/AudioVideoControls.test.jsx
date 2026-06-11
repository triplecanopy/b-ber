import { render } from '@testing-library/react'
import React from 'react'
import AudioVideoControls from '../../../../src/components/Media/Controls/AudioVideoControls'
import { MEDIA_PLAYBACK_RATES } from '../../../../src/constants'
import Viewport from '../../../../src/helpers/Viewport'

const baseProps = {
  config: 'normal',
  paused: true,
  pause: jest.fn(),
  play: jest.fn(),
  timeBack: jest.fn(),
  timeForward: jest.fn(),
  duration: 30,
  progress: 0,
  seek: jest.fn(),
  timeElapsed: '00:00',
  timeRemaining: '00:30',
  volume: 1,
  updateVolume: jest.fn(),
  volumeUp: jest.fn(),
  volumeDown: jest.fn(),
  toggleFullscreen: jest.fn(),
  loop: false,
  updateLoop: jest.fn(),
  currentSrc: 'media.mp4',
  playbackRate: MEDIA_PLAYBACK_RATES.NORMAL,
  playbackSlow: jest.fn(),
  playbackNormal: jest.fn(),
  playbackFast: jest.fn(),
}

describe('AudioVideoControls', () => {
  afterEach(() => jest.restoreAllMocks())

  beforeEach(() => {
    jest.spyOn(Viewport, 'isSingleColumn').mockReturnValue(false)
  })

  test('renders AudioControls when mediaType is "audio"', () => {
    const tree = render(<AudioVideoControls mediaType="audio" {...baseProps} />)

    expect(
      tree.container.querySelector('.bber-media__button__replay_30')
    ).not.toBeNull()
    expect(
      tree.container.querySelector('.bber-media__button__volume_up')
    ).not.toBeNull()
  })

  test('renders VideoControls when mediaType is not "audio"', () => {
    const tree = render(<AudioVideoControls mediaType="video" {...baseProps} />)

    expect(
      tree.container.querySelector('.bber-media__button__replay_30')
    ).toBeNull()
    expect(
      tree.container.querySelector('.bber-media__button__volume_up')
    ).not.toBeNull()
  })
})
