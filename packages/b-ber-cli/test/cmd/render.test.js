/* global expect,jest */


import render from '../../src/cmd/render'

jest.mock('@canopycanopycanopy/b-ber-tasks', () => ({
    render: jest.fn(),
}))

describe('render', () => {
    it('exports a yargs command object', () => {
        expect(render).toEqual(expect.objectContaining({
            command: expect.anything(),
            describe: expect.any(String),
            builder: expect.any(Function),
            handler: expect.any(Function),
        }))
    })
})
