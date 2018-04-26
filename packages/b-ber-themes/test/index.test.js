/* global test,expect */

import fs from 'fs'
import path from 'path'
import sass from 'node-sass'

describe('b-ber-themes', () => {

    test('it exports the themes', () => {
        expect(() => require.resolve('../index.js')).not.toThrow()

        const actualModule = require.requireActual('../index.js')
        const actualModules = {}
        Object.keys(actualModule).forEach(a => {
            expect(() => {
                const b = require.requireActual(`../${a}`)
                actualModules[b.name] = b
            }).not.toThrow()
        })

        expect(Object.keys(actualModules).length).toBeGreaterThan(0)
        expect(actualModules).toEqual(actualModule)
    })


    describe('themes packages', () => {
        const actualModule = require.requireActual('../index.js')
        const actualModules = {}
        Object.keys(actualModule).forEach(a => {
            const b = require.requireActual(`../${a}`)
            actualModules[b.name] = b
        })

        Object.keys(actualModules).forEach(a => {
            describe(a, () => {
                const theme = actualModules[a]

                test('it has the required properties', () => {

                    const themeKeys = Object.keys(theme)

                    const base = {
                        name: a => expect(a).toBeString(),
                        entry: a => expect(a).toBeString(),
                        fonts: a => expect(a).toBeArray(),
                        images: a => expect(a).toBeArray(),
                        npmPackage: a => expect(a).toBeObject(),
                    }

                    // text existence
                    Object.keys(base).forEach(a => expect(themeKeys).toContain(a))

                    // check type
                    themeKeys.forEach(key => {
                        if ({}.hasOwnProperty.call(base, key)) {
                            base[key](theme[key])
                        }
                    })

                })

                test('it builds the css', done => {

                    const contents = fs.readFileSync(theme.entry, 'utf8')
                    expect(contents).toBeString()

                    expect(() => sass.render({
                        data: `$build: "epub"; ${contents}`,
                        includePaths: [path.dirname(theme.entry)],
                    }, (err, result) => {
                        expect(err).toBeNil()

                        expect(Buffer.isBuffer(result.css)).toBeTrue()
                        expect(result.stats).toBeObject()
                        expect(result.stats.includedFiles).toBeArray()

                        done()

                    })).not.toThrow()
                })
            })
        })
    })
})
