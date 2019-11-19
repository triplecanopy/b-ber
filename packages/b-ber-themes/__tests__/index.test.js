/* global test,expect */

import fs from 'fs-extra'
import path from 'path'
import sass from 'node-sass'

afterAll(() => fs.remove('themes'))

describe('b-ber-themes', () => {
  test('it exports the themes', () => {
    expect(() => require.resolve('../index.js')).not.toThrow()

    const actualModule = require.requireActual('../index.js')
    const actualModules = {}
    Object.keys(actualModule).forEach(a => {
      expect(() => {
        const b = require.requireActual(`../${actualModule[a].npmPackage.name}`)
        actualModules[b.name] = b
      }).not.toThrow()
    })

    expect(Object.keys(actualModules).length).toBeGreaterThan(0)
    expect(actualModules).toEqual(actualModule)
  })

  describe('theme packages', () => {
    const actualModule = require.requireActual('../index.js')
    const actualModules = {}
    Object.keys(actualModule).forEach(a => {
      const b = require.requireActual(`../${actualModule[a].npmPackage.name}`)
      actualModules[b.name] = b
    })

    Object.keys(actualModules).forEach(a => {
      describe(a, () => {
        const theme = actualModules[a]

        test('it has the required properties', () => {
          const themeKeys = Object.keys(theme)

          const base = {
            name: val => expect(val).toBeString(),
            entry: val => expect(val).toBeString(),
            fonts: val => expect(val).toBeArray(),
            images: val => expect(val).toBeArray(),
            npmPackage: val => expect(val).toBeObject(),
          }

          // text existence
          Object.keys(base).forEach(val => expect(themeKeys).toContain(val))

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

          expect(() =>
            sass.render(
              {
                data: `$build: "epub"; ${contents}`,
                includePaths: [
                  path.dirname(theme.entry),
                  path.dirname(path.dirname(theme.entry)),
                ],
              },
              (err, result) => {
                expect(err).toBeNil()

                expect(Buffer.isBuffer(result.css)).toBeTrue()
                expect(result.stats).toBeObject()
                expect(result.stats.includedFiles).toBeArray()

                done()
              }
            )
          ).not.toThrow()
        })
      })
    })
  })
})
