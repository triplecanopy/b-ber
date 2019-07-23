/* eslint-disable import/prefer-default-export */

import util from 'util'

export function error(_args) {
    const args = Array.isArray(_args) ? _args : [_args]

    if (this.logLevel < 1) return
    const errCode = 1

    let message
    let stack
    let err
    let formatted

    while ((err = args.shift())) {
        if (err instanceof Error) {
            message = this.composeMessage([err.message])
            ;({ stack } = err)
        } else {
            message = this.composeMessage([err])
            ;({ stack } = new Error())
        }

        let prefix = ''

        prefix += this.decorate('b-ber', 'whiteBright', 'bgBlack')
        prefix += ' '
        prefix += this.decorate('ERR!', 'whiteBright', 'bgRed')

        formatted = util.format.apply(util, ['%s %s', prefix, message])

        this.taskErrors += 1
        this.errors.push({
            stack,
            message,
            formatted,
        })
    }

    this.errors.forEach(processedErr => {
        process.stdout.write(processedErr.formatted)
        this.newLine()
        process.stdout.write(util.format.call(util, processedErr.stack))
        this.newLine()
    })

    process.stdout.write(this.decorate(`b-ber exited with code ${errCode}`, 'whiteBright', 'bgRed'))
    this.newLine()
    process.exit(errCode)
}
