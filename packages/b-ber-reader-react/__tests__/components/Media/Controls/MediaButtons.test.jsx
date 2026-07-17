import { fireEvent, render } from '@testing-library/react'
import React from 'react'
import MediaButtonDownload from '../../../../src/components/Media/Controls/MediaButtonDownload'
import MediaButtonFullScreen from '../../../../src/components/Media/Controls/MediaButtonFullScreen'
import MediaButtonLoop from '../../../../src/components/Media/Controls/MediaButtonLoop'
import MediaButtonPlaybackRate from '../../../../src/components/Media/Controls/MediaButtonPlaybackRate'
import MediaButtonPlayPause from '../../../../src/components/Media/Controls/MediaButtonPlayPause'
import {
  MediaButtonSeekBack,
  MediaButtonSeekForward,
} from '../../../../src/components/Media/Controls/MediaButtonSeek'
import MediaButtonVolume from '../../../../src/components/Media/Controls/MediaButtonVolume'
import { MEDIA_PLAYBACK_RATES } from '../../../../src/constants'

describe('MediaButtonDownload', () => {
  test('renders a download link with the current source', () => {
    const tree = render(<MediaButtonDownload currentSrc="audio.mp3" />)
    const link = tree.container.querySelector('a')

    expect(link.getAttribute('href')).toBe('audio.mp3')
    expect(link.hasAttribute('download')).toBe(true)
    expect(tree.container).toMatchSnapshot()
  })
})

describe('MediaButtonFullScreen', () => {
  test('calls toggleFullscreen on click', () => {
    const toggleFullscreen = jest.fn()
    const tree = render(
      <MediaButtonFullScreen toggleFullscreen={toggleFullscreen} />
    )
    const button = tree.container.querySelector('button')

    fireEvent.click(button)

    expect(toggleFullscreen).toHaveBeenCalledTimes(1)
    expect(tree.container).toMatchSnapshot()
  })
})

describe('MediaButtonLoop', () => {
  test('calls updateLoop on click and toggles bber-hover class', () => {
    const updateLoop = jest.fn()

    let tree = render(<MediaButtonLoop loop={false} updateLoop={updateLoop} />)
    let button = tree.container.querySelector('button')

    expect(button.classList.contains('bber-hover')).toBe(false)

    fireEvent.click(button)
    expect(updateLoop).toHaveBeenCalledTimes(1)

    tree = render(<MediaButtonLoop loop={true} updateLoop={updateLoop} />)
    button = tree.container.querySelector('button')

    expect(button.classList.contains('bber-hover')).toBe(true)
  })
})

describe('MediaButtonPlaybackRate', () => {
  test('renders the slow rate and triggers playbackNormal', () => {
    const playbackSlow = jest.fn()
    const playbackNormal = jest.fn()
    const playbackFast = jest.fn()

    const tree = render(
      <MediaButtonPlaybackRate
        playbackRate={MEDIA_PLAYBACK_RATES.SLOW}
        playbackSlow={playbackSlow}
        playbackNormal={playbackNormal}
        playbackFast={playbackFast}
      />
    )

    const button = tree.container.querySelector('button')
    expect(button.textContent).toContain('0.5')

    fireEvent.click(button)
    expect(playbackNormal).toHaveBeenCalledTimes(1)
  })

  test('renders the normal rate and triggers playbackFast', () => {
    const playbackSlow = jest.fn()
    const playbackNormal = jest.fn()
    const playbackFast = jest.fn()

    const tree = render(
      <MediaButtonPlaybackRate
        playbackRate={MEDIA_PLAYBACK_RATES.NORMAL}
        playbackSlow={playbackSlow}
        playbackNormal={playbackNormal}
        playbackFast={playbackFast}
      />
    )

    const button = tree.container.querySelector('button')
    expect(button.textContent).toContain('1')

    fireEvent.click(button)
    expect(playbackFast).toHaveBeenCalledTimes(1)
  })

  test('renders the fast rate and triggers playbackSlow', () => {
    const playbackSlow = jest.fn()
    const playbackNormal = jest.fn()
    const playbackFast = jest.fn()

    const tree = render(
      <MediaButtonPlaybackRate
        playbackRate={MEDIA_PLAYBACK_RATES.FAST}
        playbackSlow={playbackSlow}
        playbackNormal={playbackNormal}
        playbackFast={playbackFast}
      />
    )

    const button = tree.container.querySelector('button')
    expect(button.textContent).toContain('1.5')

    fireEvent.click(button)
    expect(playbackSlow).toHaveBeenCalledTimes(1)
  })

  test('renders nothing for an unrecognized playback rate', () => {
    const tree = render(
      <MediaButtonPlaybackRate
        playbackRate={99}
        playbackSlow={jest.fn()}
        playbackNormal={jest.fn()}
        playbackFast={jest.fn()}
      />
    )

    expect(tree.container.innerHTML).toBe('')
  })
})

