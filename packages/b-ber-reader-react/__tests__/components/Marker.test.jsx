import { render } from '@testing-library/react'
import React from 'react'
import { Provider } from 'react-redux'
import Marker from '../../src/components/Marker'
import { createTestStore } from '../helpers/store'

jest.mock(
  '../../src/lib/with-node-position',
  () => (WrappedComponent) => (props) => <WrappedComponent {...props} />
)

describe('Marker', () => {
  test('renders verso marker with data attributes and spacer', () => {
    const store = createTestStore()
    const elemRef = React.createRef()

    const { container } = render(
      <Provider store={store}>
        <Marker
          verso
          recto={false}
          data-index={3}
          data-final={false}
          className="bber-marker"
          elemRef={elemRef}
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

    const { container } = render(
      <Provider store={store}>
        <Marker
          verso={false}
          recto
          data-index={1}
          data-final
          className="bber-marker"
          elemRef={React.createRef()}
        />
      </Provider>
    )

    const marker = container.querySelector('.bber-marker')
    expect(marker.dataset.verso).toBe('false')
    expect(marker.dataset.recto).toBe('true')
    expect(marker.dataset.final).toBe('true')
  })
})
