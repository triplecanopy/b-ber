/* global expect */

import fs from 'fs-extra'

jest.mock('../src/Spine')
jest.mock('../src/SpineItem')

// Since the State module exports an instance of state, and checks are done in
// State's constructor against the file system, we create the necessary dirs in
// `beforeAll` to run tests and remove them in teardown

let state

beforeAll(() =>
    // eslint-disable-next-line global-require
    fs.mkdirp('_project/_media').then(() => (state = require('../src/State').default)),
)

afterAll(() => Promise.all([fs.remove('_project'), fs.remove('themes')]))

describe('State', () => {
    describe('#add', () => {
        it('Should add an item to an array or object', () => {
            state.reset()

            const a = 'foo'
            const o = { foo: 1 }

            state.add('sequence', a)
            state.add('video', o)

            expect(state.sequence.length).toBe(1)
            expect(state.video.length).toBe(1)
            expect(state.video[0]).toHaveProperty('foo')
        })
    })

    describe('#remove', () => {
        it('Should remove an item from an array or object', () => {
            state.reset()
            state.add('sequence', { foo: 1 })
            state.remove('sequence', { foo: 1 })
            expect(state.sequence).toEqual([])
        })
    })

    describe('#merge', () => {
        it('Should merge two objects', () => {
            state.reset()
            state.merge('buildTypes', { foo: 1 })
            state.merge('buildTypes', { bar: 2 })
            expect(state.buildTypes).toHaveProperty('foo', 1)
            expect(state.buildTypes).toHaveProperty('bar', 2)
        })
    })

    describe('#update', () => {
        it('Should set the value of a property', done => {
            state.reset()
            const addFoo = callback => {
                state.add('sequence', 'foo')
                callback()
            }

            addFoo(() => {
                state.update('sequence', ['bar'])
                expect(state.sequence.length).toBe(1)
                expect(state.sequence).toContain('bar')
                done()
            })
        })
    })
})
