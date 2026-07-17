import { render } from '@testing-library/react'
import React from 'react'
import MediaTime from '../../../../src/components/Media/Controls/MediaTime'

describe('MediaTime', () => {
  test('renders the given time string', () => {
    const tree = render(<MediaTime time="01:23" />)
    const node = tree.container.querySelector('.bber-media__time')

    expect(node).not.toBeNull()
    expect(node.textContent).toBe('01:23')
  })
})
