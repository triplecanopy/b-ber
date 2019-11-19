/* global expect,jest */

import _new from '../../src/commands/new'

jest.mock('@canopycanopycanopy/b-ber-tasks', () => ({
  _new: jest.fn(),
}))

jest.mock('@canopycanopycanopy/b-ber-lib/utils', () => ({
  fail: jest.fn(),
  ensure: jest.fn(),
}))

describe('new', () => {
  it('exports a yargs command object', () => {
    expect(_new).toEqual(
      expect.objectContaining({
        command: expect.anything(),
        describe: expect.any(String),
        builder: expect.any(Function),
        handler: expect.any(Function),
      })
    )
  })
})
