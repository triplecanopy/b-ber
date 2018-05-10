/* global expect,jest */


import footnotes from '../../src/cmd/footnotes'

jest.mock('@canopycanopycanopy/b-ber-tasks', () => ({
    footnotes: jest.fn(),
}))

describe('footnotes', () => {
    it('exports a yargs command object', () => {
        expect(footnotes).toEqual(expect.objectContaining({
            command: expect.anything(),
            describe: expect.any(String),
            builder: expect.any(Function),
            handler: expect.any(Function),
        }))
    })
})
