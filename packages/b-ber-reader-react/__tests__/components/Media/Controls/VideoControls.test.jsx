import { render } from '@testing-library/react'
import React from 'react'
import VideoControls from '../../../../src/components/Media/Controls/VideoControls'
import VideoControlsFull from '../../../../src/components/Media/Controls/VideoControlsFull'
import VideoControlsNormal from '../../../../src/components/Media/Controls/VideoControlsNormal'
import VideoControlsSimple from '../../../../src/components/Media/Controls/VideoControlsSimple'
import { MEDIA_PLAYBACK_RATES } from '../../../../src/constants'

const baseProps = {
  paused: true,
  pause: jest.fn(),
  play: jest.fn(),
  duration: 30,
  progress: 0,
  seek: jest.fn(),
  timeElapsed: '00:00',
  timeRemaining: '00:30',
  volumeUp: jest.fn(),
  volumeDown: jest.fn(),
  toggleFullscreen: jest.fn(),
  playbackRate: MEDIA_PLAYBACK_RATES.NORMAL,
  playbackSlow: jest.fn(),
  playbackNormal: jest.fn(),
  playbackFast: jest.fn(),
}

describe('VideoControlsSimple', () => {
  test('renders play/pause and a range slider', () => {
    const tree = render(<VideoControlsSimple {...baseProps} />)

    expect(tree.container.querySelector('button')).not.toBeNull()
    expect(tree.container.querySelector('input[type="range"]')).not.toBeNull()
  })
})

describe('VideoControlsNormal', () => {
  test('renders simple controls plus time, volume and fullscreen', () => {
    const tree = render(<VideoControlsNormal {...baseProps} />)

    expect(tree.container.querySelector('input[type="range"]')).not.toBeNull()
    expect(
      tree.container.querySelector('.bber-media__button__volume_up')
    ).not.toBeNull()
    expect(tree.container.textContent).toContain('toggleFullscreen')
  })
})

describe('VideoControlsFull', () => {
  test('renders normal controls; playback rate button is omitted because playbackRate is not forwarded', () => {
    const tree = render(<VideoControlsFull {...baseProps} />)

    // MediaButtonPlaybackRate falls through to its `default: return null`
    // branch here because VideoControlsFull does not forward `playbackRate`.
    expect(
      tree.container.querySelector('.bber-button__media__playback-rate')
    ).toBeNull()
    expect(
      tree.container.querySelector('.bber-media__button__volume_up')
    ).not.toBeNull()
  })
})

describe('VideoControls', () => {
  test('renders VideoControlsSimple when config is "simple"', () => {
    const tree = render(<VideoControls config="simple" {...baseProps} />)

    expect(tree.container.querySelector('input[type="range"]')).not.toBeNull()
    expect(
      tree.container.querySelector('.bber-media__button__volume_up')
    ).toBeNull()
  })

  test('renders VideoControlsNormal when config is "normal"', () => {
    const tree = render(<VideoControls config="normal" {...baseProps} />)

    expect(
      tree.container.querySelector('.bber-media__button__volume_up')
    ).not.toBeNull()
    expect(
      tree.container.querySelector('.bber-button__media__playback-rate')
    ).toBeNull()
  })

  test('renders VideoControlsFull for any other config', () => {
    const tree = render(<VideoControls config="full" {...baseProps} />)

    expect(
      tree.container.querySelector('.bber-media__button__volume_up')
    ).not.toBeNull()
    expect(
      tree.container.querySelector('.bber-media__button__fullscreen')
    ).toBeNull()
    expect(tree.container.textContent).toContain('toggleFullscreen')
  })
})
