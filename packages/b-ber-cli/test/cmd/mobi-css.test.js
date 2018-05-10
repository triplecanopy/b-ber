/* global expect,jest */


import mobicss from '../../src/cmd/mobi-css'

jest.mock('@canopycanopycanopy/b-ber-tasks', () => ({
    mobiCSS: jest.fn(),
}))

describe('mobi-css', () => {
    it('exports a yargs command object', () => {
        expect(mobicss).toEqual(expect.objectContaining({
            command: expect.anything(),
            describe: expect.any(String),
            builder: expect.any(Function),
            handler: expect.any(Function),
        }))
    })
})
