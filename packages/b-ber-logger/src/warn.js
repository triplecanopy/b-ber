/* eslint-disable import/prefer-default-export */

import util from 'util'

export function warn(...args) {
    if (this.logLevel < 2) return

    let message
    message = this.composeMessage(args)
    message = args[0] instanceof Error ? this.composeMessage([args[0].message]) : this.composeMessage(args)

    const { stack } = new Error()

    let prefix = ''

    if (this.logLevel > 2) {
        prefix += this.decorate(`[${new Date().toISOString()}]`, 'gray')
        prefix += ' '
    }

    prefix += this.decorate('b-ber', 'whiteBright', 'bgBlack')
    prefix += ' '
    prefix += this.decorate('WARN', 'black', 'bgYellowBright')

    const formatted = util.format.apply(util, ['%s %s', prefix, message])

    this.taskWarnings += 1
    this.warnings.push({
        stack,
        message,
        formatted,
    })

    process.stdout.write(formatted)
    this.newLine()

    if (this.logLevel > 3) {
        process.stdout.write(util.format.call(util, stack.replace(/^Error\s+/, 'Warning ')))
        this.newLine()
        if (this.logLevel > 4) this.newLine()
    }
}
