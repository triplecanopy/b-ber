/* global jest,test,expect,jsdom */
/* eslint-disable global-require,no-empty,import/no-unresolved */

describe('b-ber-reader development config', () => {
    beforeAll(() => jsdom.reconfigure({ url: 'http://localhost:3000/' }))

    test('loads the local config', () => {
        const config = require('../src/config')
        expect(config).toEqual(
            expect.objectContaining({
                debug: expect.any(Boolean),
                verboseOutput: expect.any(Boolean),
            })
        )
    })

    test('does not fail if a local config is not present', () => {
        jest.mock('../src/config', () => {
            let pkg = {
                debug: false,
                verboseOutput: false,
            }
            try {
                pkg = require('./bogus')
            } catch (err) {}
            return pkg
        })
        expect(() => require('./bogus')).toThrow()
        expect(() => require('../src/config')).not.toThrow()
    })
})

describe('b-ber-reader production config', () => {
    beforeAll(() => jsdom.reconfigure({ url: 'https://www.example.com/' }))

    test('loads the local config', () => {
        const config = require('../src/config')
        expect(config).toEqual(
            expect.objectContaining({
                debug: expect.any(Boolean),
                verboseOutput: expect.any(Boolean),
            })
        )
    })

    test('does not fail if a local config is not present', () => {
        jest.mock('../src/config', () => {
            let pkg = {
                debug: false,
                verboseOutput: false,
            }
            try {
                pkg = require('./bogus')
            } catch (err) {}
            return pkg
        })
        expect(() => require('./bogus')).toThrow()
        expect(() => require('../src/config')).not.toThrow()
    })
})
