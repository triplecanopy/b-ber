/* global expect,jest */

import generate from '../../src/commands/generate'

jest.mock('@canopycanopycanopy/b-ber-tasks', () => ({
    generate: jest.fn(),
}))

jest.mock('@canopycanopycanopy/b-ber-lib/utils', () => ({
    fail: jest.fn(),
    ensure: jest.fn(),
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
