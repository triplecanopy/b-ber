import React from 'react'
import { Provider } from 'react-redux'
import configureMockStore from 'redux-mock-store'
import { render } from '@testing-library/react'
import Spinner from '../../src/components/Spinner'

const mockStore = configureMockStore()

describe('Spinner', () => {
  test('renders the component', () => {
    let tree
    let store = mockStore({
      userInterface: {
        spinnerVisible: true,
      },
    })

    tree = render(
      <Provider store={store}>
        <Spinner />
      </Provider>
    )

    expect(tree.container).toMatchSnapshot()

    store = mockStore({
      userInterface: {
        spinnerVisible: false,
      },
    })

    tree = render(
      <Provider store={store}>
        <Spinner />
      </Provider>
    )

    expect(tree.container).toMatchSnapshot()
  })
})
