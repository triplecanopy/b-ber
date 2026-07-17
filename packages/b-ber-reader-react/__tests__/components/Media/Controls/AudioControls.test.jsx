import { render } from '@testing-library/react'
import React from 'react'
import AudioControls from '../../../../src/components/Media/Controls/AudioControls'
import AudioControlsFull from '../../../../src/components/Media/Controls/AudioControlsFull'
import AudioControlsNormal from '../../../../src/components/Media/Controls/AudioControlsNormal'
import AudioControlsSimple from '../../../../src/components/Media/Controls/AudioControlsSimple'
import { MEDIA_PLAYBACK_RATES } from '../../../../src/constants'
import Viewport from '../../../../src/helpers/Viewport'

const baseProps = {
  paused: true,
  pause: jest.fn(),
  play: jest.fn(),
  timeBack: jest.fn(),
  timeForward: jest.fn(),
  loop: false,
  updateLoop: jest.fn(),
  playbackRate: MEDIA_PLAYBACK_RATES.NORMAL,
  playbackSlow: jest.fn(),
  playbackNormal: jest.fn(),
  playbackFast: jest.fn(),
  timeElapsed: '00:00',
  timeRemaining: '00:30',
  duration: 30,
  progress: 0,
  seek: jest.fn(),
  volume: 1,
  updateVolume: jest.fn(),
  currentSrc: 'audio.mp3',
}

describe('AudioControlsSimple', () => {
  test('renders play/pause, range slider and times', () => {
    const tree = render(<AudioControlsSimple {...baseProps} />)

    expect(tree.container.querySelector('button')).not.toBeNull()
    expect(tree.container.querySelector('input[type="range"]')).not.toBeNull()
    expect(tree.container.textContent).toContain('00:00')
    expect(tree.container.textContent).toContain('00:30')
  })
})

describe('AudioControlsNormal', () => {
  test('renders seek, play/pause, range slider, times and volume', () => {
    const tree = render(<AudioControlsNormal {...baseProps} />)

    expect(
      tree.container.querySelector('.bber-media__button__replay_30')
    ).not.toBeNull()
    expect(
      tree.container.querySelector('.bber-media__button__forward_30')
    ).not.toBeNull()
    expect(
      tree.container.querySelector('.bber-media__button__volume_up')
    ).not.toBeNull()
  })
})

describe('AudioControlsFull', () => {
  afterEach(() => jest.restoreAllMocks())

  test('renders the non-stacked layout when not single-column', () => {
    jest.spyOn(Viewport, 'isSingleColumn').mockReturnValue(false)

    const tree = render(<AudioControlsFull {...baseProps} />)

    expect(tree.container.querySelector('.bber-media__stacked')).toBeNull()
    expect(
      tree.container.querySelector('.media__button__file_download')
    ).not.toBeNull()
  })

  test('renders the stacked layout when single-column', () => {
    jest.spyOn(Viewport, 'isSingleColumn').mockReturnValue(true)

    const tree = render(<AudioControlsFull {...baseProps} />)

    expect(tree.container.querySelector('.bber-media__stacked')).not.toBeNull()
    expect(
      tree.container.querySelector('.bber-media__stacked__separator')
    ).not.toBeNull()
    expect(
      tree.container.querySelector('.media__button__file_download')
    ).not.toBeNull()
  })
})

describe('AudioControls', () => {
  afterEach(() => jest.restoreAllMocks())

  beforeEach(() => {
    jest.spyOn(Viewport, 'isSingleColumn').mockReturnValue(false)
  })

  test('renders AudioControlsSimple when config is "simple"', () => {
    const tree = render(<AudioControls config="simple" {...baseProps} />)

    expect(
      tree.container.querySelector('.bber-media__button__replay_30')
    ).toBeNull()
    expect(tree.container.querySelector('input[type="range"]')).not.toBeNull()
  })

  test('renders AudioControlsNormal when config is "normal"', () => {
    const tree = render(<AudioControls config="normal" {...baseProps} />)

    expect(
      tree.container.querySelector('.bber-media__button__replay_30')
    ).not.toBeNull()
    expect(
      tree.container.querySelector('.media__button__file_download')
    ).toBeNull()
  })

  test('renders AudioControlsFull for any other config', () => {
    const tree = render(<AudioControls config="full" {...baseProps} />)

    expect(
      tree.container.querySelector('.media__button__file_download')
    ).not.toBeNull()
  })
})
