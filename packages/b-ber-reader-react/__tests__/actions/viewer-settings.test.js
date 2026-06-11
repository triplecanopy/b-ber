import configureMockStore from 'redux-mock-store'
import { thunk } from 'redux-thunk'
import { load, save, update } from '../../src/actions/viewer-settings'
import * as actionTypes from '../../src/constants/viewer-settings'
import Storage from '../../src/helpers/Storage'

jest.mock('../../src/helpers/Storage')

const mockStore = configureMockStore([thunk])

describe('actions/viewer-settings', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('load dispatches a SETTINGS_LOAD action', () => {
    const store = mockStore({ viewerSettings: {} })

    store.dispatch(load())

    expect(store.getActions()).toEqual([{ type: actionTypes.SETTINGS_LOAD }])
  })

  test('save persists viewerSettings to storage and dispatches SETTINGS_SAVE', () => {
    const viewerSettings = { fontSize: 16 }
    const store = mockStore({ viewerSettings })

    store.dispatch(save())

    expect(Storage.set).toHaveBeenCalledWith({ viewerSettings })
    expect(store.getActions()).toEqual([
      { type: actionTypes.SETTINGS_SAVE, payload: viewerSettings },
    ])
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
