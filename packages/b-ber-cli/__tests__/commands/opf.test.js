/* global expect,jest */

import opf from '../../src/commands/opf'

jest.mock('@canopycanopycanopy/b-ber-tasks', () => ({
  opf: jest.fn(),
}))

jest.mock('@canopycanopycanopy/b-ber-lib/utils', () => ({
  fail: jest.fn(),
  ensure: jest.fn(),
}))

describe('opf', () => {
  it('exports a yargs command object', () => {
    expect(opf).toEqual(
      expect.objectContaining({
        command: expect.anything(),
        describe: expect.any(String),
        builder: expect.any(Function),
        handler: expect.any(Function),
      })
    )
  })
})
