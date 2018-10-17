/* global expect,jest */

import opf from '../../src/cmd/opf'

jest.mock('@canopycanopycanopy/b-ber-tasks', () => ({
    opf: jest.fn(),
}))

describe('opf', () => {
    it('exports a yargs command object', () => {
        expect(opf).toEqual(
            expect.objectContaining({
                command: expect.anything(),
                describe: expect.any(String),
                builder: expect.any(Function),
                handler: expect.any(Function),
            }),
        )
    })
})
