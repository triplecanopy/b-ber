/* global expect,jest */


import container from '../../src/cmd/container'

jest.mock('@canopycanopycanopy/b-ber-tasks', () => ({
    container: jest.fn(),
}))

describe('container', () => {
    it('exports a yargs command object', () => {
        expect(container).toEqual(expect.objectContaining({
            command: expect.anything(),
            describe: expect.any(String),
            builder: expect.any(Function),
            handler: expect.any(Function),
        }))
    })
})
