/* global describe, test */
/* eslint-disable camelcase, import/newline-after-import, global-require */

// we test against events emitted with `process`, so we run them in a separate
// thread to prevent conflicts with our test suite
const {spawn} = require('child_process')

// prevent _promise2.default ... errors in the scripts passed to child_process.
// jest uses babel to transpile our code at runtime, which replaces native
// Promise with the implementation in babel-core. this causes errors since our
// cp doesn't have access to babel
const Promise = require('Promise')

// helper to convert our test functions to string. we eval them in a child
// process so that we can track events emitted from `process`
const iife = func => `(${String(func)})()`

// logger_handleFatalError is a simple mock for the
// @canopycanopycanopy/b-ber-logger package. b-ber-logger logs the error stack
// to the console and stops the script when a fatal error is encountered.
function logger_handleFatalError(messageOrErrorObject) {
    if (typeof messageOrErrorObject === 'string') {
        process.stdout.write(messageOrErrorObject)
        process.exit(1)
    }

    if (messageOrErrorObject instanceof Error) {
        process.stdout.write(`${messageOrErrorObject.stack.slice(0, 70)} ...`)
        process.exit(1)
    }
}

function logger_writeToConsole(message) {
    process.stdout.write(String(message))
}

// the following functions emulate a typical b-ber task, are passed as strings
// and eval'd during tests
function task_1(throwTopLevelError = false, throwNestedError = false) {

    return new Promise(resolve => {
        const result = 1

        const cwd = process.cwd()
        const dirs = ['./']
        const methodName = throwNestedError ? 'mkdir' : 'mkdirp'
        const promises = dirs.map((a) => fs[methodName](path.join(cwd, a)).catch(logger_handleFatalError)) // eslint-disable-line no-undef

        if (throwTopLevelError) throw new Error('err message')

        Promise.all(promises).then(() => resolve(result))
    })
}

function task_2(response) {
    return new Promise(resolve => {
        const result = response + 1
        const cwd = process.cwd()
        const dirs = ['./']
        const promises = dirs.map((a) => fs.mkdirp(path.join(cwd, a)).catch(logger_handleFatalError)) // eslint-disable-line no-undef

        Promise.all(promises).then(() => resolve(result))
    })
}

// => run_withoutErrors: 2
function run_withoutErrors() {
    return new Promise(resolve => {
        task_1()
            .then(task_2)
            .then(result => {
                logger_writeToConsole(result)
                return resolve(result)
            })
            .catch(logger_handleFatalError)
    })
}

// => Error: err message ... from b-ber-logger
function run_withTopLevelErrors() {
    return new Promise(resolve => {
        task_1(true)
            .then(task_2)
            .then(result => resolve(result))
            .catch(logger_handleFatalError)
    })
}

// => Error: EEXIST: file already exists ... from fs-extra
function run_withNestedErrors() {
    return new Promise(resolve => {
        task_1(false, true)
            .then(task_2)
            .then(result => resolve(result))
            .catch(logger_handleFatalError)
    })
}

// create the template that will pass into the child_process
function scriptTemplate(s, ...args) {
    const callable = args.pop()
    return `
        const fs = require('fs-extra')
        const path = require('path')

        ${args.join('')}
        ${iife(callable)}
    `
}

// create our scripts for cp
function createScript(callable) {
    return scriptTemplate`
        ${String(task_1)}
        ${String(task_2)}
        ${String(logger_handleFatalError)}
        ${String(logger_writeToConsole)}
        ${String(callable)}
    `
}

// finally our test suite
describe('b-ber api', () => {

    test('runs commands without errors', done => {

        expect.assertions(3)

        const script = createScript(run_withoutErrors)
        const cp = spawn('node', ['-e', script])

        let stdErrors = null

        cp.stdout.on('data', data => expect(String(data)).toBe('2'))

        cp.stderr.on('data', data => {
            const data_ = String(data)
            console.log(`An error was thrown during child_process:`)
            console.log(data_)
            stdErrors = data_
        })

        cp.on('exit', code => {
            expect(code).toBe(0)
            expect(stdErrors).toBe(null)
            done()
        })

    })

    test('handles top-level errors', done => {

        expect.assertions(3)

        const script = createScript(run_withTopLevelErrors)
        const cp = spawn('node', ['-e', script])

        let stdErrors = null

        cp.stdout.on('data', data => expect(String(data)).toMatch(/Error: err message/))

        cp.stderr.on('data', data => {
            const data_ = String(data)
            console.log(`An error was thrown during child_process:`)
            console.log(data_)
            stdErrors = data_
        })

        cp.on('exit', code => {
            expect(code).toBe(1)
            expect(stdErrors).toBe(null)
            done()
        })

    })

    test('handles nested errors', done => {

        expect.assertions(3)

        const script = createScript(run_withNestedErrors)
        const cp = spawn('node', ['-e', script])

        let stdErrors = null

        cp.stdout.on('data', data => expect(String(data)).toMatch(/Error: EEXIST: file already exists/))

        cp.stderr.on('data', data => {
            const data_ = String(data)
            console.log(`An error was thrown during child_process:`)
            console.log(data_)
            stdErrors = data_
        })

        cp.on('exit', code => {
            expect(code).toBe(1)
            expect(stdErrors).toBe(null)
            done()
        })

    })
})
