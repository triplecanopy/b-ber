import { update } from '../../src/actions/markers'
import * as actionTypes from '../../src/constants/markers'

describe('actions/markers', () => {
  test('update creates an UPDATE action', () => {
    expect(update({ foo: 'bar' })).toEqual({
      type: actionTypes.UPDATE,
      payload: { foo: 'bar' },
    })
  })
})
