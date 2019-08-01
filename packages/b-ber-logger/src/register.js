/* eslint-disable import/prefer-default-export */

export function registerSequence(state, command, sequence) {
    const message = this.decorate(
        this.composeMessage(['Preparing to run', sequence.length, `task${sequence.length > 1 ? 's' : ''}`])
    )

    let prefix = ''

    prefix += this.decorate('b-ber', 'whiteBright', 'bgBlack')
    prefix += ' '
    prefix += this.decorate('info', 'green')
    prefix += ' '

    process.stdout.write(`${prefix}${message}`)
    this.newLine()
}
