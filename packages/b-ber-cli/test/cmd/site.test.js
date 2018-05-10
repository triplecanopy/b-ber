/* global expect,jest */


import site from '../../src/cmd/site'

jest.mock('@canopycanopycanopy/b-ber-tasks', () => ({
    site: jest.fn(),
}))

describe('site', () => {
    it('exports a yargs command object', () => {
        expect(site).toEqual(expect.objectContaining({
            command: expect.anything(),
            describe: expect.any(String),
            builder: expect.any(Function),
            handler: expect.any(Function),
        }))
    })
})