describe('MediaButtonPlayPause', () => {
  test('renders a play button when paused and calls play on click', () => {
    const play = jest.fn()
    const pause = jest.fn()

    const tree = render(
      <MediaButtonPlayPause paused={true} play={play} pause={pause} />
    )
    const button = tree.container.querySelector('button')

    expect(button.classList.contains('bber-media__button__play')).toBe(true)
    expect(button.querySelector('svg')).not.toBeNull()

    fireEvent.click(button)
    expect(play).toHaveBeenCalledTimes(1)
    expect(pause).not.toHaveBeenCalled()
  })

  test('renders a pause button when playing and calls pause on click', () => {
    const play = jest.fn()
    const pause = jest.fn()

    const tree = render(
      <MediaButtonPlayPause paused={false} play={play} pause={pause} />
    )
    const button = tree.container.querySelector('button')

    expect(button.classList.contains('bber-media__button__pause')).toBe(true)
    expect(button.querySelector('svg')).not.toBeNull()

    fireEvent.click(button)
    expect(pause).toHaveBeenCalledTimes(1)
    expect(play).not.toHaveBeenCalled()
  })
})

describe('MediaButtonSeek', () => {
  test('MediaButtonSeekForward calls timeForward on click', () => {
    const timeForward = jest.fn()
    const tree = render(<MediaButtonSeekForward timeForward={timeForward} />)
    const button = tree.container.querySelector('button')

    expect(button.classList.contains('bber-media__button__forward_30')).toBe(
      true
    )

    fireEvent.click(button)
    expect(timeForward).toHaveBeenCalledTimes(1)
  })

  test('MediaButtonSeekBack calls timeBack on click', () => {
    const timeBack = jest.fn()
    const tree = render(<MediaButtonSeekBack timeBack={timeBack} />)
    const button = tree.container.querySelector('button')

    expect(button.classList.contains('bber-media__button__replay_30')).toBe(
      true
    )

    fireEvent.click(button)
    expect(timeBack).toHaveBeenCalledTimes(1)
  })
})

describe('MediaButtonVolume', () => {
  test('toggles the open state and bber-open/bber-hover classes on click', () => {
    const updateVolume = jest.fn()

    const tree = render(
      <MediaButtonVolume volume={0.5} updateVolume={updateVolume} />
    )

    const button = tree.container.querySelector('button')
    const slider = tree.container.querySelector('.bber-slider__volume')

    expect(button.classList.contains('bber-media__button__volume_up')).toBe(
      true
    )
    expect(button.classList.contains('bber-hover')).toBe(false)
    expect(slider.classList.contains('bber-open')).toBe(false)

    fireEvent.click(button)

    expect(button.classList.contains('bber-hover')).toBe(true)
    expect(slider.classList.contains('bber-open')).toBe(true)

    fireEvent.click(button)

    expect(button.classList.contains('bber-hover')).toBe(false)
    expect(slider.classList.contains('bber-open')).toBe(false)
  })

  test('renders a MediaRangeSlider bound to the volume props', () => {
    const updateVolume = jest.fn()

    const tree = render(
      <MediaButtonVolume volume={0.25} updateVolume={updateVolume} />
    )

    const input = tree.container.querySelector('input[type="range"]')
    expect(input.value).toBe('0.25')

    fireEvent.change(input, { target: { value: '0.75' } })
    expect(updateVolume).toHaveBeenCalledTimes(1)
  })
})
