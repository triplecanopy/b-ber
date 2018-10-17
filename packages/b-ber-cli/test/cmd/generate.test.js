/* global expect,jest */

import generate from '../../src/cmd/generate'

jest.mock('@canopycanopycanopy/b-ber-tasks', () => ({
    generate: jest.fn(),
}))

describe('generate', () => {
    it('exports a yargs command object', () => {
        expect(generate).toEqual(
            expect.objectContaining({
                command: expect.anything(),
                describe: expect.any(String),
                builder: expect.any(Function),
                handler: expect.any(Function),
            }),
        )
    })
})
