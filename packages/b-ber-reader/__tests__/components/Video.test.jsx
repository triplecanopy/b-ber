import React from 'react'
import renderer from 'react-test-renderer'
import Video from '../../src/components/Media/Video'

describe('Video', () => {
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
    tree = renderer.create(<Video elemRef={ref} {...props} />).toJSON()

    expect(tree).toMatchSnapshot()

    props = { id: 'foo', 'data-autoplay': false, controls: false }
    tree = renderer.create(<Video elemRef={ref} {...props} />).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
