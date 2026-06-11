import {
  disableEventHandling,
  disablePageTransitions,
  enableEventHandling,
  enablePageTransitions,
  hideSpinner,
  showSpinner,
  update,
} from '../../src/actions/user-interface'
import * as actionTypes from '../../src/constants/user-interface'

describe('actions/user-interface', () => {
  test('update creates an UPDATE action', () => {
    expect(update({ spinnerVisible: false })).toEqual({
      type: actionTypes.UPDATE,
      payload: { spinnerVisible: false },
    })
  })

  test('enablePageTransitions creates a PAGE_TRANSITIONS_UPDATE action with true', () => {
    expect(enablePageTransitions()).toEqual({
      type: actionTypes.PAGE_TRANSITIONS_UPDATE,
      payload: true,
    })
  })

  test('disablePageTransitions creates a PAGE_TRANSITIONS_UPDATE action with false', () => {
    expect(disablePageTransitions()).toEqual({
      type: actionTypes.PAGE_TRANSITIONS_UPDATE,
      payload: false,
    })
  })

  test('enableEventHandling creates an EVENT_HANDLING_UPDATE action with true', () => {
    expect(enableEventHandling()).toEqual({
      type: actionTypes.EVENT_HANDLING_UPDATE,
      payload: true,
    })
  })

  test('disableEventHandling creates an EVENT_HANDLING_UPDATE action with false', () => {
    expect(disableEventHandling()).toEqual({
      type: actionTypes.EVENT_HANDLING_UPDATE,
      payload: false,
    })
  })

  test('showSpinner creates a SPINNER_UPDATE action with true', () => {
    expect(showSpinner()).toEqual({
      type: actionTypes.SPINNER_UPDATE,
      payload: true,
    })
  })

  test('hideSpinner creates a SPINNER_UPDATE action with false', () => {
    expect(hideSpinner()).toEqual({
      type: actionTypes.SPINNER_UPDATE,
      payload: false,
    })
  })
})
