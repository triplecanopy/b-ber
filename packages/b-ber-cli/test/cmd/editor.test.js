/* global expect,jest */


import editor from '../../src/cmd/editor'

jest.mock('@canopycanopycanopy/b-ber-tasks', () => ({
    editor: jest.fn(),
}))

describe('editor', () => {
    it('exports a yargs command object', () => {
        expect(editor).toEqual(expect.objectContaining({
            command: expect.anything(),
            describe: expect.any(String),
            builder: expect.any(Function),
            handler: expect.any(Function),
        }))
    })
})
