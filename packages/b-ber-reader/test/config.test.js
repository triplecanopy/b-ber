/* global jest,test,expect,jsdom */
/* eslint-disable global-require */

describe('b-ber-reader development config', () => {

    beforeAll(() => jsdom.reconfigure({url: 'http://localhost:3000/'}))

    test('loads the local config', () => {
        const config = require('../src/config')
        expect(config).toEqual(expect.objectContaining({
            debug: expect.any(Boolean),
            verboseOutput: expect.any(Boolean),
            mobileViewportMaxWidth: expect.any(Number),
        }))
    })

    test('does not fail if a local config is not present', () => {
        //jest.mock('../.localconfig', () => { throw new Error() })
        expect(() => require('../.localconfig')).toThrow()
        expect(() => require('../src/config')).not.toThrow()
    })
})


describe('b-ber-reader production config', () => {

    beforeAll(() => jsdom.reconfigure({url: 'https://www.example.com/'}))

    test('loads the local config', () => {
        const config = require('../src/config')
        expect(config).toEqual(expect.objectContaining({
            debug: expect.any(Boolean),
            verboseOutput: expect.any(Boolean),
            mobileViewportMaxWidth: expect.any(Number),
        }))
    })

    test('does not fail if a local config is not present', () => {
        //jest.mock('../.localconfig', () => { throw new Error() })
        expect(() => require('../.localconfig')).toThrow()
        expect(() => require('../src/config')).not.toThrow()
    })
})
