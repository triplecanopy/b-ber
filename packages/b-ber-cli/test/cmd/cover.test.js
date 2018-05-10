/* global expect,jest */


import cover from '../../src/cmd/cover'

jest.mock('@canopycanopycanopy/b-ber-tasks', () => ({
    cover: jest.fn(),
}))

describe('cover', () => {
    it('exports a yargs command object', () => {
        expect(cover).toEqual(expect.objectContaining({
            command: expect.anything(),
            describe: expect.any(String),
            builder: expect.any(Function),
            handler: expect.any(Function),
        }))
    })
})
