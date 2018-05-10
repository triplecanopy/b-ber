/* global expect,jest */


import xml from '../../src/cmd/xml'

jest.mock('@canopycanopycanopy/b-ber-tasks', () => ({
    xml: jest.fn(),
}))

describe('xml', () => {
    it('exports a yargs command object', () => {
        expect(xml).toEqual(expect.objectContaining({
            command: expect.anything(),
            describe: expect.any(String),
            builder: expect.any(Function),
            handler: expect.any(Function),
        }))
    })
})
