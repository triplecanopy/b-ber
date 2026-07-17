import { render } from '@testing-library/react'
import React from 'react'
import VimeoPosterImage from '../../../src/components/Media/VimeoPosterImage'

describe('VimeoPosterImage', () => {
  test('renders nothing when src is not provided', () => {
    const tree = render(
      <VimeoPosterImage src={null} playing={false} controls={true} />
    )

    expect(tree.container.innerHTML).toBe('')
  })

  test('renders an image when src is provided', () => {
    const tree = render(
      <VimeoPosterImage
        src="https://example.com/poster.jpg"
        playing={false}
        controls={true}
        handleUpdatePlaying={() => {}}
      />
    )

    const img = tree.container.querySelector('img')

    expect(img).not.toBeNull()
    expect(img.getAttribute('src')).toBe('https://example.com/poster.jpg')
    expect(img.getAttribute('alt')).toBe('')
  })

  test('applies bber-visible class when not playing', () => {
    const tree = render(
      <VimeoPosterImage
        src="https://example.com/poster.jpg"
        playing={false}
        controls={true}
        handleUpdatePlaying={() => {}}
      />
    )

    const img = tree.container.querySelector('img')

    expect(img.classList.contains('bber-visible')).toBe(true)
  })

  test('does not apply bber-visible class when playing', () => {
    const tree = render(
      <VimeoPosterImage
        src="https://example.com/poster.jpg"
        playing={true}
        controls={true}
        handleUpdatePlaying={() => {}}
      />
    )

    const img = tree.container.querySelector('img')

    expect(img.classList.contains('bber-visible')).toBe(false)
  })

  test('applies bber-controls class when controls is true', () => {
    const tree = render(
      <VimeoPosterImage
        src="https://example.com/poster.jpg"
        playing={false}
        controls={true}
        handleUpdatePlaying={() => {}}
      />
    )

    const img = tree.container.querySelector('img')

    expect(img.classList.contains('bber-controls')).toBe(true)
  })

  test('does not apply bber-controls class when controls is false', () => {
    const tree = render(
      <VimeoPosterImage
        src="https://example.com/poster.jpg"
        playing={false}
        controls={false}
        handleUpdatePlaying={() => {}}
      />
    )

    const img = tree.container.querySelector('img')

    expect(img.classList.contains('bber-controls')).toBe(false)
  })

  test('calls handleUpdatePlaying when clicked', () => {
    const handleUpdatePlaying = jest.fn()

    const tree = render(
      <VimeoPosterImage
        src="https://example.com/poster.jpg"
        playing={false}
        controls={true}
        handleUpdatePlaying={handleUpdatePlaying}
      />
    )

    const img = tree.container.querySelector('img')
    img.click()

    expect(handleUpdatePlaying).toHaveBeenCalledTimes(1)
  })
})
