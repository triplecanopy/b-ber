/* global expect,jest */


import init from '../../src/cmd/init'

jest.mock('@canopycanopycanopy/b-ber-tasks', () => ({
    init: jest.fn(),
}))

describe('init', () => {
    it('exports a yargs command object', () => {
        expect(init).toEqual(expect.objectContaining({
            command: expect.anything(),
            describe: expect.any(String),
            builder: expect.any(Function),
            handler: expect.any(Function),
        }))
    })
})
