/* eslint-disable import/prefer-default-export */

export function info(...args) {

    if (this.logLevel < 4) return

    const message = this.decorate(this.composeMessage(args), 'black')

    let prefix = ''

    prefix += this.decorate('b-ber', 'whiteBright', 'bgBlack')
    prefix += ' '
    prefix += this.decorate('info', 'green')
    prefix += ' '

    process.stdout.write(`${prefix}${message}`)
    this.newLine()

}
