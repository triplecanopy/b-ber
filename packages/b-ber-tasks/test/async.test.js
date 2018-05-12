
import async from '../src/async'

jest.mock('@canopycanopycanopy/b-ber-logger', () => ({
    notify() {
        return true
    },
}))

describe('task: async', () => {
    it('runs commands in sequence', done => {

        expect.assertions(3)

        const sequence = ['foo', 'bar', 'baz']

        const tasks = {
            foo: jest.fn(() => Promise.resolve()),
            bar: jest.fn(() => Promise.resolve()),
            baz: jest.fn(() => Promise.resolve()),
        }

        async.serialize(sequence, tasks).then(() => {
            expect(tasks.foo).toHaveBeenCalled()
            expect(tasks.bar).toHaveBeenCalled()
            expect(tasks.baz).toHaveBeenCalled()
            done()
        })

    })

    it('passes values to subsequent calls', done => {

        expect.assertions(4)

        const sequence = ['foo', 'bar', 'baz']

        const tasks = {
            foo: jest.fn(() => Promise.resolve(1)),
            bar: jest.fn(a => Promise.resolve(a + 1)),
            baz: jest.fn(a => Promise.resolve(a + 1)),
        }

        async.serialize(sequence, tasks).then(result => {
            expect(tasks.foo).toHaveBeenCalled()
            expect(tasks.bar).toHaveBeenCalledWith(1)
            expect(tasks.baz).toHaveBeenCalledWith(2)
            expect(result).toBe(3)
            done()
        })

    })

    it('throws on invalid params', done => {

        expect.assertions(3)

        const sequence = ['foo', 'bar']

        const tasks = {
            foo: jest.fn(() => Promise.resolve()),
            bar: 'bogus',
        }

        const promise = () => new Promise(() => async.serialize(sequence, tasks))

        expect(() => async.serialize(sequence, tasks)).toThrow()

        promise().catch(err => {
            expect(err.name).toBe('Error')
            expect(err.message).toMatch(/async#serialize: Invalid parameter/)
            done()
        })

    })
})