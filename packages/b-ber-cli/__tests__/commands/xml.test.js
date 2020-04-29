import xml from '../../src/commands/xml'

jest.mock('@canopycanopycanopy/b-ber-tasks', () => ({
  xml: jest.fn(),
}))

jest.mock('@canopycanopycanopy/b-ber-lib/utils', () => ({
  fail: jest.fn(),
  ensure: jest.fn(),
}))

describe('xml', () => {
  it('exports a yargs command object', () => {
    expect(xml).toEqual(
      expect.objectContaining({
        command: expect.anything(),
        describe: expect.any(String),
        builder: expect.any(Function),
        handler: expect.any(Function),
      })
    )
  })
})
