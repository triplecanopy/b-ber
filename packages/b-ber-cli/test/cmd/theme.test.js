/* global expect,jest */


import theme from '../../src/cmd/theme'

jest.mock('@canopycanopycanopy/b-ber-tasks', () => ({
    theme: jest.fn(),
}))

describe('theme', () => {
    it('exports a yargs command object', () => {
        expect(theme).toEqual(expect.objectContaining({
            command: expect.anything(),
            describe: expect.any(String),
            builder: expect.any(Function),
            handler: expect.any(Function),
        }))
    })
})
