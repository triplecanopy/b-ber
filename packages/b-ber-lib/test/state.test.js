/* global expect */

import state from '../src/State'

beforeEach(() => state.reset())

describe('State', () => {

    describe('#add', () => {
        it('Should add an item to an array or object', () => {
            const a = 'foo'
            const o = {foo: 1}

            state.add('sequence', a)
            state.add('cursor', o)

            expect(state.sequence.length).toBe(1)
            expect(state.cursor.length).toBe(1)
            expect(state.cursor[0]).toHaveProperty('foo')
        })
    })

    describe('#remove', () => {
        it('Should remove an item from an array or object', () => {
            state.add('sequence', 'foo')
            state.remove('sequence', 'foo')
            expect(state.sequence).toEqual([])
        })
    })


    describe('#merge', () => {
        it('Should merge two objects', () => {
            state.merge('buildTypes', {foo: 1})
            state.merge('buildTypes', {bar: 2})
            expect(state.buildTypes).toHaveProperty('foo', 1)
            expect(state.buildTypes).toHaveProperty('bar', 2)
        })
    })


    describe('#update', () => {
        it('Should set the value of a property', done => {
            const addFoo = (callback) => {
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
