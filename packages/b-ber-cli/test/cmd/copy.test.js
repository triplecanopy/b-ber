/* global expect,jest */


import copy from '../../src/cmd/copy'

jest.mock('@canopycanopycanopy/b-ber-tasks', () => ({
    copy: jest.fn(),
}))

describe('copy', () => {
    it('exports a yargs command object', () => {
        expect(copy).toEqual(expect.objectContaining({
            command: expect.anything(),
            describe: expect.any(String),
            builder: expect.any(Function),
            handler: expect.any(Function),
        }))
    })
})
