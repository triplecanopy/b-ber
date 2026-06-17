import React from 'react'
import Spinner from '../../src/components/Spinner'
import { renderWithStore } from '../helpers/renderWithStore'

describe('Spinner', () => {
  test('renders the component', () => {
    let tree = renderWithStore(<Spinner />, {
      overrides: { userInterface: { spinnerVisible: true } },
    })

    expect(tree.container).toMatchSnapshot()

    tree = renderWithStore(<Spinner />, {
      overrides: { userInterface: { spinnerVisible: false } },
    })

    expect(tree.container).toMatchSnapshot()
  })
})
