import { fireEvent, render } from '@testing-library/react'
import React from 'react'
import MediaRangeSlider from '../../../../src/components/Media/Controls/MediaRangeSlider'

describe('MediaRangeSlider', () => {
  test('renders a range input bound to progress/duration and calls seek on change', () => {
    const seek = jest.fn()

    const tree = render(
      <MediaRangeSlider duration={100} progress={25} seek={seek} />
    )

    const input = tree.container.querySelector('input[type="range"]')
    const before = tree.container.querySelector('.bber-media__slider--before')

    expect(input.getAttribute('min')).toBe('0')
    expect(input.getAttribute('max')).toBe('100')
    expect(input.getAttribute('step')).toBe('1')
    expect(input.value).toBe('25')
    expect(before.style.width).toBe('25%')

    fireEvent.change(input, { target: { value: '50' } })
    expect(seek).toHaveBeenCalledTimes(1)
  })
})
