/* eslint-disable import/prefer-default-export */

import util from 'util'

export function info(...args) {
    if (this.logLevel < 4) return

    const message = this.decorate(this.composeMessage(args))

    let prefix = ''

    if (this.logLevel > 2) {
        prefix += this.decorate(`[${new Date().toISOString()}]`, 'gray')
        prefix += ' '
    }

    prefix += this.decorate('b-ber', 'whiteBright', 'bgBlack')
    prefix += ' '
    prefix += this.decorate('info', 'green')
    prefix += ' '

    process.stdout.write(`${prefix}${message}`)
    this.newLine()

    if (this.logLevel > 4) {
        const { stack } = new Error()
        process.stdout.write(util.format.call(util, stack.replace(/^Error\s+/, 'Info ')))
        this.newLine()
        this.newLine()
    }
}
