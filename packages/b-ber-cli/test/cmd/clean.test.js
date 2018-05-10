/* global expect,jest */


import clean from '../../src/cmd/clean'

jest.mock('@canopycanopycanopy/b-ber-tasks', () => ({
    clean: jest.fn(),
}))

describe('clean', () => {
    it('exports a yargs command object', () => {
        expect(clean).toEqual(expect.objectContaining({
            command: expect.any(Array),
            describe: expect.any(String),
            builder: expect.any(Function),
            handler: expect.any(Function),
        }))
    })
})
