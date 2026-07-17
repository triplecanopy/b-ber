import { render } from '@testing-library/react'
import React from 'react'
import VimeoPlayerControls from '../../../src/components/Media/VimeoPlayerControls'

describe('VimeoPlayerControls', () => {
  test('renders nothing', () => {
    const tree = render(
      <VimeoPlayerControls
        handleUpdatePlaying={() => {}}
        handleUpdatePosition={() => {}}
        handleUpdateVolume={() => {}}
      />
    )

    expect(tree.container.innerHTML).toBe('')
  })
})
