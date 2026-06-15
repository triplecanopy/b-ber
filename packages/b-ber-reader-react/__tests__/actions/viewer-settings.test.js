import configureMockStore from 'redux-mock-store'
import { thunk } from 'redux-thunk'
import { update } from '../../src/actions/viewer-settings'
import * as actionTypes from '../../src/constants/viewer-settings'

// `load`/`save` were dead and removed during the state migration (TASK-106);
// only `update` remains until the viewerSettings slice migrates off redux.
const mockStore = configureMockStore([thunk])

describe('actions/viewer-settings', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('update dispatches a SETTINGS_UPDATE action with the given settings', () => {
    const store = mockStore({ viewerSettings: {} })

    store.dispatch(update({ fontSize: 20 }))

    expect(store.getActions()).toEqual([
      { type: actionTypes.SETTINGS_UPDATE, payload: { fontSize: 20 } },
    ])
  })

  test('update defaults payload to an empty object', () => {
    const store = mockStore({ viewerSettings: {} })

    store.dispatch(update())

    expect(store.getActions()).toEqual([
      { type: actionTypes.SETTINGS_UPDATE, payload: {} },
    ])
  })
})
