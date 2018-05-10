/* global expect,jest */


import inject from '../../src/cmd/inject'

jest.mock('@canopycanopycanopy/b-ber-tasks', () => ({
    inject: jest.fn(),
}))

describe('inject', () => {
    it('exports a yargs command object', () => {
        expect(inject).toEqual(expect.objectContaining({
            command: expect.anything(),
            describe: expect.any(String),
            builder: expect.any(Function),
            handler: expect.any(Function),
        }))
    })
})
