/* global expect,jest */


import pdf from '../../src/cmd/pdf'

jest.mock('@canopycanopycanopy/b-ber-tasks', () => ({
    pdf: jest.fn(),
}))

describe('pdf', () => {
    it('exports a yargs command object', () => {
        expect(pdf).toEqual(expect.objectContaining({
            command: expect.anything(),
            describe: expect.any(String),
            builder: expect.any(Function),
            handler: expect.any(Function),
        }))
    })
})
