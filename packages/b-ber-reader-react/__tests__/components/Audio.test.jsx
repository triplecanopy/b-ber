/* eslint-disable react/jsx-props-no-spreading */

import { render } from '@testing-library/react'
import React from 'react'
import Audio from '../../src/components/Media/Audio'

// Media gets its element ref + spread position from useNodePosition; stub it so
// these snapshot tests don't need a Redux store / measured viewport.
jest.mock('../../src/hooks/use-node-position', () => ({
  __esModule: true,
  default: () => ({
    elemRef: { current: null },
    verso: null,
    recto: null,
    spreadIndex: null,
    elementEdgeLeft: null,
    view: {},
    viewerSettings: {},
    readerSettings: {},
  }),
}))

describe('Audio', () => {
  // Clean up logging from HOC during tests
  beforeEach(() => {
    console.warn = jest.fn()
    console.error = jest.fn()
  })

  afterEach(() => jest.clearAllMocks())

  test('renders the component', () => {
    let props
    let tree

    props = { id: 'foo', 'data-autoplay': true, controls: true }
    tree = render(<Audio {...props} />)

    expect(tree.container).toMatchSnapshot()

    props = { id: 'foo', 'data-autoplay': false, controls: false }
    tree = render(<Audio {...props} />)

    expect(tree.container).toMatchSnapshot()
  })
})
