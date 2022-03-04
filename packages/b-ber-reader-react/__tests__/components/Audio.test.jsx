import React from 'react'
import renderer from 'react-test-renderer'
import Audio from '../../src/components/Media/Audio'

jest.mock(
  '../../src/lib/with-node-position',
  () => WrappedComponent => props => <WrappedComponent {...props} />
)

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

    const ref = React.createRef()

    props = { id: 'foo', 'data-autoplay': true, controls: true }
    tree = renderer.create(<Audio elemRef={ref} {...props} />).toJSON()

    expect(tree).toMatchSnapshot()

    props = { id: 'foo', 'data-autoplay': false, controls: false }
    tree = renderer.create(<Audio elemRef={ref} {...props} />).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
