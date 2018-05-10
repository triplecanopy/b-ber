/* global expect,jest */


import publish from '../../src/cmd/publish'

jest.mock('@canopycanopycanopy/b-ber-tasks', () => ({
    publish: jest.fn(),
}))

describe('publish', () => {
    it('exports a yargs command object', () => {
        expect(publish).toEqual(expect.objectContaining({
            command: expect.anything(),
            describe: expect.any(String),
            builder: expect.any(Function),
            handler: expect.any(Function),
        }))
    })
})
