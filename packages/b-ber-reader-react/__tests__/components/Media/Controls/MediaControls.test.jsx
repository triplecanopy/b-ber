import { fireEvent, render } from '@testing-library/react'
import React from 'react'
import MediaControls from '../../../../src/components/Media/Controls/MediaControls'
import { MEDIA_PLAYBACK_RATES } from '../../../../src/constants'
import Viewport from '../../../../src/helpers/Viewport'

const baseProps = {
  mediaType: 'audio',
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
  loop: false,
  updateLoop: jest.fn(),
  currentSrc: 'media.mp3',
  playbackRate: MEDIA_PLAYBACK_RATES.NORMAL,
  updatePlaybackRate: jest.fn(),
}

describe('MediaControls', () => {
  afterEach(() => jest.restoreAllMocks())

  beforeEach(() => {
    jest.spyOn(Viewport, 'isSingleColumn').mockReturnValue(false)
  })

  test('renders nothing when config is falsy', () => {
    const tree = render(<MediaControls {...baseProps} config={undefined} />)

    expect(tree.container.innerHTML).toBe('')
  })

  test('renders the controls container with mediaType and config classes', () => {
    const tree = render(<MediaControls {...baseProps} config="normal" />)

    const wrapper = tree.container.querySelector('.bber-media__controls')

    expect(wrapper.classList.contains('bber-media__controls--audio')).toBe(true)
    expect(wrapper.classList.contains('bber-media__controls--normal')).toBe(
      true
    )
  })

  test('wires playbackSlow/Normal/Fast to updatePlaybackRate', () => {
    const updatePlaybackRate = jest.fn()

    const tree = render(
      <MediaControls
        {...baseProps}
        config="full"
        updatePlaybackRate={updatePlaybackRate}
        playbackRate={MEDIA_PLAYBACK_RATES.NORMAL}
      />
    )

    const rateButton = tree.container.querySelector(
      '.bber-button__media__playback-rate'
    )

    fireEvent.click(rateButton)

    expect(updatePlaybackRate).toHaveBeenCalledWith(MEDIA_PLAYBACK_RATES.FAST)
  })

  test('wires playbackSlow when playbackRate is fast', () => {
    const updatePlaybackRate = jest.fn()

    const tree = render(
      <MediaControls
        {...baseProps}
        config="full"
        updatePlaybackRate={updatePlaybackRate}
        playbackRate={MEDIA_PLAYBACK_RATES.FAST}
      />
    )

    const rateButton = tree.container.querySelector(
      '.bber-button__media__playback-rate'
    )

    fireEvent.click(rateButton)

    expect(updatePlaybackRate).toHaveBeenCalledWith(MEDIA_PLAYBACK_RATES.SLOW)
  })

  test('wires playbackNormal when playbackRate is slow', () => {
    const updatePlaybackRate = jest.fn()

    const tree = render(
      <MediaControls
        {...baseProps}
        config="full"
        updatePlaybackRate={updatePlaybackRate}
        playbackRate={MEDIA_PLAYBACK_RATES.SLOW}
      />
    )

    const rateButton = tree.container.querySelector(
      '.bber-button__media__playback-rate'
    )

    fireEvent.click(rateButton)

    expect(updatePlaybackRate).toHaveBeenCalledWith(MEDIA_PLAYBACK_RATES.NORMAL)
  })
})
