import fs from 'fs-extra'
import serialize from '../src/serialize'
import * as tasks from '../'

jest.mock('@canopycanopycanopy/b-ber-lib/State', () => ({
    metadata: { json: () => [{}] },
}))

jest.mock('../', () => ({
    foo: jest.fn(() => Promise.resolve(1)),
    bar: jest.fn(() => Promise.resolve(2)),
    baz: jest.fn(() => Promise.resolve(3)),
    bat: 'bogus',
}))

jest.mock('@canopycanopycanopy/b-ber-logger', () => ({
    notify() {
        return true
    },
    notice() {
        return true
    },
    info() {
        return true
    },
    error() {
        return true
    },
}))

afterAll(() => Promise.all([fs.remove('_project'), fs.remove('themes')]))

describe('task: serialize', () => {
    it('runs commands in sequence', done => {
        expect.assertions(3)

        const sequence = ['foo', 'bar', 'baz']

        serialize(sequence).then(() => {
            expect(tasks.foo).toHaveBeenCalled()
            expect(tasks.bar).toHaveBeenCalled()
            expect(tasks.baz).toHaveBeenCalled()
            done()
        })
    })

    it('passes values to subsequent calls', done => {
        expect.assertions(4)

        const sequence = ['foo', 'bar', 'baz']

        serialize(sequence).then(result => {
            expect(tasks.foo).toHaveBeenCalled()
            expect(tasks.bar).toHaveBeenCalledWith(1)
            expect(tasks.baz).toHaveBeenCalledWith(2)
            expect(result).toBe(3)
            done()
        })
    })

    it('throws on invalid params', done => {
        expect.assertions(3)

        const sequence = ['foo', 'bar', 'baz', 'bat']

        const promise = () => new Promise(() => serialize(sequence))

        expect(() => serialize(sequence)).toThrow()

        promise().catch(err => {
            expect(err.name).toBe('Error')
            expect(err.message).toMatch(/async#serialize: Invalid parameter/)
            done()
        })
    })
})
