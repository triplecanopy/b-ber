/* global jest,test,expect */

import { Opf, ManifestAndMetadata, Navigation } from '../src/opf'

jest.mock('../../b-ber-lib/src/ApplicationLoader')

const state = jest.genMockFromModule('@canopycanopycanopy/b-ber-lib/State')

let manifestAndMetadata

let src = 'src'
let dist = 'dist'
let version = '0.0.0'

describe('Opf', () => {
    test('it loads the module', () => {
        expect(Opf).toBeFunction()
        expect(ManifestAndMetadata).toBeFunction()
        expect(Navigation).toBeFunction()
    })
})

describe('ManifestAndMetadata', () => {
    beforeAll(() => {
        manifestAndMetadata = new ManifestAndMetadata()

        Object.defineProperties(manifestAndMetadata, {
            src: {
                get: () => src,
                set: val => (src = val),
                enumerable: true,
                configurable: true,
            },
            dist: {
                get: () => dist,
                set: val => (dist = val),
                enumerable: true,
                configurable: true,
            },
            version: {
                get: () => version,
                set: val => (version = val),
                enumerable: true,
                configurable: true,
            },
            bookmeta: {
                get: () => [],
                set: () => {},
                enumerable: true,
                configurable: true,
            },
        })

        manifestAndMetadata.src = src
        manifestAndMetadata.dist = dist
        manifestAndMetadata.version = version

        Object.defineProperties(state, {
            metadata: {
                get: () => [],
                set: () => {},
                enumerable: true,
                configurable: true,
            },
        })
    })

    test('it loads the module', () => {
        expect(ManifestAndMetadata).toBeFunction()
    })

    test('it is properly configured', () => {
        expect(manifestAndMetadata.src).toBe(src)
        expect(manifestAndMetadata.dist).toBe(dist)
        expect(manifestAndMetadata.version).toBe(version)

        manifestAndMetadata
            .loadMetadata()
            .then(() => expect(manifestAndMetadata.bookmeta).toEqual([]))
    })
})
