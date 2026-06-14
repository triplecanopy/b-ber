import { render } from '@testing-library/react'
import React from 'react'
import { Provider } from 'react-redux'
import Marker from '../../src/components/Marker'
import useNodePosition from '../../src/hooks/use-node-position'
import { createTestStore } from '../helpers/store'

// Marker reads its verso/recto/elemRef from useNodePosition; stub the hook so
// each test can supply that position data directly. The Provider is still
// needed because Marker itself is connect()ed (markers/markerActions).
jest.mock('../../src/hooks/use-node-position', () => ({
  __esModule: true,
  default: jest.fn(),
}))

const mockNodePosition = (overrides = {}) =>
  useNodePosition.mockReturnValue({
    elemRef: React.createRef(),
    verso: null,
    recto: null,
    spreadIndex: null,
    elementEdgeLeft: null,
    view: {},
    viewerSettings: {},
    readerSettings: {},
    ...overrides,
  })

describe('Marker', () => {
  afterEach(() => jest.clearAllMocks())

  test('renders verso marker with data attributes and spacer', () => {
    const store = createTestStore()
    const elemRef = React.createRef()

    mockNodePosition({ elemRef, verso: true, recto: false })

    const { container } = render(
      <Provider store={store}>
        <Marker
          data-index={3}
          data-final={false}
          className="bber-marker"
          style={{ color: 'red' }}
        />
      </Provider>
    )

    const marker = container.querySelector('.bber-marker')
    expect(marker).not.toBeNull()
    expect(marker.dataset.verso).toBe('true')
    expect(marker.dataset.recto).toBe('false')
    expect(marker.dataset.index).toBe('3')
    expect(marker.dataset.final).toBe('false')

    expect(container.querySelector('.bber-marker__spacer')).not.toBeNull()
    expect(elemRef.current).toBe(marker)
  })

  test('renders recto marker', () => {
    const store = createTestStore()

    mockNodePosition({ verso: false, recto: true })

    const { container } = render(
      <Provider store={store}>
        <Marker data-index={1} data-final className="bber-marker" />
      </Provider>
    )

    const marker = container.querySelector('.bber-marker')
    expect(marker.dataset.verso).toBe('false')
    expect(marker.dataset.recto).toBe('true')
    expect(marker.dataset.final).toBe('true')
  })
})
