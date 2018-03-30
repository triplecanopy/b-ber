/* eslint-disable import/prefer-default-export */

import util from 'util'

export function error(...args) {

    if (this.logLevel < 1) return
    const errCode = 1

    let message
    let stack

    if (args[0] instanceof Error) {
        message = this.composeMessage([args[0].message]);
        ({ stack } = args[0])
    } else {
        message = this.composeMessage(args);
        ({ stack } = new Error())
    }

    // const counter = this.counter()

    let prefix = ''

    prefix += this.decorate('b-ber', 'whiteBright', 'bgBlack')
    prefix += ' '
    prefix += this.decorate('ERR!', 'whiteBright', 'bgRed')
    // prefix += ' '
    // prefix += counter
    prefix += ' '

    const formatted = util.format.apply(util, ['%s %s', prefix, message])

    this.taskErrors += 1
    this.errors.push({
        stack,
        message,
        formatted,
    })

    console.log(formatted)
    console.log()
    console.log(stack)
    console.log()
    console.log(this.decorate(`b-ber exited with code ${errCode}`, 'red'))
    process.exit(errCode)
}