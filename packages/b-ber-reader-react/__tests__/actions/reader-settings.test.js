import { updateSettings } from '../../src/actions/reader-settings'
import * as actionTypes from '../../src/constants/reader-settings'

describe('actions/reader-settings', () => {
  test('updateSettings creates a SETTINGS_UPDATE action', () => {
    expect(updateSettings({ layout: 'scroll' })).toEqual({
      type: actionTypes.SETTINGS_UPDATE,
      payload: { layout: 'scroll' },
    })
  })
})
