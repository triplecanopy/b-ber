/* global expect,jest */


import sass from '../../src/cmd/sass'

jest.mock('@canopycanopycanopy/b-ber-tasks', () => ({
    sass: jest.fn(),
}))

describe('sass', () => {
    it('exports a yargs command object', () => {
        expect(sass).toEqual(expect.objectContaining({
            command: expect.anything(),
            describe: expect.any(String),
            builder: expect.any(Function),
            handler: expect.any(Function),
        }))
    })
})
