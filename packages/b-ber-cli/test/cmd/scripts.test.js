/* global expect,jest */


import scripts from '../../src/cmd/scripts'

jest.mock('@canopycanopycanopy/b-ber-tasks', () => ({
    scripts: jest.fn(),
}))

describe('scripts', () => {
    it('exports a yargs command object', () => {
        expect(scripts).toEqual(expect.objectContaining({
            command: expect.anything(),
            describe: expect.any(String),
            builder: expect.any(Function),
            handler: expect.any(Function),
        }))
    })
})
