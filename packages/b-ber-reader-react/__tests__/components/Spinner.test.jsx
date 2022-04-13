import React from 'react'
import { Provider } from 'react-redux'
import configureMockStore from 'redux-mock-store'
import renderer from 'react-test-renderer'
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

    tree = renderer
      .create(
        <Provider store={store}>
          <Spinner />
        </Provider>
      )
      .toJSON()

    expect(tree).toMatchSnapshot()

    store = mockStore({
      userInterface: {
        spinnerVisible: false,
      },
    })

    tree = renderer
      .create(
        <Provider store={store}>
          <Spinner />
        </Provider>
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })
})
