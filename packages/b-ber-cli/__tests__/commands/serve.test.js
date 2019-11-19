/* global expect,jest */

import serve from '../../src/commands/serve'

jest.mock('@canopycanopycanopy/b-ber-tasks', () => ({
  serve: jest.fn(),
}))

jest.mock('@canopycanopycanopy/b-ber-lib/utils', () => ({
  fail: jest.fn(),
  ensure: jest.fn(),
}))

describe('serve', () => {
  it('exports a yargs command object', () => {
    expect(serve).toEqual(
      expect.objectContaining({
        command: expect.anything(),
        describe: expect.any(String),
        builder: expect.any(Function),
        handler: expect.any(Function),
      })
    )
  })
})
