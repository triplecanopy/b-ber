/* global expect,jest */


import create from '../../src/cmd/create'

jest.mock('@canopycanopycanopy/b-ber-tasks', () => ({
    create: jest.fn(),
}))

describe('create', () => {
    it('exports a yargs command object', () => {
        expect(create).toEqual(expect.objectContaining({
            command: expect.anything(),
            describe: expect.any(String),
            builder: expect.any(Function),
            handler: expect.any(Function),
        }))
    })
})
