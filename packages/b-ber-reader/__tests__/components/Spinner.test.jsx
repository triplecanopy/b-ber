/* global jest,test,expect */

import React from 'react'
import renderer from 'react-test-renderer'
import Spinner from '../../src/components/Spinner'

describe('Spinner', () => {
  test('renders the component', () => {
    let tree

    tree = renderer.create(<Spinner spinnerVisible={true} />).toJSON()
    expect(tree).toMatchSnapshot()

    tree = renderer.create(<Spinner spinnerVisible={false} />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
